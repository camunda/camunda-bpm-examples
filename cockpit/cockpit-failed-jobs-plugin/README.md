Failed Jobs Plugin for camunda cockpit
=================================

A cockpit plugin which shows a grid list of [Failed Jobs](http://docs.camunda.org/latest/guides/user-guide/#cockpit-failed-jobs) on start page of cockpit and has three columns: `Job ID`, `Process instance ID`, `Exception`.

Basic Concepts:
-----------------------------
**[Jobs](http://docs.camunda.org/latest/guides/user-guide/#process-engine-process-engine-concepts-jobs-and-job-definitions)**, **[Job Definitions](http://docs.camunda.org/latest/guides/user-guide/#process-engine-process-engine-concepts-jobs-and-job-definitions)**, **[Job Executor](http://docs.camunda.org/latest/guides/user-guide/#process-engine-the-job-executor)** and **[Incidents](http://docs.camunda.org/latest/guides/user-guide/#process-engine-incidents)** are all related concepts which are included in camunda process engine.
Jobs are used in the engine for various things such as timers, asynchronous continuations, delayed suspension/activation, etc. and unresolved incidents of a process instance or a sub process instance are indicated by Cockpit as **failed jobs**. ([Ream more ...]((http://docs.camunda.org/latest/guides/user-guide/#cockpit-failed-jobs))

What is the point?
-----------------------------
This plugin basically is to showcase the capabilities of cockpit plugin engine which allows to create dynamic views with fewest lines of code. The other point is to show how Camunda REST API actually works and how handy it is to create a new cockpit plugin using Camunda UI components which are built upon Angular directives.

How to use it?
-----------------------------
Built and tested against camunda BPM version `7.1.0-SNAPSHOT`.


Integrate into camunda webapp
-----------------------------

Add the plugin as a dependency to the cockpit `pom.xml` and rebuild the camunda web application.

    <dependencies>
      ...
      <dependency>
        <groupId>org.camunda.bpm.cockpit.plugin</groupId>
        <artifactId>cockpit-failed-jobs-plugin</artifactId>
        <version>1.0-SNAPSHOT</version>
      </dependency>


Guide
-----

Read the [plugin development how to](http://docs.camunda.org/latest/real-life/how-to/#cockpit-how-to-develop-a-cockpit-plugin).


License
-------

Use under terms of MIT license.