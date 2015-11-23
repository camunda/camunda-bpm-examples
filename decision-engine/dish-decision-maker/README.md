# Dish Decision Maker

This example demonstrates how to use the [Camunda DMN engine] as library
in your own application. We use a decision table from our [DMN tutorial]
to decided which dish we should serve our guests for dinner:

![Dish Decision]

You can find the corresponding DMN XML file [dish-decision.dmn11.xml] in the
resources. To modify it you can use the [Camunda DMN online modeler].

# Decided which dish to serve

The example contains a Java main class [DishDecisionMaker.java] which expects to arguments. First
the current season of the year and second the number of expected guests.

To run it you can either use maven:

```
mvn compile java:exec
```

This will compile the compile the project and will execute it with the arguments
`Winter` for the current season and `4` for the number of expected guests.

This should produce an output which contains:

```
Dish Decision:
        I would recommend to serve: Roastbeef
```

You can specify other arguments with maven. For example for your summer party:

```
mvn compile java:exec -Dexec.args="Summer 32"
```

You can also create a executable Java jar file with:

```
mvn clean package
```

This will produce a `DishDecisionMaker.jar` file in the `target` folder. You can
than call it like any other jar file:

```
java -jar target/DishDecisionMaker.jar Spring 6

Dish Decision:
        I would recommend to serve: Steak
```

# Test your delicious decision

As this decision is indeed delicate you should test it properly before going
to production. It can be quite expensive to server Dry Aged Gourmet Steak
to 32 people. You can read more about decision testing in our [User Guide].

For now have a look at the source code in the [DishDecisionTest.java] file.

It uses a JUnit rule to create a default DMN engine and than test different
inputs on the decision.

```java
public class DishDecisionTest {

  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();

  public DmnEngine dmnEngine;
  public DmnDecision decision;

  @Before
  public void parseDecision() {
    InputStream inputStream = getClass().getResourceAsStream("dish-decision.dmn11.xml");
    dmnEngine = dmnEngineRule.getDmnEngine();
    decision = dmnEngine.parseDecision("decision", inputStream);
  }

  @Test
  public void shouldServeDryAgedInSpringForFewGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 4);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Dry Aged Gourmet Steak", result.getSingleResult().getSingleEntry());
  }

  @Test
  public void shouldServeSteakInSpringForSomeGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 7);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Steak", result.getSingleResult().getSingleEntry());
  }

  @Test
  public void shouldServeStewInSpringForMayGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 20);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Stew", result.getSingleResult().getSingleEntry());
  }

}
```

[Camunda DMN engine]: https://docs.camunda.org/manual/latest/user-guide/dmn-engine/
[DMN tutorial]: https://camunda.org/dmn/tutorial/
[Dish Decision]: src/main/resources/org/camunda/bpm/example/dish-decision.png
[dish-decision-dmn11.xml]: src/main/resources/org/camunda/bpm/example/dish-decision.dmn11.xml
[Camunda DMN online modeler]: https://camunda.org/dmn/demo/
[DishDecisionMaker.java]: src/main/java/org/camunda/bpm/example/DishDecisionMaker.java
[User Guide]: https://docs.camunda.org/manual/latest/user-guide/dmn-engine/testing/
[DishDecisionTest.java]: src/test/java/org/camunda/bpm/example/DishDecisionTest.java
