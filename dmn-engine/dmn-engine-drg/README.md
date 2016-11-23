# Decision Requirements Graph (DRG) Example

This example demonstrates how to use the [Camunda DMN engine] as library
in a custom application to evaluate a decision from a DRG. The DMN Engine is added to the example as a Maven dependency.
The example contains a Java class with a Main Method in which the DMN Engine is bootstraped and
used to execute a decision loaded from the classpath.

## The used Decision Requirements Graph

The example uses the DRG from the [Reference Guide] to decide which beverages should be served to our guests for dinner:

![Dinner Decisions]

---

![Beverages Decision]

---

![Dish Decision]

You can find the corresponding DMN XML file [dinnerDecisions.dmn] in the
resources.

## Code Walkthrough

Refer [dmn-engine-java-main-method] example for Maven dependencies  and bootstrapping the DMN Engine.

### Parsing and Executing the Decision of the DRG

Once the DMN Engine is bootstrapped, it can be used to first parse a decision loaded from the classpath:

```java
InputStream inputStream = BeveragesDecider.class.getResourceAsStream("dinnerDecisions.dmn");

DmnDecision decision = dmnEngine.parseDecision("beverages", inputStream);

```

The parsed DmnDecsion can be cached and executed multiple times.

In order to execute it, it needs to be passed to the `evaluateDecision` method:

```java
DmnDecisionResult result = dmnEngine.evaluateDecision(decision, variables);
```

The File [BeveragesDecider.java] contains the complete source code including variable handling and parsing
of the command line arguments.

### Writing Tests with JUnit

> Note: You can read more about decision testing in our [User Guide].

[DrgDecisionTest.java] uses the JUnit Rule `DmnEngineRule` to create a default DMN engine and than test different
inputs on the decision:

```java
@Test
public void shouldServeGuiness() {

  VariableMap variables = Variables
    .putValue("season", "Spring")
    .putValue("guestCount", 10)
    .putValue("guestsWithChildren", false);

  DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

  assertThat(result.collectEntries("beverages"))
    .hasSize(2)
    .contains("Guiness", "Water");
}
```

## Running the Example

The example expects three arguments. First, the current season, second the number of guests (integer) and third if guests has children (boolean).

To run it you can either use maven:

```
mvn compile exec:java
```

This will compile the project and execute it with the arguments
`Spring` for the current season, `10` for the guest count and `false` for guests with children.

This should produce an output which contains:

```
Beverages:
	I would recommend to serve: [Guiness, Water]
```

You can specify other arguments with maven. For example:

```
mvn compile exec:java -Dexec.args="Winter 7 true"
```

You can also create a executable Java jar file with:

```
mvn clean package
```

This will produce a `BeveragesDecider.jar` file in the `target` folder. You can
than call it like any other jar file:

```
java -jar target/BeveragesDecider.jar Spring 10 false

Beverages:
        I would recommend to serve: [Guniess, Water]
```


[Camunda DMN engine]: https://docs.camunda.org/manual/user-guide/dmn-engine/
[Reference Guide]: http://docs.camunda.org/manual/reference/dmn11/drg/
[User Guide]: https://docs.camunda.org/manual/user-guide/dmn-engine/testing/
[Dinner Decisions]: src/main/resources/org/camunda/bpm/example/drg/dinnerDecisions.png
[Beverages Decision]: src/main/resources/org/camunda/bpm/example/drg/beverages.png
[Dish Decision]: src/main/resources/org/camunda/bpm/example/drg/dish.png
[dinnerDecisions.dmn]: src/main/resources/org/camunda/bpm/example/drg/dinnerDecisions.dmn
[BeveragesDecider.java]: src/main/java/org/camunda/bpm/example/drg/BeveragesDecider.java
[DrgDecisionTest.java]: src/test/java/org/camunda/bpm/example/drg/DrgDecisionTest.java
[dmn-engine-java-main-method]: ../dmn-engine-java-main-method/ 
