# Generated Task Forms

This Quickstart demonstrates how to use the [Embedded Forms](http://docs.camunda.org/latest/guides/user-guide/#embedded-task-forms) Feature. Embedded Forms are plain HTML5 documents which can be loaded from your app and rendered embedded inside the camunda Tasklist:



# Overview

## Where are embedded taskforms added?

Embedded Forms can be added to the web resources of a web application. Since we use maven, they are added to the `src/main/webappp` folder of your project.

## How are embedded taskforms referenced?

Embedded Taskforms are referenced using the `camunda:taskKey` property of a BPMN `<startEvent>` or a BPMN `<userTask>`:

```xml
<startEvent id="startEvent" camunda:formKey="embedded:app:start-form.html" name="Loan Request &#xD;&#xA;Received">
  ...
</startEvent>
```

The attribute can also be set through the properties panel using camunda modeler:

## Which form controls are used in this Quickstart?

This quickstart demonstrates the use of the following form controls:

### Input Text

``` html
<input form-field required type="text" name="firstname" id="inputFirstname" placeholder="John" ng-minlength="2" ng-maxlength="20">
```

### Input Number

```html
<input form-field required type="number" id="inputLoanAmount" name="loanAmount" min="1000">
```

### Select Box

```html
<select id="selectLoanType" form-field type="string" name="loanType" required ng-change="calculateLoan()">
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

## Textarea

```html
<textarea form-field name="address" rows="4" id="inputAddress"> </textarea>
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
