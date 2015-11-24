# External Task Forms

This quickstart demonstrates how to use Java Server Faces (JSF) forms as [External Forms][5]. External Forms can be loaded from your app and started via the camunda Tasklist:

![External Forms Tasklist Screenshot][1]

The JSF form is rendered in a new window.

![External Forms Screenshot][2]

# Overview

## Source code of a JSF taskform

The following is the source code of the JSF form used to start the process (the one in the screenshot displayed above):

```html
<!DOCTYPE HTML>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"
  xmlns:ui="http://java.sun.com/jsf/facelets"
  xmlns:h="http://java.sun.com/jsf/html"
  xmlns:f="http://java.sun.com/jsf/core">

<f:view>
  <f:metadata>
    <!-- Start a new process instance. Process Definition Key is read internally from
         request parameters and cached in the CDI conversation scope.
         NOTE: Syntax is different when working on user task forms, see file "approveLoanRequest.xhtml". -->
    <f:event type="preRenderView" listener="#{camundaTaskForm.startProcessInstanceByKeyForm()}" />
  </f:metadata>
  <h:head>
    <title>Submit Loan Request</title>
  </h:head>
  <h:body>
    <h2>Start Process Instance</h2>
    <h1>External Forms Quickstart</h1>
    <hr />
    <h1>Submit Loan Request</h1>
    <h:form id="submitForm">
      <h:panelGrid columns="2">
        <p>
          <label for="firstname">Firstname</label>
          <!-- create process variables using the processVariables map. -->
          <h:inputText id="firstname" value="#{processVariables['firstname']}" required="true" />
        </p>
        <p>
          <label for="lastname">Lastname</label>
          <h:inputText id="lastname" value="#{processVariables['lastname']}" required="true" />
        </p>
        <p>
          <label for="netIncome">Net Income</label>
          <h:inputText id="netIncome" value="#{processVariables['netIncome']}" converter="javax.faces.Integer" required="true" />
        </p>
        <p>
          <label for="amount">Loan Amount</label>
          <!-- use type converters to convert process variables to the correct type. -->
          <h:inputText id="amount" value="#{processVariables['amount']}" converter="javax.faces.Integer" required="true" />
        </p>
      </h:panelGrid>

      <!-- The button starts a new process instance. This ends the conversation and redirects us to the tasklist.
           NOTE: Syntax is different when working on user task forms, see file "approveLoanRequest.xhtml". -->
      <h:commandButton id="submit_button" value="Submit Request" action="#{camundaTaskForm.completeProcessInstanceForm()}" />

      <h:messages style="color:red;margin:8px;" />
    </h:form>
  </h:body>
</f:view>
</html>
```

This example also provides a Task Form associated with a user task. In that case, the usage of the 'taskForm' bean is slightly different:

```html
<!DOCTYPE HTML>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"
  xmlns:ui="http://java.sun.com/jsf/facelets"
  xmlns:h="http://java.sun.com/jsf/html"
  xmlns:f="http://java.sun.com/jsf/core">

<f:view>
  <f:metadata>
    <!-- Start working on a task. Task Id is read internally from
         request parameters and cached in the CDI conversation scope.
         NOTE: Syntax is different when starting a process instance, see file "submitLoanRequest.xhtml". -->
    <f:event type="preRenderView" listener="#{camundaTaskForm.startTaskForm()}" />
  </f:metadata>
  <h:head>
    <title>Approve Loan Request</title>
  </h:head>
  <h:body>
    <h:form id="approveForm">
      <!-- ... -->

      <!-- The button completes the current task. This ends the conversation and redirects us to the tasklist.
           NOTE: Syntax is different when starting a process instance, see file "submitLoanRequest.xhtml". -->
      <h:commandButton id="approve_button" value="Approve Request" action="#{camundaTaskForm.completeTask()}" />

    </h:form>
  </h:body>
</f:view>
</html>
```

## Where are external JSF taskforms added?

External Forms can be added to the web resources of a web application. As we use maven, they are added to the [src/main/webapp][4] folder of your project.

## How are external JSF taskforms referenced?

External Taskforms are referenced using the `camunda:formKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="app:submitLoanRequest.jsf" name="Loan Request Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using the camunda Modeler:

![External Forms Screenshot Modeler][3]

For more detailed information about External Task Forms, see [JSF Task Forms][6]

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a camunda BPM platform distribution (Use *JBoss or Glassfish distribution*).
4. Go to the Tasklist and start a process instance for the process named "External Forms Quickstart"

[1]: docs/screenshot-tasklist.png
[2]: docs/screenshot.png
[3]: docs/screenshot-modeler.png
[4]: src/main/webapp
[5]: https://docs.camunda.org/manual/user-guide/task-forms/#external-task-forms
[6]: https://docs.camunda.org/manual/examples/tutorials/jsf-task-forms/
