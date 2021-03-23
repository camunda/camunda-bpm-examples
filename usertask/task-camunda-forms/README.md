# Camunda Task Forms

This quickstart demonstrates how to use the [Camunda Forms][5] feature. Camunda Forms are `.form` files created in the Camunda Modeler and embedded inside the camunda Tasklist:

![Camunda Forms Screenshot][1]

# Overview

## Where are Camunda Forms added?

Camunda Forms can be added to the web resources of a web application. As we use maven, they are added to the [src/main/webapp][4] folder of your project.

## How are Camunda Forms referenced?

Camunda Forms are referenced using the `camunda:formKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="camunda-forms:app:start-form.form" name="Invoice Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using the camunda Modeler:

![Camunda Forms Screenshot Modeler][2]

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a Camunda Platform Runtime distribution
4. Go the the Tasklist and start a process instance for the process named "Camunda Forms Quickstart"

[1]: docs/screenshot.png
[2]: docs/screenshot-modeler.png
[3]: src/main/webapp/start-form.html
[4]: src/main/webapp
[5]: https://docs.camunda.org/manual/7.15/user-guide/task-forms/#camunda-task-forms
