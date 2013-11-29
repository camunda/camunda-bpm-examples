# Embedded Task Forms

This Quickstart demonstrates how to use the [Embedded Forms](http://docs.camunda.org/latest/guides/user-guide/#embedded-task-forms) Feature. Embedded Forms are plain HTML5 documents which can be loaded from your app and rendered embedded inside the camunda Tasklist:

![Embedded Forms Screenshot][1]

# Overview

## Where are embedded taskforms added?

Embedded Forms can be added to the web resources of a web application. Since we use maven, they are added to the [src/main/webapp][4] folder of your project.

## How are embedded taskforms referenced?

Embedded Taskforms are referenced using the `camunda:taskKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="embedded:app:start-form.html" name="Loan Request Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using camunda modeler:

![Embedded Forms Screenshot Modeler][2]

## Which form controls are used in this Quickstart?

This quickstart demonstrates the use of most of the supported form controls. See [start-form.html][3] for the complete example.

### Input Text

```html
<input form-field required type="text" name="firstname" placeholder="John" ng-minlength="2" ng-maxlength="20">
```

### Input Number

```html
<input form-field type="number" name="loanAmount" required min="1000">
```

### Select Box

```html
<select form-field type="string" name="loanType" required>
  <option value="mortage" checked>Mortage Loan (5%)</option>
  <option value="cashAdvance">Cash Advance (10%)</option>
</select>
```

### Radio Button

```html
<label class="radio inline">
  <input form-field type="radio" name="gender" value="m">
  Mr.
</label>
<label class="radio inline">
  <input form-field type="radio" name="gender" value="w">
  Mrs.
</label>
```

### Textarea

```html
<textarea form-field name="address" rows="4"> </textarea>
```

### Custom Javascript

```html
<script form-script type="text/form-script">
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
