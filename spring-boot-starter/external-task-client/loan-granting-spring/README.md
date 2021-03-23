# External Task Client Spring: Loan Granting Example

This example demonstrates how to use Spring to ...
* ... configure the External Task Client and topic subscriptions
* ... subscribe to topics so the Client can fetch and lock for External Tasks
* ... execute custom business logic defined in a handler bean for each fetched External Task

## Why is this example interesting?

This example shows how to annotate a class with `@EnableExternalTaskClient` to bootstrap an External Task Client 
and subscribe to topics to execute custom business logic using the `@ExternalTaskSubscription` annotation.
The base URL of the REST API and the client's Worker ID is configured via a `client.properties` file, 
which is in turn configured via a `PropertySourcesPlaceholderConfigurer` bean.

> This example is based on the [Loan Granting Example](../../../clients/java/loan-granting). Check it out as well as it contains
> a detailed step-by-step guide on how to start a Camunda Runtime Platform, deploy the [workflow.bpmn](./workflow.bpmn) 
> model using Camunda Modeler, and monitor the process in Cockpit. This example only focuses on Spring integration.

## Please show me the important parts!

Let's first add the necessary dependencies to the project's `pom.xml` file:
```xml
<!--...-->
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-external-task-client-spring</artifactId>
  <version>7.15.0</version>
</dependency>

<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-context</artifactId>
  <version>${version.spring.framework}</version>
</dependency>
<!--...-->
```

We create an `Application` class and annotate it with `@EnableExternalTaskClient` to configure and 
bootstrap the External Task Client. Additionally, we define a bean with the return type 
`PropertySourcesPlaceholderConfigurer`. We use the bean to configure the location of the 
`client.properties` file from where the placeholders in the annotation get resolved:

```java
@ComponentScan
@EnableExternalTaskClient(
    baseUrl = "${client.baseUrl}",
    workerId = "${client.workerId}"
)
public class Application {

  public static void main(String... args) {
    new AnnotationConfigApplicationContext(Application.class);
  }

  @Bean
  public static PropertySourcesPlaceholderConfigurer propertyPlaceholderConfigurer() {
    PropertySourcesPlaceholderConfigurer configurer = new PropertySourcesPlaceholderConfigurer();

    // define location of properties file
    Resource location = new ClassPathResource("client.properties");
    configurer.setLocation(location);
    return configurer;
  }

}
```

We create a `client.properties` file from which the application resolves the placeholders to configure
the External Task Client:
```properties
client.baseUrl=http://localhost:8080/engine-rest
client.workerId=loan-granting-worker
```

Next, we create a `HandlerConfiguration` class to subscribe to topics and add our custom 
business logic by defining a bean with the return type `ExternalTaskHandler` and add the 
`@ExternalTaskSubscription` annotation to the bean method. The lambda function's body contains 
our custom business logic that is executed whenever an External Task is fetched:

```java
@Configuration
public class HandlerConfiguration {

  protected static final Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

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

      LOG.info("The External Task {} has been checked!", externalTask.getId());
    };
  }
// ...
}
```

## How to use it?

1. Make sure to have an up and running Camunda Platform Runtime REST API
2. Deploy the process [workflow.bpmn](./workflow.bpmn) to the Camunda Platform Runtime (e.g., via Camunda Modeler)
3. Check out the project with Git
4. Import the project into your IDE
5. Start the main class in your IDE
6. Watch out for the following log output:
```
...
[TopicSubscriptionManager] INFO org.camunda.bpm.spring.example.loangranting.client.HandlerConfiguration - The External Task ce49191d-87fb-11eb-8156-8e4eb3fc8d8b has been checked!
[TopicSubscriptionManager] INFO org.camunda.bpm.spring.example.loangranting.client.HandlerConfiguration - The External Task ed79db78-87f7-11eb-8156-8e4eb3fc8d8b has been checked!
[TopicSubscriptionManager] INFO org.camunda.bpm.spring.example.loangranting.client.HandlerConfiguration - The External Task 6221e6d3-87f8-11eb-8156-8e4eb3fc8d8b has been checked!
[TopicSubscriptionManager] INFO org.camunda.bpm.spring.example.loangranting.client.HandlerConfiguration - The External Task 224b1c3f-87ff-11eb-8156-8e4eb3fc8d8b has been checked!
[TopicSubscriptionManager] INFO org.camunda.bpm.spring.example.loangranting.client.HandlerConfiguration - The External Task 5befcdb7-87fd-11eb-8156-8e4eb3fc8d8b has been checked!
...
```

