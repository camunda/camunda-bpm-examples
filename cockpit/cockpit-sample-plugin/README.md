Sample Plugin for camunda Cockpit
=================================

This is a simple plugin that showcases the plugin system of Cockpit, the process monitoring tool of [camunda BPM](http://docs.camunda.org).

Built and tested against camunda BPM version `7.1.0-SNAPSHOT`.


Integrate into camunda webapp
-----------------------------

Add the plugin as a dependency to the Cockpit `pom.xml` and rebuild the camunda web application.

    <dependencies>
      ...
      <dependency>
        <groupId>org.camunda.bpm.cockpit.plugin</groupId>
        <artifactId>cockpit-sample-plugin</artifactId>
        <version>1.0-SNAPSHOT</version>
        <scope>runtime</scope>
      </dependency>


Guide
-----

Read [How to develop a Cockpit plugin][1].


License
-------

Use under terms of MIT license.

[1]: http://docs.camunda.org/latest/real-life/how-to/#cockpit-how-to-develop-a-cockpit-plugin