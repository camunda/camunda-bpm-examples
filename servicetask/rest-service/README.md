# REST Service Task

> Note: This example is based on a new functionality in camunda BPM 7.2 and, as such, is subject to
> change.

This quickstart demonstrates how to use the built-in REST HTTP connector for invoking REST services
in camunda BPM. The example is *classless*, relying entirely on scripting and expression language.

The example includes a BPMN 2.0 process which invokes a holiday service, parses the result
and takes a decision based on the result:

![REST Example Process][1]

# Overview

Still a work in progress, read the [bpmn source code][3] and the [unit test][2].

## How to use it?

1. Checkout the project with Git
2. Read and run the [unit test][2]

[1]: src/main/resources/invokeRestService.png
[2]: src/test/java/org/camunda/bpm/example/servicetask/rest/ServiceTaskRestTest.java
[3]: src/main/resources/invokeRestService.bpmn

