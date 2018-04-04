# Global Spin Data Format Configuration

This example describes how to *globally* configure a data format provided by Camunda Spin.
The example showcases the configuration of the Jackson-based JSON data format that Spin provides out-of-the-box. JSON serialization is customized by registering a Jackson module with a custom serializer and deserializer.

Global configuration means that every application that uses Spin is going to work with the configured data format. In consequence, the configuration applies to every process application in a shared engine scenario. See the example on [process-application-specific configuration](../dataformat-configuration-in-process-application) as well.

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

## Embedded Process Engine

### How to run it

1. Checkout the project with Git
2. Read and run the [unit test](src/test/java/org/camunda/bpm/example/spin/dataformat/configuration/JacksonConfiguratorTest.java)

### How it works

When a data format is accessed for the very first time, Spin performs a look up of all data formats on the classpath. After having instantiated the data formats, Spin detects so-called data format configurators and calls these with the detected format instances. Users can provide custom configurators to influence the way a data format serializes and deserializes objects, which is what this example shows.

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

For this to work, it is crucial that the Spin runtime is able to lookup the `DataFormatConfigurator` implementation. That means, the artifact containing the data format configurator and the corresponding `META-INF/services` file must be on the classpath of the Camunda Spin process engine plugin.

You can find the Spin documentation on configuring data formats [here](https://docs.camunda.org/manual/reference/spin/extending-spin/#configuring-data-formats).

## Shared Process Engine (Application Server)

In order to configure the data format globally for all process applications, perform the following steps:

1. Build the JAR with `mvn clean install`
2. Make it available on the classpath of the artifact `camunda-engine-plugin-spin`. Depending on the application server in use, this may be in varying places (see below).

Where to place the data format configuration JAR on which application server:

| Application Server           | Configuration                                                           |
| ---------------------------- | ----------------------------------------------------------------------- |
| Tomcat                       | Put the JAR and its transitive dependencies into `${TOMCAT_HOME}/lib`.  |
| JBoss/Wildfly                | Deploy the JAR as a JBoss module. Create appropriate module dependencies for the JAR's dependencies. Keep in mind that all transitive dependencies must be declared as well. For this example, the dependencies should be `org.camunda.spin.camunda-spin-dataformat-json-jackson`, `org.camunda.spin.camunda-spin-core`, `com.fasterxml.jackson.core.jackson-databind` (with same version that `camunda-spin-dataformat-json-jackson` uses). Edit `${JBOSS_HOME}/modules/org/camunda/bpm/camunda-engine-plugin-spin/main/module.xml`. Declare a dependency on the JAR module and make sure to set the attribute `services="import"`. |
| Glassfish/WebLogic/Websphere | Add the JAR and any dependencies that are not yet present to the Camunda EAR. Replace the deployed Camunda EAR by the updated one. |
