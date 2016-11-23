Jackson Annotation Example for WildFly
==========================================

Since WildFly adds implicit (see [here](https://docs.jboss.org/author/display/WFLY8/Implicit+module+dependencies+for+deployments)) to each new deployment there own jackson dependencies (lower version than spin)
it comes to problems with the usage of variable serialization and the usage of jackson annotations (like `@JsonIgnore` for example).

This example demonstrates how to configure the own application together with WildFly to use jackson annotations
and json serialization.

# Overview

## How to run it

1. Checkout the git repository
2. Build the project with maven
3. Deploy the created war on WildFly
4. Open Cockpit and take a look into the process 'waitingProcess'
5. Look at the variable called `variable`, only the properties `property1` and `property3` are shown.

## How it works

The important part is the `jboss-deployment-structure.xml` with the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jboss-deployment-structure>
    <deployment>
        <exclude-subsystems>
            <!-- exclude jaxrs subsystem, which are added implicit by WildFly -->
            <subsystem name="jaxrs"/>
        </exclude-subsystems>
        <dependencies>
            <!-- Add jackson dependencies with the version which is used by spin. -->
            <module name="com.fasterxml.jackson.core.jackson-annotations" slot="${version}" export="true"/>
            <module name="com.fasterxml.jackson.core.jackson-core" slot="${version}" export="true"/>
            <module name="com.fasterxml.jackson.core.jackson-databind" slot="${version}" export="true"/>
            <!-- Add other modules, which are needed by your application and part of the jaxrs subsystem -->
        </dependencies>
    </deployment>
</jboss-deployment-structure>
```

It excludes the jaxrs subsystem and adds the jackson dependencies with the correct version.
These version corresponds to the version which is used by Camunda Spin for de-/serialization.

See the [Camunda forum post](ttps://forum.camunda.org/t/camunda-json-marshalling-and-jsonignore/271/19?u=zelldon)
and the [documentation](https://docs.camunda.org/manual/7.5/installation/full/jboss/manual/#problems-with-jackson-annotations) for more informations.

