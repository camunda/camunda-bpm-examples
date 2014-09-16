# Script Task which uses XSLT

> Note: This example is based on a new functionality in camunda BPM 7.2 and, as such, is subject to
> change. This example works also only with the xslt scriptengine extension which is part of the
> enterprise edition

This quickstart demonstrates how to use the XSLT script engine extension to transform data in camunda BPM. 
The example is *classless*, relying entirely on scripting and expression language.

The example includes a BPMN 2.0 process which invokes a simple script task which transforms the input data
into an transformed xml output:

![XLST Example Process][1]

# Overview

Still a work in progress, read the following files:

- [bpmn source code][2]
- [xslt stylesheet][3]
- [input data][4]
- [result][5]
- [unit test][6]

## How to use it?

1. Checkout the project with Git
2. Read and run the [unit test][6]

[1]: src/main/resources/xslt-example.png
[2]: src/main/resources/xslt-example.bpmn
[3]: src/main/resources/org/camunda/bpm/example/xsltexample/example.xsl
[4]: src/main/resources/org/camunda/bpm/example/xsltexample/example.xml
[5]: src/test/resources/expected_result.xml
[6]: src/test/java/org/camunda/bpm/example/xsltexample/XsltExampleTest.java

