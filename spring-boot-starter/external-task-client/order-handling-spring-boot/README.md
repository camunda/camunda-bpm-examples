# External Task Client Spring Boot Starter: Order Handling Example

This example demonstrates how to use the Spring Boot Starter to ...
* ... configure the External Task Client and topic subscriptions
* ... subscribe to topics so the Client can fetch and lock for External Tasks
* ... execute custom business logic defined in a handler bean for each fetched External Task

## Why is this example interesting?

This example shows how to annotate a `@EnableExternalTaskClient` class to bootstrap an External Task Client 
and subscribe to topics to execute custom business logic using the `@ExternalTaskSubscription` annotation.
Additionally, it shows how to auto-wire a `SpringTopicSubscription` bean as well as open and close a
subscription after the application has been started.

> This example is based on the [Order Handling Example](../../../clients/java/order-handling).

## Please show me the important parts!

Let's first add the dependency to the project's `pom.xml` file:
```xml
<!--...-->
<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-external-task-client</artifactId>
  <version>7.15.0</version>
</dependency>
<!--...-->
```

Second, we create an `Application` class and annotate it with `@SpringBootApplication` to bootstrap 
the External Task Client:

```java
@SpringBootApplication
public class Application {

  public static void main(String... args) {
    SpringApplication.run(Application.class, args);
  }

}
```

To configure the External Task Client, we create an `application.yml` file:
```yaml
camunda.bpm.client:
  base-url: http://localhost:8080/engine-rest # The URL pointing to the Camunda Platform Runtime REST API
  async-response-timeout: 1000 # Defines the maximum duration of the long-polling request
  worker-id: spring-boot-client # Identifies the worker towards the Engine
```

Next, we create a `HandlerConfiguration` class to subscribe to topics and add our custom 
business logic by defining a bean with the return type `ExternalTaskHandler` and add the 
`@ExternalTaskSubscription` annotation to the bean method. The lambda function's body contains 
our custom business logic that is executed when an External Task is fetched:

```java
@Configuration
public class HandlerConfiguration {

  protected static final Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

  @Bean
  @ExternalTaskSubscription("invoiceCreator")
  public ExternalTaskHandler invoiceCreatorHandler() {
    return (externalTask, externalTaskService) -> {

      // instantiate an invoice object
      Invoice invoice = new Invoice("A123");

      // create an object typed variable with the serialization format XML
      ObjectValue invoiceValue = ClientValues
          .objectValue(invoice)
          .serializationDataFormat("application/xml")
          .create();

      // add the invoice object and its id to a map
      Map<String, Object> variables = new HashMap<>();
      variables.put("invoiceId", invoice.id);
      variables.put("invoice", invoiceValue);

      // select the scope of the variables
      boolean isRandomSample = Math.random() <= 0.5;
      if (isRandomSample) {
        externalTaskService.complete(externalTask, variables);
      } else {
        externalTaskService.complete(externalTask, null, variables);
      }

      LOG.info("The External Task {} has been completed!", externalTask.getId());

    };
  }

  @Bean
  @ExternalTaskSubscription(
      topicName = "invoiceArchiver",
      autoOpen = false
  )
  public ExternalTaskHandler invoiceArchiverHandler() {
    return (externalTask, externalTaskService) -> {
      TypedValue typedInvoice = externalTask.getVariableTyped("invoice");
      Invoice invoice = (Invoice) typedInvoice.getValue();
      LOG.info("Invoice on process scope archived: {}", invoice);
      externalTaskService.complete(externalTask);
    };
  }

}
```

The handler `invoiceArchiverHandler` is configured with `autoOpen = false` which means that the 
Client does not start automatically with fetching for External Tasks. This allows us to open the 
subscription after the application has been started. 

In the `Subscriptions` class we auto-wire the subscription beans and can access the configuration
of the beans. However, the subscriptions are not initialized at this point and cannot be opened or 
closed. This is why we catch the `SubscriptionInitializedEvent`. Once initialized, the subscription
can be opened or closed:

```java
@Component
public class Subscriptions implements ApplicationListener<SubscriptionInitializedEvent> {

  protected static final Logger LOG = LoggerFactory.getLogger(Subscriptions.class);

  @Autowired
  public SpringTopicSubscription invoiceCreatorHandlerSubscription;

  @Autowired
  public SpringTopicSubscription invoiceArchiverHandlerSubscription;

  @PostConstruct
  public void listSubscriptionBeans() {
    LOG.info("Subscription bean 'invoiceCreatorHandlerSubscription' has topic name: {} ",
        invoiceCreatorHandlerSubscription.getTopicName());
    LOG.info("Subscription bean 'invoiceArchiverHandlerSubscription' has topic name: {} ",
        invoiceArchiverHandlerSubscription.getTopicName());
  }

  @Override
  public void onApplicationEvent(SubscriptionInitializedEvent event) {
    SpringTopicSubscription springTopicSubscription = event.getSource();
    String topicName = springTopicSubscription.getTopicName();
    LOG.info("Subscription with topic name '{}' initialized", topicName);

    if (!springTopicSubscription.isOpen()) {
      LOG.info("Subscription with topic name '{}' not yet opened", topicName);

      // do something before subscription is opened

      springTopicSubscription.open();

      LOG.info("Subscription with topic name '{}' opened", topicName);

      springTopicSubscription.close();

      LOG.info("Subscription with topic name '{}' temporarily closed", topicName);

      // do something with subscription temporarily closed

      springTopicSubscription.open();

      LOG.info("Subscription with topic name '{}' reopened again", topicName);
    }
  }

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
2021-03-19 11:41:09.697  INFO 24157 --- [           main] o.c.b.s.b.e.l.client.Application         : Starting Application using Java 1.8.0_131 on localhost with PID 20376 (~/camunda-bpm-examples/spring-boot-starter/external-task-client/loan-granting-spring-boot/target/classes started by user in ~/camunda-bpm-examples/spring-boot-starter/external-task-client)
2021-03-19 11:41:09.697  INFO 24157 --- [           main] o.c.b.s.b.e.l.client.Application         : No active profile set, falling back to default profiles: default
...
2021-03-19 11:41:30.429  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription bean 'invoiceCreatorHandlerSubscription' has topic name: invoiceCreator 
2021-03-19 11:41:30.429  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription bean 'invoiceArchiverHandlerSubscription' has topic name: invoiceArchiver 
2021-03-19 11:41:30.527  INFO 24157 --- [           main] o.c.bpm.spring.boot.example.Application  : Started Application in 1.735 seconds (JVM running for 2.63)
2021-03-19 11:41:30.532  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceCreator' initialized
2021-03-19 11:41:30.535  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceArchiver' initialized
2021-03-19 11:41:30.535  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceArchiver' not yet opened
2021-03-19 11:41:30.536  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceArchiver' opened
2021-03-19 11:41:30.536  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceArchiver' temporarily closed
2021-03-19 11:41:30.537  INFO 24157 --- [           main] o.c.b.spring.boot.example.Subscriptions  : Subscription with topic name 'invoiceArchiver' reopened again
...
2021-03-19 11:41:09.697  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : The External Task 8fee791f-889f-11eb-bfb9-8e4eb3fc8d8b has been completed!
2021-03-19 11:41:09.718  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : The External Task 92ed132c-889f-11eb-bfb9-8e4eb3fc8d8b has been completed!
2021-03-19 11:41:09.738  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : The External Task 89f0cfd5-889f-11eb-bfb9-8e4eb3fc8d8b has been completed!
...
2021-03-19 11:41:09.893  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : Invoice on process scope archived: Invoice [id=A123]
2021-03-19 11:41:09.906  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : Invoice on process scope archived: Invoice [id=A123]
2021-03-19 11:41:09.919  INFO 24157 --- [criptionManager] o.c.b.s.b.example.HandlerConfiguration   : Invoice on process scope archived: Invoice [id=A123]
...
```