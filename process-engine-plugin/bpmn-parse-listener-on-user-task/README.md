# BPMN Parse Listener - adding task listener on user task

This example demonstrates how to use a BPMN Parse Listener as Process Engine Plugin.
We learn

* How to implement and activate a Process Engine Plugin
* How to implement a BPMN Parse Listener
* How to work with an Task Listener
* How to add the task listener to every User Task

After having looked through the code, you will understand the behavior of a BPMN Parse Listener in case of

* An additional parsing to the BPMN Parser in the Process Engine
* The Process Engine Plugin configuration.

What is the idea/use case of this demo:

* Assignees of the user tasks are often so busy that they do easily forget to check if they have a user task to complete.
* Therefore, as soon as a user task is reached, the assignee should be notified that he has work to do :-)

## Show me the important parts!

The process model is composed of two user tasks:

![Process Model][1]

* User Task 1 and 2: the user tasks contain nothing special.

### Create a Process Engine Plugin Implementation

Extend the `org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin` abstract class:

``` java
public class InformAssigneeParseListenerPlugin extends AbstractProcessEnginePlugin {

  @Override
  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    List<BpmnParseListener> preParseListeners = processEngineConfiguration.getCustomPreBPMNParseListeners();
    if(preParseListeners == null) {
      preParseListeners = new ArrayList<BpmnParseListener>();
      processEngineConfiguration.setCustomPreBPMNParseListeners(preParseListeners);
    }
    preParseListeners.add(new InformAssigneeParseListener());
  }

}
```

### Create a BPMN Parse Listener Implementation

Extend the `org.camunda.bpm.engine.impl.bpmn.parser.AbstractBpmnParseListener` abstract class:

``` java
public class InformAssigneeParseListener extends AbstractBpmnParseListener {

  @Override
  public void parseUserTask(Element userTaskElement, ScopeImpl scope, ActivityImpl activity) {
    ActivityBehavior activityBehavior = activity.getActivityBehavior();
    if(activityBehavior instanceof UserTaskActivityBehavior ){
      UserTaskActivityBehavior userTaskActivityBehavior = (UserTaskActivityBehavior) activityBehavior;
      userTaskActivityBehavior
        .getTaskDefinition()
        .addTaskListener("create", InformAssigneeTaskListener.getInstance());
    }
  }
}
```

### Create a Task Listener Implementation

Implement the `org.camunda.bpm.engine.delegate.TaskListener` interface:

``` java
public class InformAssigneeTaskListener implements TaskListener {

  private final Logger LOGGER = Logger.getLogger(this.getClass().getName());
  public static List<String> assigneeList = new ArrayList<String>();

  private static InformAssigneeTaskListener instance = null;

  protected InformAssigneeTaskListener() { }

  public static InformAssigneeTaskListener getInstance() {
    if(instance == null) {
      instance = new InformAssigneeTaskListener();
    }
    return instance;
  }

  public void notify(DelegateTask delegateTask) {
    String assignee = delegateTask.getAssignee();
    assigneeList.add(assignee);
    LOGGER.info("Hello " + assignee + "! Please start to work on your task " + delegateTask.getName());
  }

}
```

### Activate the BPMN Parse Listener Plugin

The BPMN Parse Listener can be activated in the `camunda.cfg.xml`:

``` xml
<!-- activate bpmn parse listener as process engine plugin -->
<property name="processEnginePlugins">
  <list>
    <bean class="org.camunda.bpm.example.parselistener.InformAssigneeParseListenerPlugin" />
  </list>
</property>
```

It is also possible to define the BPMN Parse Listener as `postParseListeners`.

## How does it work?

If you are impatient, just have a look at the [unit test][2].

In this example, the unit test triggers the process engine to deploy and parse the BPMN Process Model. 
The Process Engine BPMN Parser parses the process definition. The BPMN Parse Listener additionally parses the user task
to the BPMN Parser and adds the Task Listener to the given user task.

After that, the process engine starts the process instance and as soon as user task is entered it invokes the `notify`
implementation of the Task Listener. We then complete the user task and the other the `notify` method from the Task Listener
is executed once again.

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test.
4. Check the console if you can find: `Hello Kermit! Please start to work on your task User Task 1`

[1]: docs/bpmnParseListenerOnUserTask.png
[2]: src/test/java/org/camunda/bpm/example/test/BpmnParseListenerOnUserTaskTest.java
