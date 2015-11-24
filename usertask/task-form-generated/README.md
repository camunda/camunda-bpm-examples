# Generated Task Forms

This Quickstart demonstrates how to use the [Generated Forms](https://docs.camunda.org/manual/latest/user-guide/task-forms/#generated-task-forms) Feature. Generated Forms are HTML5 forms which are generated from Xml Metadata provided in BPMN 2.0 Xml. The metadata can be specified using camunda modeler:

![Generated Forms Modeler Screenshot][2]

From this, the process engine can generate a HTML form which can be displayed in the tasklist:

![Generated Forms Screenshot][1]

# Overview

Both `startEvent` and the `userTask` have form metadata defined:

```xml
<bpmn2:startEvent id="StartEvent_1" name="Loan Request Received">
  <bpmn2:extensionElements>
    <camunda:formData>
      <camunda:formField id="firstname" label="Firstname" type="string">
        <camunda:validation>
          <camunda:constraint name="maxlength" config="25"/>
          <camunda:constraint name="required"/>
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="lastname" label="Lastname" type="string">
        <camunda:validation>
          <camunda:constraint name="maxlength" config="25"/>
          <camunda:constraint name="required"/>
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="netIncome" label="Net Income" type="long">
        <camunda:validation>
          <camunda:constraint name="required"/>
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="loanAmmount" label="Loan Ammount" type="long">
        <camunda:validation>
          <camunda:constraint name="required"/>
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="loanType" label="Loan Type" type="enum">
        <camunda:validation>
          <camunda:constraint name="required"/>
        </camunda:validation>
        <camunda:value id="mortage" name="Mortage Loan (5%)"/>
        <camunda:value id="cashAdvance" name="Cash Advance (10%)"/>
      </camunda:formField>
    </camunda:formData>
  </bpmn2:extensionElements>
  <bpmn2:outgoing>SequenceFlow_1</bpmn2:outgoing>
</bpmn2:startEvent>
```
From this form metadata, an HTML Taskform is generated and displayed in the Tasklist.

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a camunda BPM platform distribution
4. Go to the Tasklist and start a process instance for the process named "Generated Forms Quickstart"

[1]: docs/screenshot.png
[2]: docs/screenshot-modeler.png
