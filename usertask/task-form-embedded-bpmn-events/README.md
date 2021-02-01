# Error and Escalation Events in Embedded Forms

This quickstart demonstrates how to use escalation and error events in embedded forms.

# Overview

## Where are Error and Escalation events defined?

Boundary Events can be added in the Camunda Modeler. Each can be referenced by its error- or escalation code.

![Modeler Screenshot][1]

## How are these events triggered from an embedded form?

Error events can be triggered by calling `camForm.error('error-code', 'error-message')` from a custom Script or using the `<button cam-error-code="error-code">` element.

Similarly, an escalation can be triggered using `camForm.escalate('escalation-code')` from a custom Script or using the `<button cam-escalation-code="escalation-code">` element.

## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the war file to a Camunda Platform distribution
4. Go to the Tasklist and start a process instance for the process named "Embedded Forms BPMN Events"

[1]: docs/screenshot-modeler.png