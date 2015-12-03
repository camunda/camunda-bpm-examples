# Camunda Dmn Engine in a Java Main Method

This example demonstrates how to use the [Camunda DMN engine] as library
in a custom application. The DMN Engine is added to the example as a Maven dependency.
The example contains a Java class with a Main Method in which the DMN Engine is bootstraped and
used to execute a decision table loaded from the classpath.

## The used DMN Decision Table

The example uses a decision table from the [DMN tutorial] to decided which dish should be served to our guests for dinner:

![Dish Decision]

You can find the corresponding DMN XML file [dish-decision.dmn11.xml] in the
resources. To modify it you can use the [Camunda Modeler].

## Code Walkthrough

### Maven Dependencies

Include the DMN engine BOM for dependency management:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.camunda.bpm.dmn</groupId>
      <artifactId>camunda-engine-dmn-bom</artifactId>
      <version>${version.camunda}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

Add the DMN engine as a dependency:

```xml
<dependency>
  <groupId>org.camunda.bpm.dmn</groupId>
  <artifactId>camunda-engine-dmn</artifactId>
</dependency>
```

Include some slf4j backend. The simplest option is to not add a backend at all but simply redirect logging to jdk logging:

```xml
<!-- redirect slf4j logging to jdk logging -->
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>slf4j-jdk14</artifactId>
  <version>1.7.12</version>
</dependency>
```

### Bootstrap the DMN Engine in a Main Method

The Java Class [DishDecider.java] has a main method which bootstraps the DMN Engine using the
default configuration:

```java
public class DishDecider {

  public static void main(String[] args) {

    // create a new default DMN engine
    DmnEngine dmnEngine = DmnEngineConfiguration
      .createDefaultDmnEngineConfiguration()
      .buildEngine();

  }

}

```

### Parsing and Executing the Decision Table

Once the DMN Engine is bootstrapped, it can be used to first parse a decision loaded from the classpath:

```java
InputStream inputStream = DishDecider.class.getResourceAsStream("dish-decision.dmn11.xml");

DmnDecision decision = dmnEngine.parseDecision("decision", inputStream);

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

[DishDecisionTest.java] uses the `DmnEngineRule` JUnit Rule to create a default DMN engine and than test different
inputs on the decision:

```java
public class DishDecisionTest {

  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();

  public DmnEngine dmnEngine;
  public DmnDecision decision;

  @Before
  public void parseDecision() {
    InputStream inputStream = DishDecisionTest.class.getResourceAsStream("dish-decision.dmn11.xml");
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

## Running the Example

The example expects two arguments. First, the current season of the year and second the number of expected guests.

To run it you can either use maven:

```
mvn compile exec:java
```

This will compile the project and execute it with the arguments
`Winter` for the current season and `4` for the number of expected guests.

This should produce an output which contains:

```
Dish Decision:
        I would recommend to serve: Roastbeef
```

You can specify other arguments with maven. For example for your summer party:

```
mvn compile exec:java -Dexec.args="Summer 32"
```

You can also create a executable Java jar file with:

```
mvn clean package
```

This will produce a `DishDecider.jar` file in the `target` folder. You can
than call it like any other jar file:

```
java -jar target/DishDecider.jar Spring 6

Dish Decision:
        I would recommend to serve: Steak
```


[Camunda DMN engine]: https://docs.camunda.org/manual/user-guide/dmn-engine/
[DMN tutorial]: https://camunda.org/dmn/tutorial/
[Dish Decision]: src/main/resources/org/camunda/bpm/example/dish-decision.png
[dish-decision.dmn11.xml]: src/main/resources/org/camunda/bpm/example/dish-decision.dmn11.xml
[Camunda Modeler]: https://camunda.org/dmn/tool/
[DishDecider.java]: src/main/java/org/camunda/bpm/example/DishDecider.java
[User Guide]: https://docs.camunda.org/manual/user-guide/dmn-engine/testing/
[DishDecisionTest.java]: src/test/java/org/camunda/bpm/example/DishDecisionTest.java
