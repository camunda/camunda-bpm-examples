# Spring Servlet Process Application (using JBoss AS 7)

This example demonstrates how to deploy a spring powered web application which

  * Includes a @ProcessApplication class and some BPMN 2.0 processes
  * Starts a Spring Web application context
  * Uses a shared container managed process engine and Spring Beans as expression and delegate expression in the processes

## Why is this example interesting?

This example shows how to combine a @ProcessApplication class, a `processes.xml` and a spring applicationContext into a fully-fledged process application with all its
advantages, including a managed container shared process engine paired with the power of spring beans inside your processes.

## Show me the important parts!

We create a process application class which extends the `ServletProcessApplication` and annotate it with @ProcessApplication, so
the camunda BPM platform can pick it up and register the process application without any further action:

```java
@ProcessApplication
public class SpringServletProcessApplication extends ServletProcessApplication {
  ...
}
```

Through the `META-INF/processes.xml`, we can define process archives and additional options, like creating new engines when deploying the process application:

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

Additionally, you have to package the camunda-engine-spring module as a maven compile time dependency like:

```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine-spring</artifactId>
  <version>${camunda.version}</version>
  <scope>compile</scope>
</dependency>
```

## How to use it?

  1. Make sure you use **JDK 6/7** otherwise the JBoss AS 7 won't start.
  2. Build it with maven, it will download the camunda BPM JBoss AS 7 distribution and execute the included Arquillian test.
  3. Watch out for this console log:

```bash
Invoking @PostDeploy annotation in org.camunda.bpm.example.spring.jboss.servlet.SpringServletProcessApplication
Starting testResolveBean processdefinition
org.camunda.bpm.example.spring.jboss.servlet.ExampleBean is currently invoked.
Starting testResolveBeanFromJobExecutor processdefinition
org.camunda.bpm.example.spring.jboss.servlet.ExampleDelegateBean is currently invoked.
...
Invoking @PreUndeploy annotation in org.camunda.bpm.example.spring.jboss.servlet.SpringServletProcessApplication
Undeploying SpringServletProcessApplication-Example
```
