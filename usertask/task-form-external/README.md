# External Task Forms

This Quickstart demonstrates how to use the [External Forms](http://docs.camunda.org/latest/guides/user-guide/#tasklist-task-forms-external-task-forms) Feature. External Forms are HTML forms which can be loaded from your app and started via the camunda Tasklist:

![External Forms Tasklist Screenshot][1]

After the process start, the HTML form is rendered in a new window.

![External Forms Screenshot][2]

# Overview

## Where are external taskforms added?

External Forms can be added to the web resources of a web application. Since we use maven, they are added to the [src/main/webapp][4] folder of your project.

## How are external taskforms referenced?

External Taskforms are referenced using the `camunda:taskKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="app:submitLoanRequest.jsf" name="Loan Request Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using camunda modeler:

![External Forms Screenshot Modeler][3]

For more detailed information to External Task Forms see [JSF Task Forms](http://docs.camunda.org/latest/real-life/how-to/#user-interface-jsf-task-forms)

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a camunda BPM platform distribution
4. Go to the Tasklist and start a process instance for the process named "External Forms Quickstart"

[1]: docs/screenshot-tasklist.png
[2]: docs/screenshot.png
[3]: docs/screenshot-modeler.png
[4]: src/main/webapp
