# WAR built with Spring Boot

This example demonstrates how you can build a normal WAR file, containing the Camunda engine and [Webapps](https://docs.camunda.org/manual/latest/webapps/), 
to deploy it inside the Web container.

To achieve this you need to configure your project to produce a WAR file and additionally 
declare the embedded container dependencies in `provided` scope:

```xml
...

<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-tomcat</artifactId>
  <scope>provided</scope>
</dependency>

...

<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
    <plugin>
      <artifactId>maven-war-plugin</artifactId>
      <configuration>
        <failOnMissingWebXml>false</failOnMissingWebXml>
      </configuration>
    </plugin>
    ...
  </plugins>
</build>

...

```

You can then build the WAR by `mvn clean install`, deploy it in Tomcat and try the URL:
[http://localhost:8080/camunda-bpm-spring-boot-starter-example-war-0.0.1-SNAPSHOT/app/](http://localhost:8080/camunda-bpm-spring-boot-starter-example-war-0.0.1-SNAPSHOT/app/)

Or you can try it via Cargo Maven Plugin:

`mvn clean verify org.codehaus.cargo:cargo-maven2-plugin:run`

and point your browser to

[http://localhost:8080/camunda-bpm-spring-boot-starter-example-war/app/](http://localhost:8080/camunda-bpm-spring-boot-starter-example-war/app/)

The project also contains integration test to show how this can be tested.