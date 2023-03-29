# Jakarta EJB Process Application Example

This example demonstrates how to deploy a Jakarta EJB process application.

## How to use it

1. Build it with Maven.
2. Deploy it to a `camunda-bpm-platform` distro of your own choice that supports Jakarta EE 9+ EJBs (e.g. WildFly).
3. Wait a minute.
4. Watch out for this console log:

```bash
This is a @Stateless Ejb component invoked from a BPMN 2.0 process.
```
