# Spring Boot Web application with embedded Camunda engine

This example demonstrates how you can build Spring Boot Web application having following configured:
* Embedded Camunda engine accessible via REST
* Process application and one Decision Definition deployed


## How is it done

1. To embed the Camunda Engine accessible via REST API you must add following dependency to your `pom.xml`:

```xml
...
<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-rest</artifactId>
  <version>7.14.0</version>
</dependency>
...
```

2. With Spring Boot you usually create an "application" class annotated with `@SpringBootApplication`. In order to have the Camunda process application
registered, you can simply add an annotation `@EnableProcessApplication` to the same class and also include `processes.xml` file to your `META-INF` folder:

```java
@SpringBootApplication
public class DmnRestApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(RestApplication.class, args);
  }

}
```

3. You can also put BPMN, CMMN and DMN files in your classpath, they will be automatically deployed and registered within a process application.

This example deploys a [decision definition](./src/main/resources/dmn/check-order.dmn).

## Run the application and call the REST API

You can then build the application with `mvn clean install` and then run it with `java -jar` command.

Then you can access REST API in browser: `http://localhost:8080/engine-rest/decision-definition` - this will show you the deployed decision definition.

In order to evaluate a decision, execute the following:

`POST http://localhost:8080/engine-rest/decision-definition/key/checkOrder/evaluate`

```json
{
  "variables" : {
    "sum" : { "value" : 1100, "type" : "Double" },
    "status" : { "value" : "silver", "type" : "String" }
  }
}
```

Or have a look at the JUnit test in the project.
