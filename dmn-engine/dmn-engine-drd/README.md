# Camunda Dmn Engine in a Java Main Method

This example demonstrates how to use the [Camunda DMN engine] as library
in a custom application. The DMN Engine is added to the example as a Maven dependency.
The example contains a Java class with a Main Method in which the DMN Engine is bootstraped and
used to execute a decision loaded from the classpath.

## The used Decision Requirements Diagram

The example uses a DRD from the [DRD reference] to decide which dish should be served to our guests for dinner:

![Dish Decision]

You can find the corresponding DMN XML file [drd-dish-decision.dmn11.xml] in the
resources.

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

### Parsing and Executing the Decision Requirements Diagram

Once the DMN Engine is bootstrapped, it can be used to first parse a decision loaded from the classpath:

```java
InputStream inputStream = DishDecider.class.getResourceAsStream("drd-dish-decision.dmn11.xml");

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

[DrdDecisionDishTest.java] uses the `DmnEngineRule` JUnit Rule to create a default DMN engine and than test different
inputs on the decision:

```java
public class DrdDecisionDishTest {
  
  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();
  
  public DmnEngine dmnEngine;
  public DmnDecision decision;
  
  @Before
  public void parseDecision() {
    InputStream inputStream = DrdDecisionDishTest.class
      .getResourceAsStream("drd-dish-decision.dmn11.xml");
    dmnEngine = dmnEngineRule.getDmnEngine();
    decision = dmnEngine.parseDecision("Dish", inputStream);
  }
  
  @Test
  public void shouldServeGuestsOnAWeekEndWithTemperatureOfTwentyDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 20)
      .putValue("dayType", "Weekend");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Steak", result.getSingleResult().getSingleEntry());
  }
  
  @Test
  public void shouldServeGuestsOnAWeekDayWithTemperatureOfTenDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 8)
      .putValue("dayType", "WeekDay");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Spareribs", result.getSingleResult().getSingleEntry());
  }
  
  @Test
  public void shouldServeGuestsOnAHolidayWithTemperatureOfThirtyDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 35)
      .putValue("dayType", "Holiday");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Beans salad", result.getSingleResult().getSingleEntry());
  }
  
}
```

## Running the Example

The example expects two arguments. First, the current temperature and second the type of day (WeekDay, Holiday, Weekend).

To run it you can either use maven:

```
mvn compile exec:java
```

This will compile the project and execute it with the arguments
`35` for the current temperature and `WeekDay` for the type of day.

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
[DRD reference]: http://stage.docs.camunda.org/manual/develop/reference/dmn11/drd/
[Dish Decision]: src/main/resources/org/camunda/bpm/example/drd/dish-decision.png
[dish-decision.dmn11.xml]: src/main/resources/org/camunda/bpm/example/dish-decision.dmn11.xml
[Camunda Modeler]: https://camunda.org/dmn/tool/
[DishDecider.java]: src/main/java/org/camunda/bpm/example/DishDecider.java
[User Guide]: https://docs.camunda.org/manual/user-guide/dmn-engine/testing/
[DishDecisionTest.java]: src/test/java/org/camunda/bpm/example/DishDecisionTest.java
