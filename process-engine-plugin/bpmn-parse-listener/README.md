# BPMN Parse Listener

This example demonstrates how to use a BPMN Parse Listener as Process Engine Plugin.
We learn

* How to implement and activate a Process Engine Plugin
* How to implement a BPMN Parse Listener
* How to work with an Execution Listener and a Task Listener
* How to use properties as extension elements in BPMN 2.0

After having looked through the code, you will understand the behavior of a BPMN Parse Listener in case of

* An additional parsing to the BPMN Parser in the Process Engine
* The Process Engine Plugin configuration.

# Execution Listener

## Show me the important parts!

The process model is composed of two tasks:

![Process Model][1]

* ServiceTask 1 and 2: the service task contains custom extension properties.

### Create a Process Engine Plugin Implementation

Extend the `org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin` abstract class:

``` java
public class ProgressLoggingSupportParseListenerPlugin extends AbstractProcessEnginePlugin {

  @Override
  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration { 
    // get all existing preParseListeners
    List<BpmnParseListener> preParseListeners = processEngineConfiguration.getCustomPreBPMNParseListeners();
    
    if(preParseListeners == null) {
      // if no preParseListener exists, create new list
      preParseListeners = new ArrayList<BpmnParseListener>();
      processEngineConfiguration.setCustomPreBPMNParseListeners(preParseListeners);
    }
    
    // add new BPMN Parse Listener
    preParseListeners.add(new ProgressLoggingSupportParseListener());
  }
}
```

### Create a BPMN Parse Listener Implementation

Extend the `org.camunda.bpm.engine.impl.bpmn.parser.AbstractBpmnParseListener` abstract class:

``` java
public class ProgressLoggingSupportParseListener extends AbstractBpmnParseListener {

  // parse given service task to get the attributes of the property extension elements 

  @Override
  public void parseServiceTask(Element serviceTaskElement, ScopeImpl scope, ActivityImpl activity) {
  
    // get the <extensionElements ...> element from the service task
    Element extensionElement = serviceTaskElement.element("extensionElements");
    if (extensionElement != null) {
    
      // get the <camunda:properties ...> element from the service task
      Element propertiesElement = extensionElement.element("properties");
      if (propertiesElement != null) {
      
        //  get list of <camunda:property ...> elements from the service task
        List<Element> propertyList = propertiesElement.elements("property");
        for (Element property : propertyList) {
        
          // get the name and the value of the extension property element
          String name = property.attribute("name");
          String value = property.attribute("value");
          
          // check if name attribute has the expected value
          if("progress".equals(name)) {
          
            // add execution listener to the given service task element
            // to execute it when the end event of the service task fired
            ProgressLoggingExecutionListener progressLoggingExecutionListener = new ProgressLoggingExecutionListener(value);
            activity.addExecutionListener(ExecutionListener.EVENTNAME_END, progressLoggingExecutionListener);
          }
        }
      }
    }
  }
}
```

### Create an Execution Listener Implementation

Implement the `org.camunda.bpm.engine.delegate.ExecutionListener` interface:

``` java
public class ProgressLoggingExecutionListener implements ExecutionListener {

  private final Logger LOGGER = Logger.getLogger(this.getClass().getName());
  
  // static value list to see in the UNIT test if the execution listener was executed
  public static List<String> progressValueList = new ArrayList<String>();

  private String propertyValue;

  // constructor with extension property value as parameter
  public ProgressLoggingExecutionListener(String value) {
    this.propertyValue = value;
  }

  // notify method is executed when Execution Listener is called
  public void notify(DelegateExecution execution) throws Exception {
    progressValueList.add(propertyValue);
    
    // logging statement to see which value have the property 'progress'
    LOGGER.info("value of service task extension property 'progress': " + propertyValue);
  }
}
```

### Activate the BPMN Parse Listener Plugin

The BPMN Parse Listener can be activated in the `camunda.cfg.xml`:

``` xml
<!-- activate bpmn parse listener as process engine plugin -->
<property name="processEnginePlugins">
  <list>
    <bean class="org.camunda.bpm.example.parselistener.ProgressLoggingSupportParseListenerPlugin" />
  </list>
</property>
```

It is also possible to define the BPMN Parse Listener as `postParseListeners`.

### Configure Extension Properties on Service Task

It is possible to configure properties into the extensionElements of all BPMN 2.0 elements.  

``` xml
<bpmn2:serviceTask id="ServiceTask_1" camunda:class="org.camunda.bpm.example.delegate.ServiceTaskOneDelegate" name="ServiceTask 1">
  <bpmn2:extensionElements>
    <camunda:properties>
      <camunda:property value="50%" name="progress"/>
    </camunda:properties>
  </bpmn2:extensionElements>
</bpmn2:serviceTask>
```

Using the camunda Modeler, you can configure the service task using the properties panel:

![Configure Service Task using the camunda Modeler][2]


## How does it work?

If you are impatient, just have a look at the [unit test][3].

In this example, the unit test triggers the process engine to deploy and parse the BPMN Process Model. 
The Process Engine BPMN Parser parses the process definition. The BPMN Parse Listener additionally parses the service task
to the BPMN Parser and adds the Execution Listener to the given service task.

After that, the process engine starts the process instance and invokes the `execute()`-method provided by the `Java Delegate`
implementation. If the service task is completed, the process engine invokes the `notify()`-method of the execution listener implementation.  

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test, or run it with Maven: `mvn clean verify`
4. Check the console if you can find: `value of service task extension property 'progress': 100%`

[1]: docs/bpmnParseListener.png
[2]: docs/service-camunda-modeler.png
[3]: src/test/java/org/camunda/bpm/example/test/BpmnParseListenerTest.java

# Task Listener

## Show me the important parts!

The process model is composed of two user tasks:

![Process Model][4]

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
        .addTaskListener("assignment", InformAssigneeTaskListener.getInstance());
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

If you are impatient, just have a look at the [unit test][5].

In this example, the unit test triggers the process engine to deploy and parse the BPMN Process Model. 
The Process Engine BPMN Parser parses the process definition. The BPMN Parse Listener additionally parses the user task
to the BPMN Parser and adds the Task Listener to the given user task.

After that, the process engine starts the process instance and as soon as user task is entered it invokes the `notify`
implementation of the Task Listener. We then complete the user task and the `notify` method from the Task Listener
is executed once again. Afterwards, we change the assignee manually and the Task Listener is called a third time.

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test, or run it with Maven: `mvn clean verify`
4. Check the console if you can find: `Hello Kermit! Please start to work on your task User Task 1`

[4]: docs/bpmnParseListenerOnUserTask.png
[5]: src/test/java/org/camunda/bpm/example/test/BpmnParseListenerOnUserTaskTest.java
