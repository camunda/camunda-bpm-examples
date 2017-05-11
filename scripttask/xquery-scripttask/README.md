# Script Task which uses XQuery

> Note: This example only works with the XQuery scriptengine extension. 

This quickstart demonstrates how to use the Saxon XQuery script engine extension to transform data in camunda BPM.

The example includes a BPMN 2.0 process which invokes a simple script task which transforms two input XML documents into a single output XML output.

![XQuery Example Process][png]

# Overview

- [BPMN source code][bpmn]
- [XQuery transform][transform]
- Input data: [names] and [skills]
- Output data: [output]
- [JUnit tests][unit tests]

# How it works

The example XML files [names] and [skills] are loaded and passed as String input variables when starting the process. 

A script task uses an [XQuery transform][transform] to merge the two documents saved in the `names` and `skills` process variables. The script type is `xquery`.

The transform output is saved in the process variable `xmlOutput` as a String.

#### XQuery: String variables as Documents
Converting String process variables into Documents in the transform, we apply the XQuery `fn:parse-xml()` function. 

```xquery
declare namespace ns = "http://my.namespace/v1";
declare variable $names external;
declare variable $skills external;

let $namesDoc := fn:parse-xml($names)
let $skillsDoc := fn:parse-xml($skills)
```
Other than that, the XQuery transform is written in the usual way.

# How to use it?

1. Checkout the project with Git
2. Read and run the [JUnit tests][unit tests]

Note that testing the transform without going through the process engine is also supported.

[png]: src/main/resources/xquery-example.png
[bpmn]: src/main/resources/xquery-example.bpmn
[transform]: src/main/resources/org/camunda/bpm/example/xqueryexample/example.xquery
[skills]: src/main/resources/org/camunda/bpm/example/xqueryexample/example_skills.xml
[names]: src/main/resources/org/camunda/bpm/example/xqueryexample/example_names.xml
[output]: src/test/resources/expected_result.xml
[unit tests]: src/test/java/org/camunda/bpm/example/queryexample/XQueryExampleTest.java

