# External Task Client Spring Boot Starter: REST API & Webapp Example

This example demonstrates how to combine the REST API, Webapp and External Task Client Starters.

Beyond that, it demonstrates how to use the Spring Boot Starter to ...
* ... configure the External Task Client and topic subscriptions
* ... subscribe to topics so the client can fetch and lock for External Tasks
* ... execute custom business logic defined in a handler bean for each fetched External Task

## Why is this example interesting?

This example shows how to configure and bootstrap an External Task Client using the `application.yml` file,
subscribe to topics to execute custom business logic using the `@ExternalTaskSubscription` 
annotation, and configure these subscriptions using the `application.yml` file. Additionally, it shows
how to listen to the `SubscriptionInitializedEvent`, and open the subscription after the application
has been started.

## Please show me the important parts!

Let's first add the dependencies to the project's `pom.xml` file:
```xml
<!--...-->
<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-external-task-client</artifactId>
  <version>7.15.0</version>
</dependency>

<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-rest</artifactId>
  <version>7.15.0</version>
</dependency>

<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-webapp</artifactId>
  <version>7.15.0</version>
</dependency>
<!--...-->
```

Second, we create an `Application` class and annotate it with `@SpringBootApplication` to enable the Starters:

```java
@SpringBootApplication
public class Application {

  public static void main(String... args) {
    SpringApplication.run(Application.class, args);
  }

}
```

To configure the Runtime Platform admin user, the External Task Client, and the topic subscriptions, 
we create an `application.yml` file:
```yaml
camunda.bpm:
  admin-user: # Configure the login credentials for the Runtime Platform admin user
    id: demo # configure the username
    password: demo # configure the password
  client:
    base-url: http://localhost:8080/engine-rest # The URL pointing to the Camunda Platform Runtime REST API
    async-response-timeout: 1000 # Defines the maximum duration of the long-polling request
    worker-id: spring-boot-client # Identifies the worker towards the Engine
#      basic-auth: # Configure if REST API is secured with basic authentication
#        username: demo
#        password: demo
    subscriptions:
      creditScoreChecker: # This topic name must match the respective `@ExternalTaskSubscription`
        process-definition-key: loan_process # Filters for External Tasks of this key
        auto-open: false # Defines whether the subscription is opened automatically or not
      loanGranter:
        lock-duration: 10000 # Defines for how long the External Tasks are locked until they can be fetched again
```

Next, we create a `HandlerConfiguration` class to subscribe to topics and add our custom 
business logic by defining a bean with the return type `ExternalTaskHandler` and add the 
`@ExternalTaskSubscription` annotation to the bean method. The lambda function's body contains 
our custom business logic that is executed when an External Task is fetched. Additionally, we catch 
the `SubscriptionInitializedEvent` to open a subscription after the application has ben started in case it is not opened already:

```java
@Configuration
public class HandlerConfiguration {
  
  protected static Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

  protected String workerId;

  public HandlerConfiguration(ClientProperties properties) {
    workerId = properties.getWorkerId();
  }

  @ExternalTaskSubscription("creditScoreChecker")
  @Bean
  public ExternalTaskHandler creditScoreChecker() {
    return (externalTask, externalTaskService) -> {

      // retrieve a variable from the Workflow Engine
      int defaultScore = externalTask.getVariable("defaultScore");

      List<Integer> creditScores = new ArrayList<>(Arrays.asList(defaultScore, 9, 1, 4, 10));

      // create an object typed variable
      ObjectValue creditScoresObject = Variables.objectValue(creditScores).create();

      // complete the external task
      externalTaskService.complete(externalTask, Variables.putValueTyped("creditScores", creditScoresObject));

      LOG.info("{}: The External Task {} has been checked!", workerId, externalTask.getId());
    };
  }
  
  // ...

  @EventListener(SubscriptionInitializedEvent.class)
  public void catchSubscriptionInitEvent(SubscriptionInitializedEvent event) {

    SpringTopicSubscription topicSubscription = event.getSource();
    if (!topicSubscription.isAutoOpen()) {

      // open topic in case it is not opened already
      topicSubscription.open();

      LOG.info("Subscription with topic name '{}' has been opened!",
          topicSubscription.getTopicName());
    }
  }

}
```

The BPMN model [workflow.bpmn](./src/main/resources/bpmn/workflow.bpmn) is automatically deployed
to the Workflow Engine since it is located under `/src/main/resources/`.

## How to use it?

1. Check out the project with Git
2. Import the project into your IDE
3. Start the main class in your IDE
4. Watch out for the following log output:

```
   ____                                           _             ____    _           _      __
  / ___|   __ _   _ __ ___    _   _   _ __     __| |   __ _    |  _ \  | |   __ _  | |_   / _|   ___    _ __   _ __ ___
 | |      / _` | | '_ ` _ \  | | | | | '_ \   / _` |  / _` |   | |_) | | |  / _` | | __| | |_   / _ \  | '__| | '_ ` _ \
 | |___  | (_| | | | | | | | | |_| | | | | | | (_| | | (_| |   |  __/  | | | (_| | | |_  |  _| | (_) | | |    | | | | | |
  \____|  \__,_| |_| |_| |_|  \__,_| |_| |_|  \__,_|  \__,_|   |_|     |_|  \__,_|  \__| |_|    \___/  |_|    |_| |_| |_|

  _____          _                                   _     _____                 _         ____   _   _                  _
 | ____| __  __ | |_    ___   _ __   _ __     __ _  | |   |_   _|   __ _   ___  | | __    / ___| | | (_)   ___   _ __   | |_
 |  _|   \ \/ / | __|  / _ \ | '__| | '_ \   / _` | | |     | |    / _` | / __| | |/ /   | |     | | | |  / _ \ | '_ \  | __|
 | |___   >  <  | |_  |  __/ | |    | | | | | (_| | | |     | |   | (_| | \__ \ |   <    | |___  | | | | |  __/ | | | | | |_
 |_____| /_/\_\  \__|  \___| |_|    |_| |_|  \__,_| |_|     |_|    \__,_| |___/ |_|\_\    \____| |_| |_|  \___| |_| |_|  \__|

  Spring-Boot:  (v2.4.3)
  Camunda Platform: (v7.15.0)
2021-03-19 10:57:54.493  INFO 23614 --- [           main] o.c.bpm.spring.boot.example.Application  : Starting Application using Java 1.8.0_131 on localhost with PID 23614 (~//camunda-bpm-examples/spring-boot-starter/external-task-client/loan-granting-spring-boot-webapp/target/classes started by user in ~//camunda-bpm-examples/spring-boot-starter/external-task-client)
2021-03-19 10:57:54.495  INFO 23614 --- [           main] o.c.bpm.spring.boot.example.Application  : No active profile set, falling back to default profiles: default
2021-03-19 10:57:55.766  INFO 23614 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2021-03-19 10:57:55.784  INFO 23614 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2021-03-19 10:57:55.785  INFO 23614 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.41]
...
2021-03-19 10:58:02.537  INFO 23614 --- [           main] org.camunda.bpm.engine                   : ENGINE-00001 Process Engine default created.
2021-03-19 10:58:02.628  INFO 23614 --- [           main] org.camunda.bpm.spring.boot              : STARTER-SB010 creating initial Admin User: AdminUserProperty[id=demo, firstName=Demo, lastName=Demo, email=demo@localhost, password=******]
...
2021-03-19 10:58:03.632  INFO 23614 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2021-03-19 10:58:03.659  INFO 23614 --- [           main] o.c.bpm.spring.boot.example.Application  : Started Application in 9.51 seconds (JVM running for 10.128)
2021-03-19 10:58:03.674  INFO 23614 --- [           main] o.c.b.s.b.example.HandlerConfiguration   : Subscription with topic name 'creditScoreChecker' has been opened!
2021-03-19 10:58:03.684  INFO 23614 --- [           main] org.camunda.bpm.engine.jobexecutor       : ENGINE-14014 Starting up the JobExecutor[org.camunda.bpm.engine.spring.components.jobexecutor.SpringJobExecutor].
2021-03-19 10:58:03.690  INFO 23614 --- [ingJobExecutor]] org.camunda.bpm.engine.jobexecutor       : ENGINE-14018 JobExecutor[org.camunda.bpm.engine.spring.components.jobexecutor.SpringJobExecutor] starting to acquire jobs
2021-03-19 10:58:12.363  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9bd0aca1-8899-11eb-85fb-8e4eb3fc8d8b has been checked!
2021-03-19 10:58:12.412  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9dc3a349-8899-11eb-85fb-8e4eb3fc8d8b has been rejected with score 4!
2021-03-19 10:58:12.425  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9dc3f171-8899-11eb-85fb-8e4eb3fc8d8b has been granted with score 10!
2021-03-19 10:58:12.439  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9dc37c31-8899-11eb-85fb-8e4eb3fc8d8b has been rejected with score 1!
2021-03-19 10:58:12.453  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9dc2b8d1-8899-11eb-85fb-8e4eb3fc8d8b has been rejected with score 5!
2021-03-19 10:58:12.471  INFO 23614 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : spring-boot-client: The External Task 9dc306f9-8899-11eb-85fb-8e4eb3fc8d8b has been granted with score 9!
```