# Camunda Platform Runtime: Quarkus Engine Extension Spin Example

This example uses Quarkus, the Supersonic Subatomic Java Framework, 
in combination with the extension `camunda-bpm-quarkus-engine`.

If you want to learn more about Quarkus, please visit: https://quarkus.io/.

The example demonstrates how you can use the Camunda Platform Runtime Engine in combination with Quarkus to spawn a node that:

* Connects to an H2 on-disk database.
* [Registers the Camunda Spin Process Engine Plugin](org/camunda/bpm/quarkus/example/EngineConfiguration.java).
* Bootstraps a process engine.
* [Automatically deploys](org/camunda/bpm/quarkus/example/ResourceDeployment.java) the resource [process.bpmn](src/main/resources/process.bpmn) to the process engine.
* Exposes a REST endpoint that:
  * starts a process instance
  * stores the JSON payload as a process variable
  * calls the [StoreOderItemService](org/camunda/bpm/quarkus/example/service/StoreOrderItemService.java) bean.

To store order items, perform a REST API request like this:

```REST
POST http://localhost:8080/store-order-items
Content-Type: application/json

[
  {
    "name": "Skin Care",
    "price": 4.56
  },
  {
    "name": "Watch",
    "price": 60.55
  },
  {
    "name": "Cookies",
    "price": 1.99
  },
  {
    "name": "Pasta",
    "price": 0.95
  }
]
```

Observe the console and watch out for the following log output:

```
2021-08-25 15:04:16,772 INFO  [org.cam.bpm.qua.exa.ser.StoreOrderItemService] (executor-thread-0) Hurray, order item Skin Care with price 4,56 stored!
2021-08-25 15:04:16,782 INFO  [org.cam.bpm.qua.exa.ser.StoreOrderItemService] (executor-thread-0) Hurray, order item Watch with price 60,55 stored!
2021-08-25 15:04:16,788 INFO  [org.cam.bpm.qua.exa.ser.StoreOrderItemService] (executor-thread-0) Hurray, order item Cookies with price 1,99 stored!
2021-08-25 15:04:16,793 INFO  [org.cam.bpm.qua.exa.ser.StoreOrderItemService] (executor-thread-0) Hurray, order item Pasta with price 0,95 stored!
```

## Requirements

* Java 11+
* Maven 3.8.1+

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:
```shell script
mvn clean compile quarkus:dev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at http://localhost:8080/q/dev/.

## Packaging and running the application

The application can be packaged using:
```shell script
mvn clean package
```
It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

If you want to build an _über-jar_, execute the following command:
```shell script
mvn clean package -Dquarkus.package.type=uber-jar
```

The application is now runnable using `java -jar target/camunda-bpm-quarkus-example-spin-plugin-1.0.0-SNAPSHOT-runner.jar`.