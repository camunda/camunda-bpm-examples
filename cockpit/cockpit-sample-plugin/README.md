Sample Plugin for Camunda Cockpit
=================================

This is a simple plugin that showcases the plugin system of Cockpit, the process monitoring tool of [Camunda BPM](http://docs.camunda.org).

Built and tested against Camunda BPM version `7.8.0`.

![Screenshot](screenshot.png)

# Integrate into Camunda webapp

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

# Guide

Read [this guide](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md)

1. [Server Side](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#server-side)
	  1. [Plug-in Archive](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#plug-in-provided)
	  2. [Plug-in Main Class](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#plug-in-main-class)
			* [Testing Plug-in Discovery](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#testing-plug-in-discovery)
	  3. [Custom Query](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#custom-query)
			* [Testing Queries](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#testing-queries)
	  4. [Defining and Publishing Plug-in Services](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#defining-and-publishing-plug-in-services)
			* [Use Tenant Check](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#use-tenant-check)
			* [Testing JAX-RS Resources](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#testing-jax-rs-resources)
2. [Client Side](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#client-side)
	  1. [Static Plugin Assets](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#static-plugin-assets)
			* [Testing Assets](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#testing-assets)
	  2. [Integration into Cockpit](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#integration-into-cockpit)
	  3. [plugin.js Main File](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#plugin-js-main-file)
	  4. [HTML View](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#html-view)
3. [Summary](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#summary)
4. [Additional Resources](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#additional-resources)
3. [How Client-Side Plugins Work](https://github.com/camunda/camunda-bpm-examples/tree/master/cockpit/cockpit-sample-plugin/Guide.md#how-client-side-plugins-work)

# License

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

[1]: https://github.com/camunda/camunda-bpm-webapp
[2]: https://docs.camunda.org/manual/examples/tutorials/develop-cockpit-plugin/
