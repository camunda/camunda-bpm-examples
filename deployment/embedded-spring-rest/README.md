# Spring configured embedded process engine and REST API

This example demonstrates how to set up a web application, which

* Bundles the camunda-engine JAR library
* Starts and configures a process engine in a Spring Application context
* Bundles the camunda-engine-REST library
* Exposes the process engine API via REST

> **Note:** This project must be deployed on a vanilla Apache Tomcat server, NOT the prepackaged distribution which can be downloaded from http://camunda.org.

## Why is this example interesting?

This example demonstrates how to perform a standalone embedded setup with a webapplication which bundles both the
camunda engine and camunda engine REST JARs.

## Show me the important parts!

The process engine is configured in the Spring application context:

```xml
<bean id="processEngineConfiguration"
  class="org.camunda.bpm.engine.spring.SpringProcessEngineConfiguration">
  <property name="processEngineName" value="default" />
  <property name="dataSource" ref="dataSource" />
  <property name="transactionManager" ref="transactionManager" />
  <property name="databaseSchemaUpdate" value="true" />
  <property name="jobExecutorActivate" value="false" />
  <property name="deploymentResources" value="classpath*:*.bpmn" />
</bean>

<bean id="processEngine" class="org.camunda.bpm.engine.spring.ProcessEngineFactoryBean">
  <property name="processEngineConfiguration" ref="processEngineConfiguration" />
</bean>

<bean id="repositoryService" factory-bean="processEngine"
  factory-method="getRepositoryService" />
<bean id="runtimeService" factory-bean="processEngine"
  factory-method="getRuntimeService" />
<bean id="taskService" factory-bean="processEngine"
  factory-method="getTaskService" />
<bean id="historyService" factory-bean="processEngine"
  factory-method="getHistoryService" />
<bean id="managementService" factory-bean="processEngine"
  factory-method="getManagementService" />
```

A custom JAX-RS Application class deploys the REST Endpoints:

```java
public class RestProcessEngineDeployment extends Application {

  @Override
  public Set<Class<?>> getClasses() {
    Set<Class<?>> classes = new HashSet<Class<?>>();

    classes.addAll(CamundaRestResources.getResourceClasses());
    classes.addAll(CamundaRestResources.getConfigurationClasses());

    return classes;
  }

}
```

Implement the REST Process Engine Provider SPI (provides the process engine to the REST application):

```java
public class RestProcessEngineProvider implements ProcessEngineProvider {

  public ProcessEngine getDefaultProcessEngine() {
    return ProcessEngines.getDefaultProcessEngine();
  }

  public ProcessEngine getProcessEngine(String name) {
    return ProcessEngines.getProcessEngine(name);
  }

  public Set<String> getProcessEngineNames() {
    return ProcessEngines.getProcessEngines().keySet();
  }

}
```

Add a file named:
    `src/main/resources/META-INF/services/org.camunda.bpm.engine.rest.spi.ProcessEngineProvider`
which contains the name of the provider:
    `org.camunda.bpm.example.loanapproval.rest.RestProcessEngineProvider`

Reference all required libraries in pom.xml:

```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine</artifactId>
  <version>${camunda.version}</version>
</dependency>

<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine-spring</artifactId>
  <version>${camunda.version}</version>
</dependency>

<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine-rest</artifactId>
  <version>${camunda.version}</version>
  <classifier>classes</classifier>
</dependency>

<dependency>
  <groupId>org.jboss.resteasy</groupId>
  <artifactId>resteasy-jaxrs</artifactId>
  <version>3.0.2.Final</version>
</dependency>

<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-web</artifactId>
  <version>${spring.version}</version>
</dependency>
```

## How to use it?

1. Build it with maven
2. Deploy it to a vanilla Apache Tomcat server, NOT the prepackaged distribution which can be downloaded from http://camunda.org!!
3. Access the REST Endpoint:
[http://localhost:8080/camunda-quickstart-embedded-spring-rest-1.0-SNAPSHOT/engine/default/process-definition][1]


[1]: http://localhost:8080/camunda-quickstart-embedded-spring-rest-1.0-SNAPSHOT/engine/default/process-definition
