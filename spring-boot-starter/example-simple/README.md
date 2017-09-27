# Simple Camunda Spring Boot application

This example only uses `camunda-bpm-spring-boot-starter`, so it does not start an embedded tomcat and provides no REST API.
It demonstrates how Camunda can be used in combination with Spring Boot to spawn a node that:

- connects to a database (and sets it up if needed, in this case h2 in memory db)
- configures and starts a process engine
- deploys the 'sample.bpmn' process
- starts this process
- automatically executes the user task
- JobExecutor executes async service task
- once the process instance is ended, the spring boot application terminates

It also demonstrates usage of `application.yaml` configuration file.

## How is it done

1. To embed Camunda Engine you must add following dependency in your `pom.xml`:
   
```xml
...
<dependency>
 <groupId>org.camunda.bpm.springboot</groupId>
 <artifactId>camunda-bpm-spring-boot-starter</artifactId>
 <version>2.3.0-SNAPSHOT</version>
</dependency>
...
```

2. With Spring Boot you usually create "application" class annotated with `@SpringBootApplication`. In order to have Camunda process application
registered, you can simply add annotation `@EnableProcessApplication` to the same class and also include `processes.xml` file in your `META-INF` folder:

```java
@SpringBootApplication
@EnableProcessApplication("mySimpleApplication")
public class SimpleApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(SimpleApplication.class, args);
  }

}
```

3. You can simply inject engine services in your Spring beans using `@Autowired` annotation.

## Run the application and check the result

You can then build the application by calling `mvn clean install` and then run it with `java -jar` command.

Observe log entries similar to these: 

```text
postDeploy: PostDeployEvent{processEngine=org.camunda.bpm.engine.impl.ProcessEngineImpl@6973b51b}
started instance: 0f1cd511-a1f0-11e7-8e5d-0a0027000006
completed task: Task[0f200964-a1f0-11e7-8e5d-0a0027000006]
executed sayHelloDelegate: ProcessInstance[380e1597-a206-11e7-8d39-0a0027000006]
processinstance ended!
preUndeploy: PreUndeployEvent{processEngine=org.camunda.bpm.engine.impl.ProcessEngineImpl@3be4ea5e}
```