Sample Plugin for Camunda Cockpit
=================================

This is a simple plugin that showcases the plugin system of Cockpit, the process monitoring tool of [Camunda BPM](http://docs.camunda.org).

Built and tested against Camunda BPM version `7.4.0`.

![Screenshot](screenshot.png)

Integrate into Camunda webapp
-----------------------------

1. Build this demo: `mvn clean install`

2. Clone the [camunda-bpm-webapp][1] repository

3. Add the plugin as a dependency to the camunda-bpm-webapp `pom.xml` and rebuild the Camunda web application.
```xml
<dependencies>
  <!-- ... -->
  <dependency>
    <groupId>org.camunda.bpm.cockpit.plugin</groupId>
    <artifactId>cockpit-sample-plugin</artifactId>
    <version>1.0-SNAPSHOT</version>
    <scope>runtime</scope>
  </dependency>
```

Guide
-----

Read [How to develop a Cockpit plugin][2].


License
-------

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

[1]: https://github.com/camunda/camunda-bpm-webapp
[2]: https://docs.camunda.org/manual/examples/tutorials/develop-cockpit-plugin/
