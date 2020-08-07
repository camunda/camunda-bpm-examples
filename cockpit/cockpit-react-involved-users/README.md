ReactJS 16.x "Involved Users" Cockpit Plugin
=======================================

This example shows you how to build and bundle a plugin using react. When building your plugin using libraries, you have to make sure all your components are bundled into a single bundle. In this example, we use rollup to create the bundle.


![Screenshot](screenshot.png)


Building the Project
--------------------

Install the project with `npm i` and build the plugin with `npm run build`. Your plugin will be created in `dist/plugin.js`.

Integrate into Camunda Webapp
-----------------------------

Copy the `plugin.js` file into the `app/cockpit/scripts/` folder in your Camunda webapp distribution.
For the Tomcat distribution, this would be `server/apache-tomcat-X.X.XX/webapps/camunda/app/cockpit/scripts/`.

Add the following content to the `app/cockpit/scripts/config.js` file:

```
// …
  customScripts: [
    'scripts/plugin.js'
  ]
// …
```

You can add custom CSS by adding it to the `app/cockpit/styles/user-styles.css`

After that start the server, login to Cockpit and navigate to the process definition view to check the result.

License
-------

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
