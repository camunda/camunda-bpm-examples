# Create process with fluent BPMN model API

This quickstart demonstrates how to create a process with the BPMN model API. We
will even learn how to create complex BPMN processes with the fluent builder API of the
BPMN model API.

After this quickstart, you will be able to create processes with the
BPMN model API, composed of the following elements:

* Start event
* End event
* Parallel gateway
* Exclusive gateway
* Service task
* User task
* Script task

## Invoice example process

The process we want to create is similar to the invoice process from the [camunda-bpm-platform/examples][1].
We aim to file it again with the executable process definition of the depicted invoice process.

![Invoice Process][3]

## Create the process with the BPMN model API

The code to create the process by the BPMN model API is show as the JUnit test [CreateInvoiceProcessTest][4].

The entry point for the fluent builder API is the `Bpmn.createProcess()` method. To finish the
building process we can call the `.done()` method at any time, which will return the
created model instance containing the process.

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .[...]
  .done();
```

After that, we can set attributes of the process to create. For example, we can set the name
of the process.

```java
BpmnModelInstance modelInstance = Bpmn.createExecutableProcess("invoice")
  .name("BPMN API Invoice Process")
  .[...]
  .done();
```

The next step is to create a start event and set its attributes. In this example we set
a name.

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .name("BPMN API Invoice Process")
  .executable()
  .startEvent()
    .name("Invoice received")
  .[...]
  .done();
```

From now on we can create user, service or script tasks and parallel or exclusive gateways to
model the process we want to create. For every task we can set attributes like the ID, name, camunda:formKey,
camunda:assignee, camunda:class, camunda:candidateUsers or camunda:candidateGroups.

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .name("BPMN API Invoice Process")
  .[...]
  .userTask()
    .name("Assign Approver")
    .camundaAssignee("demo")
  .userTask()
    .id("approveInvoice")
    .name("Approve Invoice")
  .[...]
  .userTask()
    .name("Prepare Bank Transfer")
    .camundaCandidateGroups("accounting")
  .serviceTask()
    .name("Archive Invoice")
    .camundaClass("org.camunda.bpm.example.invoice.service.ArchiveInvoiceService")
  .[...]
  .done();
```

Gateways are also flow nodes which we can add after every task. We can set the
gateway direction and conditions for outgoing sequence flows on exclusive gateways.

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .name("BPMN API Invoice Process")
  .[...]
  .userTask()
    .id("approveInvoice")
    .name("Approve Invoice")
  .exclusiveGateway()
    .name("Invoice approved?")
    .gatewayDirection(GatewayDirection.Diverging)
  .condition("yes", "${approved}")
  .userTask()
    .name("Prepare Bank Transfer")
    .camundaCandidateGroups("accounting")
  .[...]
  .done();
```

If we add a gateway, we usually want to create parallel execution paths. To create this,
the pattern is the following:

1. Create a gateway (optionally set an ID)
2. Create the first execution path till another gateway or end event
3. Jump back to a gateway to create a new execution path
 1. Jump back to the last unique gateway with the method `.moveToLastGateway()`, or
 2. Jump to a specific gateway by ID with the method `.moveToNode(gatewayId)`

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .name("BPMN API Invoice Process")
  .[...]
  .exclusiveGateway()
    .name("Invoice approved?")
    .gatewayDirection(GatewayDirection.Diverging)
  .condition("yes", "${approved}")
  .userTask()
    .name("Prepare Bank Transfer")
    .camundaCandidateGroups("accounting")
  .serviceTask()
    .name("Archive Invoice")
    .camundaClass("org.camunda.bpm.example.invoice.service.ArchiveInvoiceService")
  .endEvent()
    .name("Invoice processed")
  .moveToLastGateway()
  .condition("no", "${!approved}")
  .userTask()
    .name("Review Invoice")
    .camundaAssignee("demo")
  .[...]
  .done();
```

When we create parallel and diverging execution paths it is a common use case to
connect an execution path to a pre-existing element such as a parallel
gateway (join) or a previous element in the process (loop). For that, the
`.connectTo(id)` method exists.

```java
BpmnModelInstance modelInstance = Bpmn.createProcess()
  .name("BPMN API Invoice Process")
  .[...]
  .userTask()
    .id("approveInvoice")
    .name("Approve Invoice")
    .camundaAssignee("${approver}")
  .[...]
  .exclusiveGateway()
    .name("Review successful?")
    .gatewayDirection(GatewayDirection.Diverging)
  .condition("no", "${!clarified}")
  .endEvent()
    .name("Invoice not processed")
  .moveToLastGateway()
  .condition("yes", "${clarified}")
  .connectTo("approveInvoice")
  .done();
```

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test
4. Check if the JUnit test is green

Note: Please note that since the process is generated by our code, no DI information is contained. If you want to see the
process model XML, go to the end of the JUnit test [CreateInvoiceProcessTest][4] and copy the following line of code into the test case.

```java
Bpmn.writeModelToStream(System.out, modelInstance);
```

[1]: https://github.com/camunda/camunda-bpm-platform/tree/master/examples/invoice
[3]: invoice.png
[4]: src/test/java/org/camunda/bpm/quickstart/CreateInvoiceProcessTest.java
[5]: https://github.com/camunda/camunda-bpmn-model
