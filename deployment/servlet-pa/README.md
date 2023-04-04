# Simple Servlet Process Application Example

This example demonstrates how to deploy a simple servlet process application.

## How to use it

1. Build it with Maven.
2. Deploy it to a `camunda-bpm-platform` distro of your choice (for WildFly, use version 26 or below, install as described [here][1]).
3. Watch out for this console log:

```bash
Service Task 'Example ServiceTask' is invoked!
```

## Moving to Jakarta API

If you would like to deploy this on a Jakarta EE 9+ server like WildFly 27 and beyond, perform the following steps:

1. Replace the `javax.servlet-api` dependency with a Jakarta equivalent, i.e. `jakarta.servlet-api`.
2. Replace all occurrences of `javax.servlet` in the code with `jakarta.servlet`, e.g. in `ExampleProcessApplication`.
3. Repalce all occurrences of `org.camunda.bpm.application.impl.ServletProcessApplication` with `org.camunda.bpm.application.impl.JakartaServletProcessApplication`, e.g. in `ExampleProcessApplication`.
4. Build and deploy as outlined above.

[1]: https://docs.camunda.org/manual/latest/installation/full/jboss/manual/