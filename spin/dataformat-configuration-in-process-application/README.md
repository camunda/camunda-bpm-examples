# Process-Application-Level Spin Data Format Configuration

This example describes how to configure a data format provided by Camunda Spin *on process application level*.
It showcases the configuration of the Jackson-based JSON data format that Spin provides out-of-the-box. JSON serialization is customized by registering a Jackson module with a custom serializer and deserializer.

Process-application-specific configuration means that configuration code is part of he process application and therefore isolated from other applications. Note that this approach is currently limited to Object variable (de-)serialization. See the example on [global data format configuration](../dataformat-configuration-global) for how to configure a data format such that it applies to all applications using Spin.

In particular, we examine how to customize the serialization of the class [Car](src/main/java/org/camunda/bpm/example/spin/dataformat/configuration/Car.java):

```java
public class Car {

  protected Money price;

  public Money getPrice() {
    return price;
  }

  public void setPrice(Money price) {
    this.price = price;
  }
}
```

`Car` references [Money](src/main/java/org/camunda/bpm/example/spin/dataformat/configuration/Money.java):

```java
public class Money {

  protected int amount;

  public Money(int amount) {
    this.amount = amount;
  }

  public int getAmount() {
    return amount;
  }
}
```

With default Jackson serialization, an object `new Car(1000)` is serialized as `{"price" : {"amount" : 1000}}`. In the following, we describe how to configure the serialization such that the result is `{"price" : 1000}` and give an example how this integrates with process variables and process execution.

We use the following process:

![JSON serialization process](src/main/resources/testProcess.png)

The script task *Extract price* expects a `Car` JSON object in the format of `{"price" : 1000}` and fails otherwise.

# Overview

## How to run it

1. Checkout the project with Git
2. Run the Maven build `mvn clean install -P${profile}`. Dependending on the application server you use, set `${profile}` to `weblogic` (for WebLogic, Websphere, Glassfish), `tomcat`, `jboss` or `wildfly`
3. Deploy the resulting WAR file to your application server
4. Perform a HTTP GET request to the url `http://localhost:8080/dataformat-example/start-process` (or `http://localhost:8080/camunda-example-spin-dataformat-configuration-process-application-0.0.1-SNAPSHOT/start-process` if you're using Tomcat) either with a REST client or simply in the address bar of your browser
5. Go to Cockpit and verify that the process variable named `car` was serialized correctly


## How it works

When a process application is deployed, a set of process-application-specific Spin data formats is bootstrapped. After data formats instantiation, Spin detects so-called data format configurators and calls these with the detected format instances. Users can provide custom configurators to influence the way a data format serializes and deserializes objects, which is what this example shows.

### Data Format Configuration

Configuring data formats requires to implement the SPI [DataFormatConfigurator](https://github.com/camunda/camunda-spin/blob/master/core/src/main/java/org/camunda/spin/spi/DataFormatConfigurator.java) and declare implementations of it in a file `META-INF/services/org.camunda.spin.spi.DataFormatConfigurator`. Here, the class [JacksonDataFormatConfigurator](src/main/java/org/camunda/bpm/example/spin/dataformat/configuration/JacksonDataFormatConfigurator.java) is such an implementation. It has the following contents:

```java
import org.camunda.spin.impl.json.jackson.format.JacksonJsonDataFormat;
import org.camunda.spin.spi.DataFormatConfigurator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

public class JacksonDataFormatConfigurator implements DataFormatConfigurator<JacksonJsonDataFormat> {

  public void configure(JacksonJsonDataFormat dataFormat) {
    ObjectMapper objectMapper = dataFormat.getObjectMapper();
    SimpleModule module = new SimpleModule();
    module.addDeserializer(Money.class, new MoneyJsonDeserializer());
    module.addSerializer(Money.class, new MoneyJsonSerializer());
    objectMapper.registerModule(module);
  }

  public Class<JacksonJsonDataFormat> getDataFormatClass() {
    return JacksonJsonDataFormat.class;
  }

}
```

The method `getDataFormatClass` declares the kind of data formats a configurator is able to configure. The method `configure` is the callback invoked by the Spin runtime after data format instantiation. Here, we register in form of the classes [MoneyJsonSerializer](src/main/java/org/camunda/bpm/example/spin/dataformat/configuration/MoneyJsonSerializer.java) and [MoneyJsonDeserializer](src/main/java/org/camunda/bpm/example/spin/dataformat/configuration/MoneyJsonDeserializer.java) a Jackson serializer and deserializer for the `Money` class. These make sure that a `Car` object is serialized in the way we need it.

### Access API from Outside

The CDI bean [ProcessInstanceStarterBean](src/main/java/org/camunda/bpm/example/spin/dataformat/servlet/ProcessInstanceStarterBean.java) has a method that starts a process instance with a serialized `Car` value.

```java
@ApplicationScoped
public class ProcessInstanceStarterBean {

  @InProcessApplicationContext
  public ProcessInstance startProcess(Car car) {
    ProcessEngine processEngine = BpmPlatform.getDefaultProcessEngine();

    RuntimeService runtimeService = processEngine.getRuntimeService();

    return runtimeService.startProcessInstanceByKey("testProcess",
        Variables.createVariables().putValueTyped("car",
            Variables
              .objectValue(car)
              .serializationDataFormat(DataFormats.JSON_DATAFORMAT_NAME)
              .create()));

  }
}
```

As the process engine is not able to guess by itself which JSON data format to use for serializing the variable, we have to tell it that we want to use the format defined in the process application. This is solved here by defining a custom CDI annotation `@InProcessApplicationContext`. A custom CDI interceptor [ProcessApplicationContextInterceptor](src/main/java/org/camunda/bpm/example/spin/dataformat/servlet/ProcessApplicationContextInterceptor.java) is notified whenever this annotation is present. This interceptor determines the context process application and declares it using the utility class [ProcessApplicationContext](http://stage.docs.camunda.org/javadoc/camunda-bpm-platform/7.5-SNAPSHOT/org/camunda/bpm/application/ProcessApplicationContext.html):

```java
@InProcessApplicationContext
@Interceptor
public class ProcessApplicationContextInterceptor {

  @Inject
  protected ProcessApplicationInterface processApplication;

  @AroundInvoke
  public Object performContextSwitch(InvocationContext invocationContext) throws Exception {

    try {
      ProcessApplicationContext.setCurrentProcessApplication(processApplication.getName());
      return invocationContext.proceed();
    } finally {
      ProcessApplicationContext.clear();
    }
  }

  public ProcessApplicationInterface getProcessApplication() {
    return processApplication;
  }

  public void setProcessApplication(ProcessApplicationInterface processApplication) {
    this.processApplication = processApplication;
  }

}
```

`ProcessApplicationContext#setCurrentProcessApplication` tells the process engine to access process-application-specific resources such as Spin data formats when engine API is used within the annotated method. The engine can then successfully use the data format configured in the process application.

For this to work on Tomcat (a non-Java-EE server), we have include Weld in the process application. However, note that using CDI is not required for this feature to work. The lowest common denominator is the utility class `ProcessApplicationContext`. It can be used in any context to declare process application context before invoking engine API.

Read the documentation on [Process Application Resource Access](https://docs.camunda.org/manual/latest/user-guide/process-applications/process-application-resources/) for why it is required to declare process application context.

### Delegation Code

The script task *Extract price* makes use of that structure by defining the following script:

```javascript
var carJson = execution.getVariableTyped("car").getValueSerialized();
var price = S(carJson ).prop("price").numberValue();
execution.setVariable("price", price);
```

Here, we do not have to declare the process application context. For delegation code (i.e. code that is called by the process engine), the process engine implicitly knows the process application context.

