# Spring Boot Web application with embedded Camunda engine

This example demonstrates how you can build Spring Boot Web application having following configured:
* Embedded Camunda engine accessible via REST
* Process application and one BPMN process deployed
* Spring Boot Security basic authentication

It also contains a couple of integration tests, showing how this can be tested.

## How is it done

1. To embed the Camunda Engine accessible via REST API you must add following dependency to your `pom.xml`:

```xml
...
<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-rest</artifactId>
  <version>3.0.0</version>
</dependency>
...
```

2. With Spring Boot you usually create an "application" class annotated with `@SpringBootApplication`. In order to have the Camunda process application
registered, you can simply add an annotation `@EnableProcessApplication` to the same class and also include `processes.xml` file to your `META-INF` folder:

```java
@SpringBootApplication
@EnableProcessApplication
public class RestApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(RestApplication.class, args);
  }

}
```

3. You can also put BPMN, CMMN and DMN files in your classpath, they will be automatically deployed and registered within a process application.

>Note: Basic authentication is configured on Spring Boot level, this is NOT Camunda Engine authentication. Check [this docs](https://docs.camunda.org/manual/latest/) 
to configure Basic Authentication for Camunda Engine REST API.
 
## Run the application and call the REST API

You can then build the application with `mvn clean install` and then run it with `java -jar` command.

Then you can access REST API in browser: `http://localhost:8080/rest/engine` (provide login/password: user/password).

Another endpoint to test: `http://localhost:8080/rest/engine/default/process-definition` - this will show you the deployed process definition.
