**Note: This Example might not work due to irregularities of the called web service. The called SOAP service [Get Weather Forecast](http://www.webservicex.net/globalweather.asmx?op=GetWeather) is known to be down on a regular basis.**

# SOAP Service Task

This quickstart demonstrates how to use the built-in SOAP HTTP connector for invoking SOAP services in camunda BPM. The example is *classless*, relying entirely on scripting and expression language. It makes use of the camunda Connect and the camunda Spin extensions.

The example includes a BPMN 2.0 process which invokes a weather forecast service, parses the result and takes a decision based on the result:

![SOAP Example Process][1]

# Overview

## How to run it

1. Checkout the project with Git
2. Read and run the [unit test][2]

## How it works

The important part of this example is the service task *Get Weather Forecast (Soap)*. It uses the SOAP connector provided by camunda Connect and processes the returned XML using camunda Spin. For reference, have a look at the complete [BPMN XML][3].

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
    <artifactId>camunda-connect-soap-http-client</artifactId>
  </dependency>

  <dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-plugin-spin</artifactId>
  </dependency>

  <dependency>
    <groupId>org.camunda.spin</groupId>
    <artifactId>camunda-spin-dataformat-xml-dom</artifactId>
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

This ensures that connectors can be used with service tasks and that the Spin functions are available from scripts.

### Using a Connector Service Task for SOAP requests

The task *Get Weather Forecast (Soap)* makes use of Connect's SOAP connector. It does the following things:

1. Create a SOAP envelope based on the process variables `city` and `country` using the Freemarker template language.
2. Invoke a SOAP web service using the SOAP connector provided by camunda Connect.
3. Extract a weather forecast element from the service's XML response using Javascript and camunda Spin
4. Extract the temperature from the forecase and map it to a process variable `temperature`. This variable is used on the follow-up exclusive gateway.

In detail, the task is declared as follows (see the [process model][3]):

```xml
<bpmn2:serviceTask id="ServiceTask_2" name="Get Weather Forecast (Soap)">
  <bpmn2:extensionElements>
    <camunda:connector>
      CONNECTOR DECLARATION
    </camunda:connector>

    <camunda:inputOutput>
      IO MAPPING
    </camunda:inputOutput>
  </bpmn2:extensionElements>
  <bpmn2:incoming>SequenceFlow_2</bpmn2:incoming>
  <bpmn2:outgoing>SequenceFlow_3</bpmn2:outgoing>
</bpmn2:serviceTask>
```

The task uses two extension elements. The first is the `camunda:connector` element. It means that a connector should be invoked when the service task is executed. In detail, the connector is declared as follows:

```xml
<camunda:connector>
  <camunda:connectorId>soap-http-connector</camunda:connectorId>
  <camunda:inputOutput>

    <camunda:inputParameter name="url">http://www.webservicex.net/globalweather.asmx</camunda:inputParameter>

    <camunda:inputParameter name="payload">
      <camunda:script scriptFormat="freemarker" resource="soapEnvelope.ftl" />
    </camunda:inputParameter>

    <camunda:inputParameter name="headers">
      <map>
        <entry key="Content-Type">application/soap+xml;charset=UTF-8;action="http://www.webserviceX.NET/GetWeather"</entry>
      </map>
    </camunda:inputParameter>

    <camunda:outputParameter name="forecast">
      <![CDATA[
        ${S(response)
            .childElement("Body")
            .childElement("http://www.webserviceX.NET", "GetWeatherResponse")
            .childElement("GetWeatherResult")
            .textContent()}
      ]]>
    </camunda:outputParameter>

  </camunda:inputOutput>
</camunda:connector>
```

The `connector-id` element identifies the SOAP connector. The `inputOutput` element defines a mapping of values to connector parameters. For example, the `url` parameter identifies which SOAP service is called. Note that the `payload` parameter uses a transformation with the Freemarker template language to create a SOAP envelope. See the [template file][7] for details.

The *outputParameter* element maps the response obtained by the connector to a variable `forecast`. The mapping makes use of camunda Spin to extract an element from the returned XML.

On the task itself, an output mapping is defined that further processes the `forecast` XML and sets a process variable `temperature`. This is done by the `inputOutput` declaration of the service task:

```xml
<camunda:inputOutput>
  <camunda:outputParameter name="temperature">
    <camunda:script scriptFormat="Javascript" resource="parseTemperature.js" />
  </camunda:outputParameter>
</camunda:inputOutput>
```

The mapping is implemented in Javascript, see the referenced [source file][6].

[1]: src/main/resources/invokeSoapService.png
[2]: src/test/java/org/camunda/bpm/example/servicetask/soap/ServiceTaskSoapTest.java
[3]: src/main/resources/invokeSoapService.bpmn
[4]: pom.xml
[5]: src/main/resources/camunda.cfg.xml
[6]: src/main/resources/parseTemperature.js
[7]: src/main/resources/soapEnvelope.ftl
