# Simple Jakarta Servlet Process Application Example

This example demonstrates how to deploy a simple servlet process application.

## How to use it

1. Build it with Maven.
2. Deploy it to a `camunda-bpm-platform` distro of your choice (Tomcat 9/WildFly 35+).
3. Watch out for this console log:

```bash
Service Task 'Example ServiceTask' is invoked!
```

## Java EE API

If you would like to deploy this on a Java EE server like Tomcat 9, you can refer to the [example with fixed version of Camunda 7.22][1].

[1]: [https://github.com/camunda/camunda-bpm-examples/tree/7.22/deployment/servlet-pa]

