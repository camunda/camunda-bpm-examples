# Decision Requirements Graph (DRG) Example

This example demonstrates how to use the [Camunda DMN engine] as library
in a custom application to evaluate DRG. The DMN Engine is added to the example as a Maven dependency.
The example contains a Java class with a Main Method in which the DMN Engine is bootstraped and
used to execute a decision loaded from the classpath.

## The used Decision Requirements Diagram

The example uses a DRG from the [DRG reference] to decide which dish should be served to our guests for dinner:

![Dish Decision]

You can find the corresponding DMN XML file [drg-dish-decision.dmn11.xml] in the
resources.

## Code Walkthrough

Refer [dmn-engine-java-main-method] example for Maven dependencies  and bootstrapping the DMN Engine.

### Parsing and Executing the Decision Requirements Diagram

Once the DMN Engine is bootstrapped, it can be used to first parse a decision loaded from the classpath:

```java
InputStream inputStream = DishDecider.class.getResourceAsStream("drg-dish-decision.dmn11.xml");

DmnDecision decision = dmnEngine.parseDecision("Dish", inputStream);

```

The parsed DmnDecsion can be cached and executed multiple times.

In order to execute it, it needs to be passed to the `evaluateDecisionTable` method:

```java
DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
```

The File [DishDecider.java] contains the complete source code including variable handling and parsing
of the command line arguments.

### Writing Tests with JUnit

> Note: You can read more about decision testing in our [User Guide].

[DrgDecisionDishTest.java] uses the `DmnEngineRule` JUnit Rule to create a default DMN engine and than test different
inputs on the decision:

```java
@Test
public void shouldServeGuestsOnAWeekDayWithTemperatureOfTenDegree() {
  VariableMap variables = Variables
    .putValue("temperature", 8)
    .putValue("dayType", "Weekday");
   
  DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
  assertEquals("Spareribs", result.getSingleResult().getSingleEntry());
}
```

## Running the Example

The example expects two arguments. First, the current temperature (in number) and second the type of day (Weekday, Holiday, Weekend).

To run it you can either use maven:

```
mvn compile exec:java
```

This will compile the project and execute it with the arguments
`35` for the current temperature and `Weekday` for the type of day.

This should produce an output which contains:

```
Dish Decision:
	I would recommend to serve: Beans salad
```

You can specify other arguments with maven. For example for your cold holiday party :

```
mvn compile exec:java -Dexec.args="2 Holiday"
```

You can also create a executable Java jar file with:

```
mvn clean package
```

This will produce a `DishDecider.jar` file in the `target` folder. You can
than call it like any other jar file:

```
java -jar target/DishDecider.jar 25 Weekend

Dish Decision:
        I would recommend to serve: Steak
```


[Camunda DMN engine]: https://docs.camunda.org/manual/user-guide/dmn-engine/
[DRG reference]: http://stage.docs.camunda.org/manual/develop/reference/dmn11/drg/
[Dish Decision]: src/main/resources/org/camunda/bpm/example/drg/dish-decision.png
[drg-dish-decision.dmn11.xml]: src/main/resources/org/camunda/bpm/example/drg/drg-dish-decision.dmn11.xml
[DishDecider.java]: src/main/java/org/camunda/bpm/example/drg/DishDecider.java
[User Guide]: https://docs.camunda.org/manual/user-guide/dmn-engine/testing/
[DrgDecisionDishTest.java]: src/test/java/org/camunda/bpm/example/drg/DrgDecisionDishTest.java
[dmn-engine-java-main-method]: ../dmn-engine-java-main-method/ 