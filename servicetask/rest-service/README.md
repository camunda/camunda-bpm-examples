# REST Service Task

This quickstart demonstrates how to use the built-in REST HTTP connector for invoking REST services in camunda BPM. The example is *classless*, relying entirely on scripting and expression language. It makes use of the camunda Connect and the camunda Spin extensions.

The example includes a BPMN 2.0 process which invokes a holiday service, parses the result and takes a decision based on the result:

![REST Example Process][1]

# Overview

## How to run it

1. Checkout the project with Git
2. Read and run the [unit test][2]

## How it works

The important part of this example is the service task *Get holiday*. It uses the HTTP connector provided by camunda Connect and processes the returned JSON using camunda Spin. For reference, have a look at the complete [BPMN XML][3].

### Configuring Connect and Spin

Since Connect and Spin are optional extensions to the camunda platform, they have to be added as dependencies in [pom.xml][4]:

```xml
...
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.camunda.bpm</groupId>
      <artifactId>camunda-bom</artifactId>
      <scope>import</scope>
      <type>pom</type>
      <version>${version.camunda}</version>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  ...
  <dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-plugin-connect</artifactId>
  </dependency>

  <dependency>
    <groupId>org.camunda.connect</groupId>
    <artifactId>camunda-connect-http-client</artifactId>
  </dependency>

  <dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-plugin-spin</artifactId>
  </dependency>

  <dependency>
    <groupId>org.camunda.spin</groupId>
    <artifactId>camunda-spin-dataformat-json-jackson</artifactId>
  </dependency>
  ...
</dependencies>
...
```

Note the `dependencyManagement` entry. It declares the camunda bill of material (BOM) that provides managed dependencies for all camunda artifacts. These are referenced in the *dependencies* section. The BOM ensures that the version of the dependencies are consistent with each other.

Next, the process engine plugins provided by Spin and Connect are registered with the engine in [camunda.cfg.xml][5]:

```xml
...
<beans ...>

  <bean id="processEngineConfiguration" class="org.camunda.bpm.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration">

    ...
    <!-- activates the camunda Connect process engine plugins -->
    <property name="processEnginePlugins">
      <list>
        <bean class="org.camunda.connect.plugin.impl.ConnectProcessEnginePlugin" />
        <bean class="org.camunda.spin.plugin.impl.SpinProcessEnginePlugin" />
      </list>
    </property>

  </bean>
</beans>
```

This ensures that connectors can be used with service tasks and that the Spin functions are available from scripts and expressions.

### Using a Connector Service Task for REST requests

The task *Get holiday* makes use of Connect's HTTP connector. It does the following things:

1. Invoke a REST web service using the HTTP connector provided by camunda Connect.
2. Extract a property indicating whether a day is a holiday from the service's JSON response using Javascript and camunda Spin. This variable is used on the follow-up exclusive gateway.

In general, the task is declared as follows (see the [process model][3]):

```xml
<bpmn2:serviceTask id="ServiceTask_1" name="Get holiday">
  <bpmn2:extensionElements>
    <camunda:connector>
      CONNECTOR DECLARATION
    </camunda:connector>
  </bpmn2:extensionElements>
  <bpmn2:incoming>SequenceFlow_1</bpmn2:incoming>
  <bpmn2:outgoing>SequenceFlow_2</bpmn2:outgoing>
</bpmn2:serviceTask>
```

The task uses a `camunda:connector` extension element. It means that a connector should be invoked when the service task is executed. In detail, the connector is declared as follows:

```xml
<camunda:connector>
  <camunda:connectorId>http-connector</camunda:connectorId>
  <camunda:inputOutput>

    <camunda:inputParameter name="url">
      http://feiertage.jarmedia.de/api/?jahr=2014&amp;nur_land=BE
    </camunda:inputParameter>

    <camunda:inputParameter name="method">
      GET
    </camunda:inputParameter>

    <camunda:inputParameter name="headers">
      <map>
        <entry key="Accept">
          application/json
        </entry>
      </map>
    </camunda:inputParameter>

    <camunda:outputParameter name="isHoliday">
      <camunda:script scriptFormat="Javascript" resource="parseHoliday.js" />
    </camunda:outputParameter>
  </camunda:inputOutput>
</camunda:connector>
```

The `connector-id` element identifies the HTTP connector. The `inputOutput` element defines a mapping of values to connector parameters. For example, the `url` parameter identifies the REST endpoint to be called.

The *outputParameter* element maps the response obtained by the connector to a variable `isHoliday`. The mapping makes use of camunda Spin to extract an element from the returned JSON and is implemented in a [Javascript file][6].

[1]: src/main/resources/invokeRestService.png
[2]: src/test/java/org/camunda/bpm/example/servicetask/rest/ServiceTaskRestTest.java
[3]: src/main/resources/invokeRestService.bpmn
[4]: pom.xml#L20-L84
[5]: src/test/resources/camunda.cfg.xml
[6]: src/main/resources/parseHoliday.js

