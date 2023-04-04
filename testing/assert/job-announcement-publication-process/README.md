# Executing Camunda Platform Assert tests

This project demonstrates how to setup a minimal project to run Camunda Platform Assert tests


## How to run it

1. Checkout the project with Git
2. Read and run the [unit tests][1]

### Running the test with maven

In order to run the testsuite with maven you can use:

```
mvn clean test
```

## Further reading
If you want to read more about [Camunda Platform Assert][assert], go to the [testing user guide](https://docs.camunda.org/manual/7.19/user-guide/testing/) in the Camunda docs.


[assert]: https://github.com/camunda/camunda-bpm-platform/tree/master/test-utils/assert
[1]: src/test/java/org/camunda/bpm/engine/test/assertions/examples
