# Configuring Spin Data Format Configuration

This example describes how to configure a data format provided by Camunda Spin. It showcases the configuration of the Jackson-based JSON data format that Spin provides out-of-the-box. JSON serialization is customized by registering a Jackson module with a custom serializer and deserializer.

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

## Standalone Unit Test

### How to run it

1. Checkout the project with Git
2. Read and run the [unit test](src/test/java/org/camunda/bpm/example/spin/dataformat/configuration/JacksonConfiguratorTest.java)

### How it works

When a data format is accessed for the very first time, Spin performs a look up of all data formats on the classpath. After having instantiated the data formats, Spin detects so-called data format configurators and calls these with the detected format instances. Users may provide custom configurators to be able to influence the way a data format serializes and deserializes objects, which is what this example shows.

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

The script task *Extract price* makes use of that structure by defining the following script:

```javascript
var carJson = execution.getVariableTyped("car").getValueSerialized();
var price = S(carJson ).prop("price").numberValue();
execution.setVariable("price", price);
```

In the [test case](src/test/java/org/camunda/bpm/example/spin/dataformat/configuration/JacksonConfiguratorTest.java), we assert that the *price* property was successfully populated.

For this to work, it is crucial that the Spin runtime is able to lookup the `DataFormatConfigurator` implementation. That means, the artifact containing the data format configurator and the corresponding `META-INF/services` file must be on Spin's classpath. For process applications (see below), it is sufficient to have the configurator on the process application's classpath.

You can find the Spin documentation on configuring data formats [here](https://docs.camunda.org/manual/reference/spin/extending-spin/#configuring-data-formats).

### On an Application Server (Shared Engine)

The example code is built to run on Glassfish, WebLogic and WebSphere. It can be adapted to run on Tomcat and JBoss/Wildfly. Read the section on the unit test scenario first because the same configuration code is used here. In addition, this adds a servlet that exposes and endpoint to start a process instance with a `Car` variable. The `ProcessApplicationContext` API is used to ensure that the process variable is serialized using the Spin data format as configured in the process application.

### How to run it

1. Checkout the project with Git
2. Build the project by executing `mvn clean install` in the root folder
3. Deploy the resulting `war` file to the application server
4. Perform a HTTP GET request to the url `http://localhost:8080/dataformat-example/start-process` either with a REST client or simply in the address bar of your browser
5. Go to Cockpit and verify that the process variable named `car` was serialized correctly

### How it works

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

Note that using CDI is not required for this feature to work. The lowest common denominator is the utility class `ProcessApplicationContext`. It can be used in any context to declare process application context before invoking engine API.
