# Camunda Platform Assert Example for JUnit 5

This project contains simple examples of how to write a unit test for Camunda Platform using the [JUnit 5 extension][junit5] and [Camunda Platform Assert][assert].

The project contains the following files:

```
src/
├── main
│   ├── java
│   └── resources
└── test
    ├── java
    │   └── org
    │       └── camunda
    │           └── bpm
    │               └── unittest                                               (1)
    │                   ├── ProcessEngineExtensionExtendWithTest.java
    │                   └── ProcessEngineExtensionRegisterExtensionTest.java
    └── resources
        ├── camunda.cfg.xml                                                    (2)
        └── testProcess.bpmn                                                   (3)
```
Explanation:

* (1) A folder containing two java class. Each class contains a JUnit Test. They use the `ProcessEngineExtension` for bootstrapping the process engine. Each test demonstrates one way to set up the `ProcessEngineExtension`. Both tests also use [camunda-bpm-assert][assert] to make your test life easier.
* (2) Configuration file for the process engine.
* (3) An example BPMN process.

## Running the test with maven

In order to run the testsuite with maven you can use:

```
mvn clean test
```

## Further reading
If you want to read more about [Camunda Platform Assert][assert] or the [Camunda JUnit 5 extension], go to the [testing user guide](https://docs.camunda.org/manual/7.23/user-guide/testing/) in the Camunda docs.

[junit5]: https://github.com/camunda/camunda-bpm-platform/tree/master/test-utils/junit5-extension
[assert]: https://github.com/camunda/camunda-bpm-platform/tree/master/test-utils/assert