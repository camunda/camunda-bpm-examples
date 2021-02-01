bpmn.js Cockpit module
======================

This example shows how to develop a Cockpit bpmn.js module.

For additional information, please also see the [documentation](https://docs.camunda.org/manual/7.13/webapps/cockpit/extend/configuration/#bpmn-diagram-viewer-bpmn-js).

Built and tested against Camunda Platform version `7.14.0`.

![Screenshot](screenshot.png)


Integrate into Camunda Webapp
-----------------------------

Copy the `bpmn-js-module.js` file into the `app/cockpit/scripts/` folder in your Camunda webapp distribution.
For the Tomcat distribution, this would be `server/apache-tomcat-X.X.XX/webapps/camunda/app/cockpit/scripts/`.

Add the following content to the `app/cockpit/scripts/config.js` file:

```
// …
  bpmnJs: {
    additionalModules: [
      'scripts/bpmn-js-module'
    ]
  }
// …
```
After that start the server, login to Cockpit and navigate to the Process instance view to check the result.

License
-------

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
