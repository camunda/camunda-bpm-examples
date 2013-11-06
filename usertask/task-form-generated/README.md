# Generated Task Forms

This Quickstart demonstrates how to use the [Generated Forms](http://docs.camunda.org/latest/guides/user-guide/#generated-task-forms) Feature.

## Show me the important parts!

Both `startEvent` and the `userTask` have form metadata defined:

<bpmn2:startEvent id="StartEvent_1" name="Loan Request &#xD;&#xA;Received">
  <bpmn2:extensionElements>
    <camunda:formData>
      <camunda:formField id="firstname" label="Firstname"
        type="string">
        <camunda:validation>
          <camunda:constraint name="maxlength" config="25" />
          <camunda:constraint name="required" />
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="lastname" label="Lastname"
        type="string">
        <camunda:validation>
          <camunda:constraint name="maxlength" config="25" />
          <camunda:constraint name="required" />
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="netIncome" label="Net Income"
        type="long">
        <camunda:validation>
          <camunda:constraint name="required" />
        </camunda:validation>
      </camunda:formField>
      <camunda:formField id="loanAmmount" label="Loan Ammount"
        type="long">
        <camunda:validation>
          <camunda:constraint name="required" />
        </camunda:validation>
      </camunda:formField>
    </camunda:formData>
  </bpmn2:extensionElements>
  <bpmn2:outgoing>SequenceFlow_1</bpmn2:outgoing>
</bpmn2:startEvent>

From this form metadata, an HTML Taskform is generated and displayed in the Tasklist.

## How to use it?

1. Checkout the prokject with Git
2. Build the project with maven
3. Deploy the war file to a camunda BPM platform distribution
4. Go the the Tasklist and start a process instance for the process named "Generated Forms Quickstart"
