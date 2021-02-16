JQuery 3.4 Behavior Patch
=================================

This example enables JQuery 3.4 behavior in the Camunda Webapps 7.14+ . It makes use of the `customScript` property of the webapp configurations.

You can read more about the JQuery 3.5 release in the [JQuery release blog](https://blog.jquery.com/2020/04/10/jquery-3-5-0-released/).

Built and tested against Camunda Platform version `7.15.0`.


Integrate into Camunda Webapp
-----------------------------

We use Tasklist as an example. If you need this fix for Cockpit or Admin, simply adjust the paths. 

Copy the `jquery-patch.js` file into the `app/tasklist/scripts/` folder in your Camunda webapp distribution. For the Tomcat distribution, this would be `server/apache-tomcat-X.X.XX/webapps/camunda/app/tasklist/scripts/`.

Add the following content to the `customScripts` object in the `app/tasklist/scripts/config.js` file:

```
  // …
  customScripts: [
    'scripts/jquery-patch'
  ]
  // …
```

License
-------

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
