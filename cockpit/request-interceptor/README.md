Request Interceptor for Camunda Cockpit
=================================

This example shows how to intercept requests made by Camunda Cockpit. This might be useful if you need to set additional properties or request headers on all requests made by Cockpit against the rest API.

Built and tested against Camunda BPM version `7.9.0`.


Integrate into Camunda Webapp
-----------------------------

Copy the `requestInterceptor.js` file into the `app/cockpit/scripts/` folder in your Camunda webapp distribution. For the Tomcat distribution, this would be `server/apache-tomcat-X.X.XX/webapps/camunda/app/cockpit/scripts/`.

Add the following content to the `customScripts` object in the `app/cockpit/scripts/config.js` file:

```
  // …
  customScripts: {
    ngDeps: [],

    deps: ['requestInterceptor'],

    // RequreJS path definitions
    paths: {
      'requestInterceptor': 'scripts/requestInterceptor'
    }
  }
  // …
```

License
-------

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
