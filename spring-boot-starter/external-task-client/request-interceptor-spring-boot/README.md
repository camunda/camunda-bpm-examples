# Spring Boot External Task Client Starter: Request Interceptor Example

This example demonstrates how to use the Spring Boot Starter to configure a request interceptor and 
send a custom header along with each request.

## Why is this example interesting?

This example shows how to configure a request interceptor using a class annotated with 
`@Configuration` to expose a bean with return type `ClientRequestInterceptor`. 
The request interceptor adds a custom header that is sent along with each request.

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
the External Task Client. Additionally, we define a bean with the return type `ExternalTaskHandler`
and add the `@ExternalTaskSubscription` to subscribe to a topic. The lambda function's body can 
contain your custom business logic that is executed when an External Task is fetched:

```java
@SpringBootApplication
public class Application {

  public static void main(String... args) {
    SpringApplication.run(Application.class, args);
  }

  @Bean
  @ExternalTaskSubscription("my-topic")
  public ExternalTaskHandler myTopicHandler() {
    return (externalTask, service) -> {
      LOG.info("Execute business logic for External Task with id '{}'", externalTask.getId());
      service.complete(externalTask);
    };
  }

}
```

To configure the External Task Client and the topic subscriptions, we create an `application.yml` file:
```yaml
camunda.bpm.client:
  base-url: http://localhost:8080/engine-rest # The URL pointing to the Camunda Platform Runtime REST API
  worker-id: spring-boot-client # Identifies the worker towards the Engine
```

Next, we create a class `InterceptorConfiguration` annotated with `@Configuration`:

```java
@Configuration
public class InterceptorConfiguration {

  protected static Logger LOG = LoggerFactory.getLogger(InterceptorConfiguration.class);

  @Bean
  public ClientRequestInterceptor interceptor() {
    return context -> {
      LOG.info("Request interceptor called!");
      context.addHeader("X-MY-HEADER", "External Tasks Rock!");
    };
  }

}
```

Whenever a request is performed by the External Task Client, the request header `X-MY-HEADER: External Tasks Rock!`
is added. You can use this extension point to implement a custom authentication strategy like OAuth 2.0.

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
2021-03-18 17:17:00.473  INFO 20376 --- [           main] o.c.b.s.b.e.l.client.Application         : Starting Application using Java 1.8.0_131 on localhost with PID 20376 (~/camunda-bpm-examples/spring-boot-starter/external-task-client/loan-granting-spring-boot/target/classes started by user in ~/camunda-bpm-examples/spring-boot-starter/external-task-client)
2021-03-18 17:17:00.475  INFO 20376 --- [           main] o.c.b.s.b.e.l.client.Application         : No active profile set, falling back to default profiles: default
...
2021-03-18 17:17:01.642  INFO 20376 --- [           main] o.c.b.s.b.e.l.client.Application         : Started Application in 1.606 seconds (JVM running for 2.363)
2021-03-19 10:15:48.571  INFO 23258 --- [criptionManager] o.c.b.s.b.e.InterceptorConfiguration     : Request interceptor called!
2021-03-19 10:15:49.127  INFO 23258 --- [criptionManager] o.c.b.s.b.e.InterceptorConfiguration     : Request interceptor called!
...
2021-03-19 10:16:04.174  INFO 23258 --- [criptionManager] o.c.bpm.spring.boot.example.Application  : Execute business logic for External Task with id 'b9376f35-8893-11eb-8156-8e4eb3fc8d8b'
```