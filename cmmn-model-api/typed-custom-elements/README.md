# Accessing custom CMMN extension elements in a strongly-typed way

This example demonstrates how to use the [camunda CMMN model API][cmmn-model] to register a CMMN transform listener that works with custom extension elements via a strongly-typed API. The concepts described here apply to the [BPMN model API][bpmn-model] and [DMN model API][dmn-model] in a similar manner.

Given a [CMMN 1.1 XML file][cmmn-xml]:

```xml
<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<definitions ...>
  <case id="oneTaskCase" name="One Task Case">

    <casePlanModel id="CasePlanModel_1">
      <planItem id="PI_HumanTask_1" definitionRef="HumanTask_1" />
      <humanTask id="HumanTask_1" name="A Human Task">
        <extensionElements>
          <exampleNamespace:kpi description="Average time in progress" />
          <exampleNamespace:kpi description="Average time from ENABLED to ACTIVE" />
        </extensionElements>
      </humanTask>
    </casePlanModel>
  </case>

</definitions>
```

`kpi` elements can be accessed as follows:

```java
public void transformHumanTask(PlanItem planItem, HumanTask humanTask, CmmnActivity activity) {
  ExtensionElements extensionElements = humanTask.getExtensionElements();

  Collection<KPIElement> kpiElements = extensionElements.getChildElementsByType(KPIElement.class);
  for (KPIElement kpiElement : kpiElements) {
    PARSED_KPI_ELEMENTS.add(kpiElement);
  }
}
```

In particular, this example shows how to perform the following tasks:

* How to extend the CMMN model API by custom elements represented by Java types
* How to access these types given a parsed CMMN model instance
* How to implement and register a CMMN transform listener

## How to use it?

1. Checkout the project with Git
2. Read and run the [unit test case][test-case]

## Show me the details

### Extending the CMMN model API by Custom Types

Providing custom strongly-typed XML element access requires two things: First, a custom element class must be created. Second, the custom type must be registered with the CMMN parser runtime such that the parser is able to create instances of the class when parsing a model.

In this example, the type [KPIElement][kpi-element] implemented by [KPIElementImpl][kpi-element-impl] represents a custom type. The static method #registerType declares how a `kpi` element is to be parsed. It provides a factory for instantiating KPI elements and declares an attribute.

The class [CustomCmmn][custom-cmmn] represents an extended CMMN model palette. In order for the model API to use this extended palette, an instance of `CustomCmmn` replaces the singleton `Cmmn` instance. The replacing logic can be found in the process engine plugin [CustomElementsProcessEnginePlugin][process-engine-plugin].

### Implementing a CMMN transform listener

A CMMN transform listener is the CMMN equivalent to a BPMN parse listener. That means, a listener can be registered that receives a notification for every parsed CMMN model element when a CMMN case is deployed to the process engine. The class [KPITransformListener][kpi-transform-listener] implements the interface [org.camunda.bpm.engine.impl.cmmn.transformer.CmmnTransformListener][cmmn-transform-listener]. The process engine plugin [CustomElementsProcessEnginePlugin][process-engine-plugin] registers the transform listener with the process engine. The plugin itself is declared in the process engine configuration, here [camunda.cfg.xml][camunda-cfg-xml].

### Accessing Custom Typed Elements from a CMMN model instance

In [KPITransformListener][kpi-transform-listener], access to the custom model elements is implemented.

[bpmn-model]: https://github.com/camunda/camunda-bpmn-model
[dmn-model]: https://github.com/camunda/camunda-dmn-model
[xml-model]: https://github.com/camunda/camunda-xml-model
[cmmn-model]: https://github.com/camunda/camunda-cmmn-model
[test-case]: src/test/java/org/camunda/bpm/example/modelapi/TransformListenerCustomElementsTest.java
[kpi-transform-listener]: src/main/java/org/camunda/bpm/example/modelapi/KPITransformListener.java
[cmmn-transform-listener]: http://docs.camunda.org/7.3/api-references/javadoc/org/camunda/bpm/engine/impl/cmmn/transformer/CmmnTransformListener.html
[process-engine-plugin]: src/main/java/org/camunda/bpm/example/modelapi/CustomElementsProcessEnginePlugin.java
[camunda-cfg-xml]: src/test/resources/camunda.cfg.xml
[kpi-element]: src/main/java/org/camunda/bpm/example/modelapi/KPIElement.java
[kpi-element-impl]: src/main/java/org/camunda/bpm/example/modelapi/KPIElementImpl.java
[custom-cmmn]: src/main/java/org/camunda/bpm/example/modelapi/CustomCmmn.java
[cmmn-xml]: src/test/resources/case.cmmn
