# Synchronous Service Invocation

This Quickstart demonstrates how to implement a synchronous service invocation using a Java Delegate.
We learn

* How to implement the Java Delegate Interface,
* How to reference a Java Delegate Implementation from BPMN 2.0

After having looked through the code, you will understand the behavior of a synchronous service invocation in case of

* a successful invocation
* an invocation failure.

## Show me the important parts!

The process model is composed of three tasks:

![Process Model][1]

* Wait State Before: initially the process instance is waiting here.
* Synchronous Service Task: the service task invoked by the process engine in a synchronous fashion.
* Wait State After: in case of a successful invocation, the process instance will advance to here.

### Create A Java Delegate Implementation

Implement the `org.camunda.bpm.engine.delegate.JavaDelegate` interface:

``` java
public class SynchronousServiceTask implements JavaDelegate {

  // some constants provided to the unit test

  public static final String SHOULD_FAIL_VAR_NAME = "shouldFail";
  public static final String PRICE_VAR_NAME = "price";
  public static final float PRICE = 199.00f;

  public void execute(DelegateExecution execution) throws Exception {

    // Here you could either add the business logic of the service task
    // or delegate to the actual business logic implementation provided
    // by a different class.

    // You could also invoke a Remote Service using REST, SOAP or EJB-Remote
    // in a synchronous fashion.

    // You can interact with the active execution (process instance) through
    // the DelegateExecution object. Most prominently, you can read and modify variables.

    // In this example, we
    //  - either throw an exception
    //  - or add a variable to the execution so that we can check for it in the unit test:

    if(((Boolean)execution.getVariable(SHOULD_FAIL_VAR_NAME)) == true) {
      throw new RuntimeException("Service invocation failure!");

    } else {
      execution.setVariable(PRICE_VAR_NAME, PRICE);

    }
  }
}
```

### Reference the JavaDeleagte from BPMN 2.0

The Java Deleagte can be referenced using the `class` attribute form the process engine Namespace:

``` xml
<bpmn2:serviceTask id="ServiceTask_1"
  camunda:class="org.camunda.quickstart.servicetask.invocation.sync.SynchronousServiceTask"
  name="Synchronous Service Task">
```

Using camunda Modeler, you can configure the service task using the properties panel:

![Configure Java Deleagte using camunda Modeler][2]


## Invocation Semantics

By default, the process engine always uses the client thread to do work. In this example, the unit test
triggers the process engine using the `completeTask()` method. The process engine uses that very thread to
advance execution from the user task to the service task and invoke the `execure()`-Method provided by the
`Java Delegate` implementation:

![Synchronous Service Invocation Sequence][3]

This blocks the process engine from advancing in this process
instance until the call returns.

The synchronous nature of the invocation allows to leverage Thread Context:
the `JavaDelegate` implementation may participate in the same Transaction
as the process engine, Security Context is propagated and so forth.

The synchronous nature of the invocation also allows for a very simple failure
handling strategy: if this delegate implementation throws an exception, it will be
caught by the blocked thread and handled using a transaction rollback: the process
engine will roll back to the last persistent state. In this example the last persistent
state is the usertask preceding the service task ("Wait State Before").

## How to use it?

1. Checkout the prokject with Git
2. Import into your IDE
3. Inspect the sources and

[1]: docs/process-model.png
[1]: docs/service-camunda-modeler.png
[2]: docs/synchronous-service-invocation-sequence.png
