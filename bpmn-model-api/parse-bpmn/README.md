# BPMN parsing using the BPMN model API

This example demonstrates how to use the [camunda BPMN model API][bpmn-model] to parse
a BPMN process. It shows how simple you can access attributes, child elements and
extension elements. Also it illustrates how to use references between model elements
to traverse the model.

Please have a look at the source code of the [unit test case][test-case] and the comments to get
an impression about this useful feature of the [camunda BPMN model API][bpmn-model].

Also be aware that you can use the [camunda XML model API][xml-model] to general process
XML in a generic way. And the new [camunda CMMN model API][cmmn-model] to handle CMMN models
in a similar easy way.

## How to use it?

1. Checkout the project with Git
2. Read and run the [unit test case][test-case]

[bpmn-model]: https://github.com/camunda/camunda-bpmn-model
[xml-model]: https://github.com/camunda/camunda-xml-model
[cmmn-model]: https://github.com/camunda/camunda-cmmn-model
[test-case]: src/test/java/org/camunda/bpm/example/modelapi/ParseBpmnTest.java
