# EJB Process Application Example

This example demonstrates how to deploy an EJB process application.

## How to use it

1. Build it with Maven.
2. Deploy it to a `camunda-bpm-platform` distro of your own choice that supports Java EE 6 to 8 EJBs (e.g. WildFly 26 and below, install as described [here][1]).
3. Wait a minute.
4. Watch out for this console log:

```bash
This is a @Stateless Ejb component invoked from a BPMN 2.0 process.
```

## Moving to Jakarta API

If you would like to deploy this on a Jakarta EE 9+ server like WildFly 31 and beyond, have a look at the [Jakarta EJB example][2].

[1]: https://docs.camunda.org/manual/latest/installation/full/jboss/manual/
[2]: /deployment/ejb-pa-jakarta