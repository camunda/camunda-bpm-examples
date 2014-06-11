# Soap Service Task

> Note: this example is based on new functionality in camunda BPM 7.2 and as such, subject to
> change.

This quickstart demonstrates how to use the built-in soap http connector for invoking SOAP services
in camunda BPM. The example is *classless*, relying entirely on scripting and expression language.

The example includes a BPMN 2.0 process which invokes a weather forecast service, parses the result
and takes a decision based on the result:

![SOAP Example Process][1]

# Overview

Still work in progress, read the [bpmn source code][3] and the [unit test][2].

## How to use it?

1. Checkout the project with Git
2. Read and run the [unit test][2]

[1]: src/main/resources/invokeSoapService.png
[2]: src/test/java/org/camunda/bpm/example/servicetask/soap/ServiceTaskSoapTest.java
[3]: src/main/resources/invokeSoapService.bpmn

