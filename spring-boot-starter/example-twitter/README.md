# Tweet directly from the Tasklist - Spring Boot packaged

This example demonstrates how you can use BPM process and Tweeter API to build simple Twitter client. 
It uses `camunda-bpm-spring-boot-starter-webapp` and thus embed Tomcat as a web container.

The example contains:
- process application with one process deployed on Camunda engine
- custom forms to create and review Tweet
- creates on startup an admin user "kermit" (password: kermit)

It also demonstrates usage of `application.yaml` configuration file.

## How is it done

1. To embed Camunda Engine you must add following dependency in your `pom.xml`:
   
```xml
...
<dependency>
 <groupId>org.camunda.bpm.springboot</groupId>
 <artifactId>camunda-bpm-spring-boot-starter-webapp</artifactId>
 <version>2.3.0-SNAPSHOT</version>
</dependency>
...
```

2. With Spring Boot you usually create "application" class annotated with `@SpringBootApplication`. In order to have Camunda process application
registered, you can simply add annotation `@EnableProcessApplication` to the same class and also include `processes.xml` file in your `META-INF` folder:

```java
@SpringBootApplication
@EnableProcessApplication
public class TwitterServletProcessApplication {

  public static void main(String[] args) {
    SpringApplication.run(TwitterServletProcessApplication.class, args);
  }
}
```

3. You can also put BPMN, CMMN and DMN files in your classpath, they will be automatically deployed and registered within process application.

4. You can configure your Spring Boot application using `application.yaml` file. All possible Camunda-specific configuration parameters are listed [here](https://stage.docs.camunda.org/manual/develop/user-guide/spring-boot-integration/configuration/)

5. This example provides two implementations for posting a Tweet:
* `TweetContentOfflineDelegate` (default) - will just pring the tweet content on console
* `TweetContentDelegate` - will really post a tweet on http://twitter.com/#!/camunda_demo

You can switch between two implementation by making one of the the Spring bean with `tweetAdapter` bean name. This `tweetAdapter` bean is further referenced in 
BPMN diagram via "Delegate expression" in service task:

```xml
...
<serviceTask id="service_task_publish_on_twitter" name="Publish on Twitter" camunda:delegateExpression="#{tweetAdapter}">
  ...
</serviceTask>
...
```

## Run the application and check the result

You can then build the application by calling `mvn clean install` and then run it with `java -jar` command.

Go to http://localhost:8080, log in with "kermit/kermit", go to Tasklist and try to start the process and complete the tasks.