# Script Task which uses XSLT

> Note: This example works also only with the XSLT scriptengine extension which is part of the
> camunda bpm **enterprise edition**. This example is based on a new functionality in camunda BPM 7.2 and, as such, is subject to
> change.

This quickstart demonstrates how to use the XSLT script engine extension to transform data in camunda BPM.
The example is *classless*, relying entirely on scripting and expression language.

The example includes a BPMN 2.0 process which invokes a simple script task which transforms the input data
into an transformed XML output:

![XLST Example Process][1]

# Overview

- [bpmn source code][2]
- [xslt stylesheet][3]
- [input data][4]
- [result][5]
- [unit test][6]

# How it works

The execution listener attached to the start event references a groovy script.

```xml
<bpmn2:startEvent id="StartEvent_1" name="give input">
  <bpmn2:extensionElements>
    <camunda:executionListener event="end">
      <camunda:script scriptFormat="groovy" resource="org/camunda/bpm/example/xsltexample/readXmlFile.groovy" />
    </camunda:executionListener>
  </bpmn2:extensionElements>
</bpmn2:startEvent>
```

This groovy script loads the [example XML file][4] and saves it in the process variable `customers`.

```groovy
import org.camunda.commons.utils.IoUtil

xmlData = IoUtil.fileAsString('org/camunda/bpm/example/xsltexample/example.xml')
execution.setVariable('customers', xmlData)

println 'Input XML:'
println xmlData
```

The following script task uses the [xsl stylesheet][3] to transform the XML saved in the `customers` process variable
and saves the result in the `xmlOutput` process variable.

```xml
<bpmn2:scriptTask id="ScriptTask_1" name="convert input" scriptFormat="xslt" camunda:resource="org/camunda/bpm/example/xsltexample/example.xsl" camunda:resultVariable="xmlOutput">
  <bpmn2:extensionElements>
    <camunda:inputOutput>
      <camunda:inputParameter name="camunda_source">${customers}</camunda:inputParameter>
    </camunda:inputOutput>
  </bpmn2:extensionElements>
</bpmn2:scriptTask>
```

Before the process ends the execution listener of the end event again executes a groovy script.

```xml
<bpmn2:endEvent id="EndEvent_1" name="show output">
  <bpmn2:extensionElements>
    <camunda:executionListener event="start">
      <camunda:script scriptFormat="groovy" resource="org/camunda/bpm/example/xsltexample/printResult.groovy" />
    </camunda:executionListener>
  </bpmn2:extensionElements>
</bpmn2:endEvent>
```

This groovy script just prints the process variable `xmlOutput` which contains the transformed XML.

```groovy
println '\nTransformed XML:'
println execution.getVariable('xmlOutput')
```

# How to use it?

1. Checkout the project with Git
2. Read and run the [unit test][6]

[1]: src/main/resources/xslt-example.png
[2]: src/main/resources/xslt-example.bpmn
[3]: src/main/resources/org/camunda/bpm/example/xsltexample/example.xsl
[4]: src/main/resources/org/camunda/bpm/example/xsltexample/example.xml
[5]: src/test/resources/expected_result.xml
[6]: src/test/java/org/camunda/bpm/example/xsltexample/XsltExampleTest.java

