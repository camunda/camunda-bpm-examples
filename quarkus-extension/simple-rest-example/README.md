# Camunda Platform Runtime Quarkus Example

This example uses Quarkus, the Supersonic Subatomic Java Framework, 
in combination with the extension  `camunda-bpm-quarkus-engine`.

It demonstrates how you can use the Camunda Platform Runtime Engine in combination with Quarkus to spawn a node that:

* Connects to a H2 in-memory database.
* Configures and bootstraps a process engine.
* Exposes two REST endpoints which:
  * Deploy the [process.bpmn](src/main/resources/process.bpmn).
  * Start a process instance that calls the [MyServiceDelegate](src/main/java/org/acme/MyServiceDelegate.java) bean.

You can:
1. Go to [http://localhost:8080/deploy-process]() to deploy the provided [BPMN process](src/main/resources/process.bpmn).
2. Go to [http://localhost:8080/start-process]() to start a process instance of the deployed BPMN process.
3. Observe the console and watch out for the following log output:
   ```
   2021-08-05 15:41:52,004 INFO  [org.acm.MyServiceDelegate] (executor-thread-0) Hurray! MyService has been called!
   ```

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

The application is now runnable using `java -jar target/code-with-quarkus-1.0.0-SNAPSHOT-runner.jar`.