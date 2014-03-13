Cockpit Failed Jobs Plugin
=================================

A cockpit plugin which shows a grid list of [Failed Jobs](http://docs.camunda.org/latest/guides/user-guide/#cockpit-failed-jobs) on start page of cockpit and has three columns: `Job ID`, `Process instance ID`, `Exception`.

Built and tested against camunda BPM version `7.0.0-Final`.

Related Concepts:
-----------------------------
This plugin is centered around [Failed Jobs](http://docs.camunda.org/latest/guides/user-guide/#cockpit-failed-jobs) concept and these are the other related concepts which could help us to understand it:

* **[Jobs](http://docs.camunda.org/latest/guides/user-guide/#process-engine-process-engine-concepts-jobs-and-job-definitions)** are explicit representations of a task to trigger process execution. A job is created whenever a wait state is reached during process execution that has to be triggered internally. This is the case when a timer event or a task marked for asynchronous execution (see transaction boundaries) is approached.
* **[Job Definitions](http://docs.camunda.org/latest/guides/user-guide/#process-engine-process-engine-concepts-jobs-and-job-definitions)**: When a process is deployed, the process engine creates a Job Definition for each activity in the process which will create jobs at runtime.
* **[The Job Executor](http://docs.camunda.org/latest/guides/user-guide/#process-engine-the-job-executor)** has two responsibilities: job acquisition and job execution.
* **[Incidents](http://docs.camunda.org/latest/guides/user-guide/#process-engine-incidents)**: Examples of such incidents may be a failed job with elapsed retries (retries = 0), indicating that an execution is stuck and manual administrative action is necessary for repairing the process instance.
* **[Failed Jobs](http://docs.camunda.org/latest/guides/user-guide/#cockpit-failed-jobs)**: Unresolved incidents of a process instance or a sub process instance are indicated by Cockpit as failed jobs.


What's the point?
-----------------------------
This plugin basically is to showcase the capabilities of cockpit plugin engine which allows to create dynamic views with fewest lines of code. The other point is to show how Camunda REST API actually works and how handy it is to create a new cockpit plugin using Camunda UI components which are built upon Angular directives.

How to register a Cockpit plugin?
-----------------------------
Each Cockpit plugin has an Angular Controller, a unique pseudo-URL like: `plugin://failed-jobs-plugin/static/app/dashboard.html` and some other attributes, which are used to register the plugin in a view, by a JavaScript Object called `ViewsProvider` and its `registerDefaultView` function, in the module Configuration.

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


License
-------
Use under terms of MIT license.
