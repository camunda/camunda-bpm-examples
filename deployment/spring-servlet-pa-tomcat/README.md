# Spring Servlet Process Application (using enbedded Tomcat 7)

This example demonstrates how to deploy a spring powered web application which

  * Includes a @ProcessApplication class and some BPMN 2.0 processes
  * Starts a Spring Web application context
  * Uses a shared container managed process engine and Spring Beans as expression and delegate expression in the processes

## Why is this example interesting?

This example shows how to combine a @ProcessApplication class, a processes.xml and a spring applicationContext into a fully fledged process application with all its
advantages, including a managed container shared process engine paired with the power of spring beans inside your processes.

## Show me the important parts!

We create a process application class which extends the ServletProcessApplication and annotate it with @ProcessApplication, so
the camunda BPM platform can pick it up and register the process application without any further action:

    @ProcessApplication
    public class SpringServletProcessApplication extends ServletProcessApplication {
      ...
    }

Through the ```META-INF/processes.xml```, we can define process archives and additional options, like creating new engines when deploying the process application:

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

### Maven dependencies

There are couple important parts customized in this example:

    1. all dependencies of web application itself are configured wit *provided* scope. As they are deployed into root
    classloader of web container

    <dependency>
      <groupId>org.camunda.bpm</groupId>
      <artifactId>camunda-engine-spring</artifactId>
      <version>${camunda.version}</version>
      <scope>provided</scope>
    </dependency>

    2. we prepare tomcat configuration, that is going to be used by container, by filtering variables in _server.xml_

    ```xml
    <Resource name="jdbc/ProcessEngine"
                  auth="Container"
                  type="javax.sql.DataSource"
                  factory="org.apache.tomcat.jdbc.pool.DataSourceFactory"
                  uniqueResourceName="process-engine"
                  driverClassName="org.h2.Driver"
                  url="jdbc:h2:${project.build.directory}/camunda-h2-dbs/process-engine;MVCC=TRUE;TRACE_LEVEL_FILE=0;DB_CLOSE_ON_EXIT=FALSE"
                  username="sa"
                  password="sa"
                  maxPoolSize="20"
                  minPoolSize="5" />

    ...
    <Host name="localhost"  appBase="${project.build.directory}/to_deploy"
                unpackWARs="true" autoDeploy="true">
    ```

    3. we run embedded tomcat with our pre-configured _server.xml_


## How to use it?

  1. Build it with maven.

```bash
mvn clean verify
```

    will start embedded tomcat using specified server.xml file, copy _bpm-platform.xml_ into tomcat configuration folder.

  2. Watch out for this console log:

```bash
[INFO] ENGINE-08046 Found camunda bpm platform configuration in
...
[INFO] ENGINE-07015 Detected @ProcessApplication class 'org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication'
Nov 30, 2016 10:43:33 AM org.apache.catalina.core.ApplicationContext log
INFO: Initializing Spring root WebApplicationContext
...
Invoking @PostDeploy annotation in org.camunda.bpm.example.spring.servlet.pa.SpringServletProcessApplication
Starting testResolveBean processdefinition
org.camunda.bpm.example.spring.servlet.pa.ExampleBean is currently invoked.
Starting testResolveBeanFromJobExecutor processdefinition
```
