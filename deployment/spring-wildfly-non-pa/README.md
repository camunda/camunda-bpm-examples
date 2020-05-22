# Plain Spring Web application for WildFly

This example demonstrates how to deploy a plain web application which

  * Does not include a `@ProcessApplication` class and does not provide any BPMN 2.0 processes
  * Starts a Spring WebApplication context
  * Binds a shared, container managed Process Engine as Spring Bean

## Why is this example interesting?

The WildFly extensions from Camunda allow you to manage Process Engines as JBoss Services. However, 
if your application does not provide a `@ProcessApplication` class, WildFly is not aware of the
fact that your application uses the Process Engine. In that case, the following scenarios can occur:

  * At deployment, your application is deployed *before* the Process Engine is started, causing the 
    deployment of your application to fail.
  * When the Process Engine is stopped, your application is not stopped but will likely fail at some
    point because the Process Engine is not available anymore.

This problem can be resolved by adding a declarative dependency between the process engine and a 
component in your application.

## Show me the important parts!

We reference the Process Engine resource in `web.xml`:

```xml
<resource-ref>
  <res-ref-name>processEngine/default</res-ref-name>
  <res-type>org.camunda.bpm.engine.ProcessEngine</res-type>
  <mapped-name>java:global/camunda-bpm-platform/process-engine/default</mapped-name>
</resource-ref>
```

This creates a declarative dependency between the web application context and the Process Engine. 
Now WildFly knows that we are using it. We can look it up using the local name `java:comp/env/processEngine/default` 
from anywhere in our application.

In our case, we want to reference it from a Spring ApplicationContext:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

  <!-- lookup the process engine from local JNDI -->
  <bean name="processEngine" id="processEngine" class="org.springframework.jndi.JndiObjectFactoryBean">
    <property name="jndiName" value="java:comp/env/processEngine/default" />
  </bean>
  
  <!-- inject it into a bean -->
  <bean class="org.camunda.bpm.example.spring.wildfly.ProcessEngineClient">
    <property name="processEngine" ref="processEngine" />
  </bean>

</beans>
```

We also add an entry to the manifest, so that the Process Engine classes are added to our classpath:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-war-plugin</artifactId>
      <version>2.3</version>
      <configuration>
        <archive>
          <manifestEntries>
            <Dependencies>org.camunda.bpm.camunda-engine</Dependencies>
          </manifestEntries>
        </archive>
      </configuration>
    </plugin>
  </plugins>
</build>
```

## How to use it?

  1. Build it with Maven
  2. Deploy it to WildFly (download it from [here][1])
  3. Watch out for this console log:

```bash
Hi there!
I am a spring bean and I am using a container managed process engine provided as JBoss Service for all applications to share.
The engine is named default.
There are currently 0 processes deployed on this engine.
```

[1]: https://camunda.org/release/camunda-bpm/wildfly/
