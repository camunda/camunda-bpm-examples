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

## How to run it

1. Checkout the project with Git
2. Read and run the [unit test](src/test/java/org/camunda/bpm/example/spin/dataformat/configuration/JacksonConfiguratorTest.java)

## How it works

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

For this to work, it is crucial that the Spin runtime is able to lookup the `DataFormatConfigurator` implementation. That means, the artifact containing the data format configurator and the corresponding `META-INF/services` file must be on Spin's classpath.

You can find the Spin documentation on configuring data formats [here](http://docs.camunda.org/latest/api-references/spin/#extending-spin-configuring-data-formats).

## How it works on an application server with shared engine

This example demonstrates the configuration functionality via a unit test.

In order to configure data formats on an application server and a shared engine scenario, do the following:

* Make sure to use the [camunda-spin-core](http://docs.camunda.org/latest/guides/user-guide/#camunda-spin-core) dependencies in your application server, not  [camunda-spin-dataformat-all](http://docs.camunda.org/latest/guides/user-guide/#camunda-spin-dataformat-all)
* Implement a configurator as in this example
* Build the Maven project; the result is a jar file that contains the configurator and the declaration file under `META-INF/services`
* Ensure that the jar file is available on the classpath of the `camunda-spin-core` artifact

*Known limitation*:
The configuration artifact can not be deployed as part of a process application if Spin itself is not part of it. That means, dependencies of the configuration artifact can also not be part of the process application.
