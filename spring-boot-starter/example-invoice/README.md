# The Camunda Invoice example in a Spring Boot Web Application

The Invoice example is provided in all of the pre-packaged distros that Camunda provides.
This Camunda example provides the Invoice application inside a Spring Boot application together with all
the necessary adjustments needed to run it out of the box. This includes:

* The Camunda EE Webapps
* The Camunda Rest API

You will need:

* credentials to access the enterprise repo in your `settings.xml`
* a valid camunda-license key file in your classpath in the file `camunda-license.txt`

## How is it done

1. To embed the Camunda Engine with the Enterprise webapps and Rest API you must add the following maven coordinates 
to your `pom.xml`:

```xml
...
  <properties>
    <camunda.version>7.16.0-ee</camunda.version>
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
    </dependency>
    <dependency>
      <groupId>org.camunda.bpm.springboot</groupId>
      <artifactId>camunda-bpm-spring-boot-starter-rest</artifactId>
    </dependency>
    ...
  </dependencies>
...
```

2. For the example Invoice application, the following dependency needs to be added in your `pom.xml` file:

```xml
<dependency>
  <groupId>org.camunda.bpm.example</groupId>
  <artifactId>camunda-example-invoice</artifactId>
  <version>${camunda.version}</version>
  <classifier>classes</classifier>
  <scope>compile</scope>
</dependency>
```

3. An "application" class annotated with `@SpringBootApplication` needs to be created. In order to have the Invoice 
process application registered, add the annotation `@EnableProcessApplication` to the same class, as well as include 
an empty `processes.xml` file to your `META-INF` folder. To ensure that all of necessary BPMN and DMN files are deployed, 
add the following code in your "application" class:

```java
@SpringBootApplication
@EnableProcessApplication
public class Application {

  public static void main(String... args) {
    SpringApplication.run(Application.class, args);
  }

  @Autowired
  protected ProcessEngine processEngine;

  protected InvoiceProcessApplication invoicePa = new InvoiceProcessApplication();

  @PostConstruct
  public void deployInvoice() {
    ClassLoader classLoader = invoicePa.getClass().getClassLoader();

    if(processEngine.getIdentityService().createUserQuery().list().isEmpty()) {
      processEngine.getRepositoryService()
          .createDeployment()
          .addInputStream("invoice.v1.bpmn", classLoader.getResourceAsStream("invoice.v1.bpmn"))
          .addInputStream("reviewInvoice.bpmn", classLoader.getResourceAsStream("reviewInvoice.bpmn"))
          .deploy();
    }
  }

  @EventListener
  public void onPostDeploy(PostDeployEvent event) {
    invoicePa.startFirstProcess(event.getProcessEngine());
  }

}
```

4. You can also put additional BPMN, CMMN and DMN files in your classpath, they will be automatically deployed and 
registered within the process application. Forms HTML needs to be added in the `/resources/static/forms` directory.

5. If you want your Camunda license automatically used on Engine startup, just put the file with the name 
`camunda-license.txt` on your classpath. 

6. Adjust the `src/main/resources/application.yaml` file according to your preferences. The default setup will use an
 embedded H2 instance.

## Run the application and use Camunda Platform

You can build the application with `mvn clean install` and then run it with the `java -jar` command.
You can also execute the application with `mvn spring-boot:run`.

Then you can access the Camunda Webapps in your browser: `http://localhost:8080/` (provide login/password 
from `application.yaml`, default: demo/demo). The Rest API can be available through `http://localhost:8080/engine-rest`.
 
