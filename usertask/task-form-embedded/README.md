# Embedded Task Forms

This quickstart demonstrates how to use the [Embedded Forms][5] feature. Embedded Forms are plain HTML5 documents which can be loaded from your app and rendered embedded inside the camunda Tasklist:

![Embedded Forms Screenshot][1]

# Overview

## Where are embedded taskforms added?

Embedded Forms can be added to the web resources of a web application. As we use maven, they are added to the [src/main/webapp][4] folder of your project.

## How are embedded taskforms referenced?

Embedded Taskforms are referenced using the `camunda:taskKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="embedded:app:start-form.html" name="Loan Request Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using the camunda Modeler:

![Embedded Forms Screenshot Modeler][2]

## Which form controls are used in this quickstart?

This quickstart demonstrates the use of most of the supported form controls. See [start-form.html][3] for the complete example.

### Input Text

```html
<input required
       type="text"
       cam-variable-name="firstname"
       cam-variable-type="String"
       placeholder="John"
       ng-minlength="2"
       ng-maxlength="20" />
```

### Input Number

```html
<input required
       type="number"
       cam-variable-name="loanAmount"
       cam-variable-type="Double"
       min="1000" />
```

### Select Box

```html
<select required cam-variable-name="loanType" cam-variable-type="String">
  <option value="mortage" checked>Mortage Loan (5%)</option>
  <option value="cashAdvance">Cash Advance (10%)</option>
</select>

```

### Textarea

```html
<textarea cam-variable-name="address"
          cam-variable-type="String"
          rows="4"></textarea>
```

### Custom Javascript

```html
<script cam-script type="text/form-script">
...
</script>
```

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a camunda BPM platform distribution
4. Go the the Tasklist and start a process instance for the process named "Embedded Forms Quickstart"

[1]: docs/screenshot.png
[2]: docs/screenshot-modeler.png
[3]: src/main/webapp/start-form.html
[4]: src/main/webapp
[5]: https://docs.camunda.org/manual/user-guide/task-forms/#embedded-task-forms
