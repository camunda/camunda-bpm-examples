# Generate JSF forms with the BPMN model API

This quickstart demonstrates how to use the BPMN model API to generate JSF
forms based on the underlying process XML.

We aim to generate two generic JSF forms for a start event and a user task.
The forms should be used in two different processes of similar types.

## Example processes

The support process example demonstrates a simple decision process where a user decides how to
handle a support ticket. The process starts with the selection of a support ticket. After that, 
a user decides how to handle the selected support ticket.

![Support Process][1]

The feature process example also demonstrates a similar decision process where a user decides
if a feature request is accepted or rejected. The process starts with the creation of a feature
request. After that, a user decides if the feature request is accepted or not.

![Feature Process][2]

## Generic forms

The next step is to analyze the two example processes to figure out which
information can be used in the process forms.

### Start event form

The start event in both processes has a name which describes the task of the start event. So, 
it could be displayed as a request to the user. The name of following user task clarifies
what the next step is after the start event, which could be used as a button label to submit the
start form.

So, a generic start event form for both processes could be (see [start-form.xhtml][3]):

```xml
<div class="row quickstart-form">
  <h:form class="form-horizontal">
    <legend>#{startEventController.getStartEventName(processDefinitionKey)}</legend>
    <div class="control-group">
      <label class="control-label" for="inputName">Title:</label>
      <div class="controls">
          <h:inputText disabled="false" id="inputName" value="#{processVariables['ticket-title']}" />
      </div>
    </div>
    <div class="control-group">
      <div class="controls">
        <h:commandButton id="submit_button" type="submit" value="#{startEventController.getUserTaskName(processDefinitionKey)}"
          action="#{camundaTaskForm.completeProcessInstanceForm()}" styleClass="btn btn-primary" />
      </div>
    </div>
  </h:form>
</div>
```

The method `startEventController.getStartEventName` returns the name of the start event and `startEventController.getUserTaskName` returns
the name of the following user task. How these methods gather the required information is explained in the next section.

### User task form

The user task in both processes is followed by an exclusive gateway. The exclusive gateway name is the question which the user
has to answer, while the outgoing sequence flows are labeled with the possible actions to take. So, a generic approach would
be to prompt the user the gateway question and to display the sequence flow labels as buttons. By a click on a button the user decides
which sequence flow to choose.

So, a generic user task form for booth processes could be (see [user-form.xhtml][4]):

```xml
<div class="row quickstart-form">
  <h:form>
    <fieldset class="quickstarts-buttons">
      <legend>#{userTaskController.question} &lt;#{processVariables['ticket-title']}&gt;</legend>
      <ui:repeat value="#{userTaskController.buttons}" var="context">
          <h:commandButton action="#{userTaskController.completeTask(context['variableName'], context['variableValue'])}" value="#{context['conditionName']}" styleClass="btn btn-large btn-primary" />
      </ui:repeat>
    </fieldset>
  </h:form>
</div>
```

The method `userTaskController.question` returns the name of the following exclusive gateway and `userTaskController.buttons` returns a list
of the corresponding sequence flow conditions. The task is completed by the `userTaskController.completeTask` method which handles
the logic to choose the correct execution path. This is explained in the next section.

## BPMN model API

To gather the necessary information for the generic forms, the camunda [BPMN model API][5] is used.

### StartEventController

To get the start event and user task name we need the XML representation of the current process. At the start process
form we only have the processDefinitionKey. However, with the `repositoryService` we can get the `processId` and the corresponding
`modelInstance`. With this `modelInstance` we can use the BPMN model API to get the start event of the process.

```java
private StartEvent getStartEvent(BpmnModelInstance modelInstance) {
  ModelElementType startEventType = modelInstance.getModel().getType(StartEvent.class);
  return (StartEvent) modelInstance.getModelElementsByType(startEventType).iterator().next();
}
```

We can use the start event to return its name

```java
protected String getStartEventName(BpmnModelInstance modelInstance) {
  StartEvent startEvent = getStartEvent(modelInstance);
  return stripLineBreaks(startEvent.getName());
}
```

and to find the following user task and return its name.

```java
public String getUserTaskName(String processDefinitionKey) {
  BpmnModelInstance modelInstance = getModelInstance(processDefinitionKey);
  return getUserTaskName(modelInstance);
}
```

### UserTaskController

To get the information for the user task form, we need the following exclusive gateway and the outgoing sequence flows.
With the help of the `respositoryService` we can again get the current `modelInstance`. Furthermore, we
can use the `taskForm` to get the ID of the current task, which we use to find the task and the following gateway
with the BPMN model API.

```java
private ExclusiveGateway getExclusiveGateway(String taskId, BpmnModelInstance modelInstance) {
  UserTask userTask = (UserTask) modelInstance.getModelElementById(taskId);
  return (ExclusiveGateway) userTask.getSucceedingNodes().singleResult();
}
```

We can now return the name of the gateway

```java
protected String getGatewayName(String taskId, BpmnModelInstance modelInstance) {
  ExclusiveGateway gateway = getExclusiveGateway(taskId, modelInstance);
  return stripLineBreaks(gateway.getName());
}
```

and analyze the outgoing sequence flows.

```java
public List<Map<String, String>> getButtons() {
  String taskId = getTaskId();
  BpmnModelInstance modelInstance = getModelInstance();
  return getButtons(taskId, modelInstance);
}
```

Every button needs a label, which is the name of the sequence flow. We also parse the expression condition
of the sequence flow to know which variable has to be set to which value so that the correct execution path
is chosen by the process. For example, a condition could be `#{do == 'close'}` where the variable `do` has to
be set to `"close"`. Or `#{action == 'reject'}` where the variable `action` should be set to `"reject"`.

```java
protected static Pattern EXPRESSION_PATTERN = Pattern.compile("[\\$#]\\{\\s*(\\w+)\\s*==\\s*'([^']+)'\\s*}");

private Map<String, String> getConditionValues(SequenceFlow sequenceFlow) {
  Map<String, String> values = new HashMap<String, String>();

  values.put("conditionName", stripLineBreaks(sequenceFlow.getName()));

  String condition = sequenceFlow.getConditionExpression().getTextContent();
  Matcher matcher = EXPRESSION_PATTERN.matcher(condition);
  if (matcher.matches()) {
    values.put("variableName", stripLineBreaks(matcher.group(1)));
    values.put("variableValue", stripLineBreaks(matcher.group(2)));
  }

  return values;
}
```

Finally, to complete the task the correct variable has to be set.

```java
public void completeTask(String variableName, String variableValue) throws IOException {
  businessProcess.setVariable(variableName, variableValue);
  taskForm.completeTask();
}
```

## Result

These are the generated forms for both processes.

### Support Process

Start event form:

![Select Support Ticket Form][6]

User task form:

![Handle Support Ticket Form][7]


### Feature Process

Start event form:

![Create Feature Request Form][8]

User task form:

![Handle Feature Request Form][9]



[1]: src/main/resources/support.png
[2]: src/main/resources/feature.png
[3]: src/main/webapp/forms/start-form.xhtml
[4]: src/main/webapp/forms/user-form.xhtml
[5]: https://github.com/camunda/camunda-bpmn-model
[6]: docs/support-start-form.png
[7]: docs/support-task-form.png
[8]: docs/feature-start-form.png
[9]: docs/features-task-form.png
