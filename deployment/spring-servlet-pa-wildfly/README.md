# Spring Servlet Process Application (using WildFly)

This example demonstrates how to deploy a Spring-powered Web application which

  * Includes a `@ProcessApplication` class and some BPMN 2.0 processes
  * Starts a Spring Web application context
  * Uses a shared container managed Process Engine and Spring Beans as expression and delegate
    expression in the processes

## Why is this example interesting?

This example shows how to combine a `@ProcessApplication` class, a `processes.xml` and a Spring
`applicationContext` into a fully-fledged Process Application with all its advantages, including a
managed container shared Process Engine paired with the power of Spring Beans inside your processes.

## Show me the important parts!

We create a Process Application class which extends the `ServletProcessApplication` and annotate
it with `@ProcessApplication`, so the Camunda Platform can pick it up and register the Process 
Application without any further action:

```java
@ProcessApplication
public class SpringServletProcessApplication extends ServletProcessApplication {
  ...
}
```

Through the `META-INF/processes.xml`, we can define Process Archives and additional options, like
creating new Process Engines when deploying the Process Application:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<process-application
    xmlns="http://www.camunda.org/schema/1.0/ProcessApplication"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.camunda.org/schema/1.0/ProcessApplication http://www.camunda.org/schema/1.0/ProcessApplication ">

  <process-archive>
    <properties>
      <property name="isDeleteUponUndeploy">true</property>
    </properties>

  </process-archive>

</process-application>
```

Additionally, you have to package the `camunda-engine-spring` module as a maven compile time 
dependency like:

```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine-spring</artifactId>
  <version>${camunda.version}</version>
  <scope>compile</scope>
</dependency>
```

## How to use it?

  1. Checkout the project with Git;
  2. Import the project into your IDE;
  3. Build it with Maven, it will download the Camunda Platform WildFly distribution and execute
     the included Arquillian test.
  4. Watch out for this console log:

```bash
Invoking @PostDeploy annotation in org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication
Starting testResolveBean processdefinition
org.camunda.bpm.example.spring.servlet.pa.ExampleBean is currently invoked.
Starting testResolveBeanFromJobExecutor processdefinition
org.camunda.bpm.example.spring.servlet.pa.ExampleDelegateBean is currently invoked.
...
Invoking @PreUndeploy annotation in org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication
Undeploying SpringServletProcessApplication-Example
```
