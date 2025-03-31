# Register Your Process Engine in JUnit 5 and Camunda Platform Assert

This examples shows how to create a process engine in your test class without a configuration file and register it for your test runs using the [JUnit 5 extension][junit5] and [Camunda Platform Assert][assert].

The project contains the following files:

```
src
├── main
│   ├── java
│   └── resources
└── test
    ├── java
    │   └── org
    │       └── camunda
    │           └── bpm
    │               └── unittest
    │                    └── UseProcessEngineTest.java   (1)
    └── resources
        └── testProcess.bpmn                             (2)
```
Explanation:
* (1) The test class that
    * creates the process engine from the configuration builder
    * registers the process engine for the JUnit 5 test
    * registers the process engine for the Camunda Platform Assert library
* (2) The process model to test

## Prerequisites
* Java 17/21

## Running the test with maven

In order to run the test with maven you can use:

```
mvn clean test
```

[junit5]: https://github.com/camunda/camunda-bpm-platform/tree/master/test-utils/junit5-extension
[assert]: https://github.com/camunda/camunda-bpm-platform/tree/master/test-utils/assert