# Camunda Platform Runtime Quarkus Datasource Example

This example uses Quarkus, the Supersonic Subatomic Java Framework, in combination 
with the extension  `camunda-bpm-quarkus-engine`.

The Datasource example demonstrates how you can use the Camunda Platform Runtime Engine 
in combination with Quarkus to perform the following:

* Configure a custom datasource used by the engine.
  * The example uses an H2 in-memory database by default, but other 
    Camunda-supported datasouce configurations are available.
* Deploy a simple [approval process](src/main/resources/bpmn/process.bpmn).
* Manage transactions with Quarkus and the Camunda Platform Runtime Engine.
* Expose a REST API endpoint to evaluate a given amount.

To run the example you can [package and run](#packaging-and-running-the-application) the application. 
When you go to the following URLs:

* http://localhost:8080/approval-process/12
* http://localhost:8080/approval-process/-12

You should see the following logs:

```shell
INFO  [org.cam.bpm.qua.exa.dat.ApprovalServiceDelegate] (main) Result of amount evaluation: true
INFO  [org.cam.bpm.qua.exa.dat.ApprovalServiceBean] (main) The amount was approved
INFO  [org.cam.bpm.qua.exa.dat.ApprovalServiceDelegate] (main) Result of amount evaluation: false
```

Alternatively, you can execute the [unit test case](src/test/java/org/camunda/bpm/quarkus/example/datasource/ApprovalProcessTest.java).

If you want to learn more about Quarkus, please visit: https://quarkus.io/.

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

The application is now runnable using `java -jar target/camunda-bpm-quarkus-example-datasource-1.0.0-SNAPSHOT-runner.jar`.