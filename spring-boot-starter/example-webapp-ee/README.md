# Spring Boot Web application with enterprise Camunda Webapps

This example demonstrates how you can build a Spring Boot application with the embedded Camunda enterprise version.

* Embedded Camunda Engine
* Camunda Enterprise web applications automatically deployed
* Process application and one BPMN process deployed
* Admin user configured with login and password configured in `application.yaml`
* "All" filter automatically created in task-list
* automatic use of a `camunda-license.txt`

It also contains a simple integration test, showing how this can be tested.

You will need:

* credentials to access the enterprise repo in your `settings.xml`
* a valid camunda-license key file in your classpath in the file `camunda-license.txt`

## How is it done

1. To embed the Camunda Engine with Enterprise webapps you must add the following maven coordinates to your `pom.xml`:

```xml
...
  <properties>
    <camunda.version>7.9.0-ee</camunda.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      ...
      <dependency>
        <groupId>org.camunda.bpm</groupId>
        <artifactId>camunda-bom</artifactId>
        <version>${camunda.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency>
      <groupId>org.camunda.bpm.springboot</groupId>
      <artifactId>camunda-bpm-spring-boot-starter-webapp-ee</artifactId>
      <version>3.0.0</version>
    </dependency>
    ...
  </dependencies>
...
```

2. With Spring Boot you usually create an "application" class annotated with `@SpringBootApplication`. In order to have Cthe amunda process application
registered, you can simply add the annotation `@EnableProcessApplication` to the same class and also include a `processes.xml` file to your `META-INF` folder:

```java
@SpringBootApplication
@EnableProcessApplication
public class EnterpriseWebappExampleApplication {

  public static void main(String... args) {
    SpringApplication.run(EnterpriseWebappExampleApplication.class, args);
  }

}
```

3. You can also put BPMN, CMMN and DMN files in your classpath, they will be automatically deployed and registered within the process application.

4. If you want your Camunda license automatically used on Engine startup, just put the file with the name `camunda-license.txt` on your classpath. 

## Run the application and use Camunda Webapps

You can build the application with `mvn clean install` and then run it with the `java -jar` command.

Then you can access the Camunda Webapps in your browser: `http://localhost:8080` (provide login/password from `application.yaml`)