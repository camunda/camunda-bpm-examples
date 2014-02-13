Sample Plugin for camunda cockpit
=================================

This is a simple plugin that showcases the plugin system of cockpit, the process monitoring tool of [camunda BPM](http://docs.camunda.org).

Built and tested against camunda BPM version `7.1.0-SNAPSHOT`.


Integrate into camunda webapp
-----------------------------

Add the plugin as a dependency to the cockpit `pom.xml` and rebuild the camunda web application.

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

Read the [plugin development how to](http://docs.camunda.org/latest/real-life/how-to/#cockpit-how-to-develop-a-cockpit-plugin).


License
-------

Use under terms of MIT license.