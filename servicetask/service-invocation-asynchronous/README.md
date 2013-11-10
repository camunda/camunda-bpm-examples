# Asynchronous Service Invocation

This Quickstart demonstrates how to implement an asynchronous service invocation using a Signallable Activity Behavior.
We learn

* How to implement the Signallable Activity Behavior Interface,
* How to reference a Signallable Activity Behavior Implementation from BPMN 2.0

After having looked through the code, you will understand the behavior of an asynchronous service invocation in case of

* a successful invocation
* a service failure.

## Show me the important parts!

The process model is composed of three tasks:

![Process Model][1]

* Wait State Before: initially the process instance is waiting here.
* Asynchronous Service Task: the service task invoked by the process engine in an asynchronous fashion.
* Wait State After: in case of a successful invocation, the process instance will advance to here.

### Create a Signallable Activity Behavior Implementation

Create a new Java Class extending `org.camunda.bpm.engine.impl.bpmn.behavior.AbstractBpmnActivityBehavior`:

``` java
public class AsynchronousServiceTask extends AbstractBpmnActivityBehavior {

  public static final String EXECUTION_ID = "executionId";

  public void execute(final ActivityExecution execution) throws Exception {

    // Build the payload for the message:
    Map<String, Object> payload = new HashMap<String, Object>(execution.getVariables());
    // Add the execution id to the payload:
    payload.put(EXECUTION_ID, execution.getId());

    // Publish a message to the outbound message queue. This method returns after the message has
    // been put into the queue. The actual service implementation (Business Logic) will not yet
    // be invoked:
    MockMessageQueue.INSTANCE.send(new Message(payload));

  }

  public void signal(ActivityExecution execution, String signalName, Object signalData) throws Exception {

    // leave the service task activity:
    leave(execution);
  }

}
```

### Reference the Signallable Activity Behavior from BPMN 2.0

The Java Deleagte can be referenced using the `class` attribute form the process engine Namespace:

``` xml
<bpmn2:serviceTask id="serviceTaskActivity"
  camunda:class="org.camunda.quickstart.servicetask.invocation.AsynchronousServiceTask"
  name="Asynchronous Service Task">
```

Using camunda Modeler, you can configure the service task using the properties panel:

![Configure Signallable Activity Behavior using camunda Modeler][2]


## Invocation Semantics

The `SignallableActivityBehavior` provides two methods: `execute()` and `signal()`:

![Asynchronous Service Invocation Sequence][3]

* The `execute(ActivityExecution)`-Method is invoked when the service task is entered. It is typically used for sending an asynchronous message to the actual service (Business Logic). When the method returns, the process engine will NOT continue execution. The `SignallableActivityBehavior` acts as a wait state.

* The `signal(ActivityExecution, String, Object)`-method is invoked as the process engine is being triggered by the callback. The signal-Method is responsible for leaving the service task activity.

The asynchronous nature of the invocation decouples the process engine from the service implementation. The process engine does not propagate any thread context to the service implementation. Most prominently, the service implementation is not invoked in the context of the process engine transaction. On the contrary, from the point of view of the process engine, the `SignallableActivityBehavior` is a wait state: after the `execute()`-Method returns, the process engine will stop execution, flush out the state of the execution to the database and wait for the callback to occur.

If a failure occurs in the service implementation (Business Logic), the failure will not cause the process engine to roll back. The reason is that the service implementation is not directly invoked by the process engine and does not participate in the process engine transaction.

## How to use it?

1. Checkout the prokject with Git
2. Import into your IDE
3. Inspect the sources and run the unit test.

[1]: docs/process-model.png
[2]: docs/service-camunda-modeler.png
[3]: docs/asynchronous-service-invocation-sequence.png
