# Spring Servlet Process Application (using Tomcat 9)

This example demonstrates how to deploy a spring powered web application which

  * Includes a `@ProcessApplication` class and some BPMN 2.0 processes
  * Starts a Spring Web application context based on a shared, container managed process engine
  * Uses Spring Beans and delegation code in expressions within processes

## Why is this example interesting?

This example shows how to combine a `@ProcessApplication class`, a `processes.xml` and a spring applicationContext into 
a fully-fledged process application with all its advantages, including a shared, container managed process engine paired 
with the power of Spring Beans inside your processes.

## Show me the important parts!

A process application class was created which extends the `ServletProcessApplication` class. The class was annotated 
with `@ProcessApplication`. This allows the Camunda Platform to pick it up and register the process application 
without any further action:

```java
@ProcessApplication
public class SpringServletProcessApplication extends ServletProcessApplication {
  ...
}
```

Through the `META-INF/processes.xml`, we can define process archives and additional options, like creating new engines 
when deploying the process application:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<process-application
  xmlns="http://www.camunda.org/schema/1.0/ProcessApplication"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.camunda.org/schema/1.0/ProcessApplication http://www.camunda.org/schema/1.0/ProcessApplication">

  <process-archive>
  <properties>
    <property name="isDeleteUponUndeploy">true</property>
  </properties>
  
  </process-archive>

</process-application>
```

### Maven dependencies

The scope attributes of the `camunda-engine` dependency is set to *provided* since it is included in the shared classpath of the Camunda Tomcat distribution:

```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine</artifactId>
  <version>${camunda.version}</version>
  <scope>provided</scope>
</dependency>
```

The scope of `camunda-engine-spring`, the module that integrates Camunda with Spring, must be set to `compile` so that it is included in the application.

```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine</artifactId>
  <version>${camunda.version}</version>
</dependency>
```

For testing, the Maven Cargo plugin unpacks the Camunda Tomcat distribution to the `target/tomcat` directory of the application and runs it.

## How to use it?

1. Build it with Maven.

```bash
mvn clean verify
```

This will start the embedded tomcat server.

2. Watch out for this console log:

```bash
[INFO] ENGINE-08046 Found Camunda Platform configuration in
...
[INFO] ENGINE-07015 Detected @ProcessApplication class 'org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication'
May 18, 2020 4:46:36 PM org.apache.catalina.core.ApplicationContext log
INFO: Initializing Spring root WebApplicationContext
...
Invoking @PostDeploy annotation in org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication
Starting testResolveBean processdefinition
org.camunda.bpm.example.spring.servlet.pa.ExampleBean is currently invoked.
Starting testResolveBeanFromJobExecutor processdefinition
```
