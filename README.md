camunda BPM examples
====================

> Looking for the "invoice" example contained in the distribution?  You can find it here: https://github.com/camunda/camunda-bpm-platform/tree/master/examples/invoice

camunda BPM examples is a collection of focused usage examples for the [camunda BPM platform](https://github.com/camunda/camunda-bpm-platform), intended to get you started quickly:

* [Getting Started with camunda BPM](#getting-started-with-camunda-bpm)
* [BPMN 2.0 & Process Implementation](#bpmn-20--process-implementation-examples)
* [Deployment & Project Setup](#deployment--project-setup-examples)
* [Process Engine Plugin](#process-engine-plugin-examples)
* [Bpmn 2.0 Model API](#bpmn-20-model-api-examples)
* [Cockpit](#cockpit-examples)
* [Tasklist](#tasklist-examples)
* [camunda Modeler (Eclipse)](#camunda-modeler-examples)
* [CMMN](#cmmn-examples)
* [Multi-Tenancy](#multi-tenancy-examples)

### Getting Started with camunda BPM

| Name                                                                                                   | Container          |
| -------------------------------------------------------------------------------------------------------|--------------------|
| [Simple Process Applications](http://docs.camunda.org/latest/guides/getting-started-guides/developing-process-applications/)     | All                |
| [camunda BPM and the Spring Framework](http://docs.camunda.org/latest/guides/getting-started-guides/spring-framework/)           | Tomcat             |
| [Process Applications with JavaEE 6](http://docs.camunda.org/latest/guides/getting-started-guides/java-ee/)                      | JavaEE Containers  |

### BPMN 2.0 & Process Implementation Examples

| Name                                                                       | Container            | Keywords                  | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Service Task REST HTTP](/servicetask/rest-service)                        | Unit Test            | Rest Scripting, classless | 7.2+    |
| [Service Task SOAP HTTP](/servicetask/soap-service)                        | Unit Test            | Soap Scripting, classless | 7.2+    |
| [Service Invocation Synchronous](/servicetask/service-invocation-synchronous)     | Unit Test     | Java Delegate, Sync       | 7.0+    |
| [Service Invocation Asynchronous](/servicetask/service-invocation-asynchronous)   | Unit Test     | Signal, Async             | 7.0+    |
| [User Task Assignment Email](/usertask/task-assignment-email) *            | All                  | Email, Usertask           | 7.0+    |
| [User Task Form Embedded](/usertask/task-form-embedded) *                  | All                  | Html, Form, Usertask      | 7.1+    |
| [User Task Form Embedded - Serialized Java Object](/usertask/task-form-embedded-serialized-java-object) *                  | All                  | Html, Form, Usertask      | 7.2+    |
| [User Task Form Generated](/usertask/task-form-generated) *                | All                  | Html, Form, Usertask      | 7.1+    |
| [User Task Form JSF](/usertask/task-form-external-jsf) *                   | JavaEE Containers    | JSF, Form, Usertask       | 7.1+    |
| [Script Task XSLT](/scripttask/xslt-scripttask)                            | Unit Test            | XSLT Scripttask           | 7.2+, EE only    |
| [Start Event - Message](/startevent/message-start)                         | Unit Test            | Message Start Event       | 7.0+    |

(\*) _complete demo applications_.

### Deployment & Project Setup Examples

| Name                                                                       | Container            |  Keywords                 | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Process Application - Servlet](deployment/servlet-pa)                     | All                  | War, Servlet              | 7.1+    |
| [Process Application - EJB](deployment/ejb-pa)                             | JavaEE Containers    | Ejb, War                  | 7.0+    |
| [Process Application - Spring Servlet](deployment/spring-servlet-pa-jboss) | JBoss AS 7           | Spring, Servlet, War      | 7.0+    |
| [Embedded Spring with embedded REST](deployment/embedded-spring-rest)      | vanilla Apache Tomcat | Spring, Rest, Embedded   | 7.0+    |
| [Plain Spring Webapplication JBoss AS 7](deployment/spring-jboss-non-pa)   | JBoss AS 7           | Spring, Jndi, War         | 7.0+    |


### Process Engine Plugin Examples

| Name                                                                       | Container            |  Keywords                                   | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------------------------|---------|
| [BPMN Parse Listener](process-engine-plugin/bpmn-parse-listener)           | Unit Test            | Process Engine Plugin, Bpmn Parse Listener  | 7.0+    |
| [Custom History Level](process-engine-plugin/custom-history-level)         | Unit Test            | Process Engine Plugin, Custom History Level | 7.2+    |
| [Command Interceptor - Blocking](process-engine-plugin/command-interceptor-blocking) | Unit Test  | Maintenance, Interceptor, Configuration     | 7.0+    |

### Bpmn 2.0 Model API Examples

| Name                                                                       | Container            | Keywords                  | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Generate BPMN process](/bpmn-model-api/generate-process-fluent-api)       | Unit Test            | Fluent API                | 7.1+    |
| [Generate JSF forms](/bpmn-model-api/generate-jsf-form)                    | JavaEE Containers    | JSF, Usertask             | 7.1+    |
| [Parse BPMN model](/bpmn-model-api/parse-bpmn)                             | Unit Test            | BPMN                      | 7.1+    |

### Cockpit Examples

| Name                                                                       | Keywords                  | Version |
| ---------------------------------------------------------------------------|---------------------------|---------|
| [Cockpit Sample Plugin](/cockpit/cockpit-sample-plugin)                    | Plugin                    | 7.0+    |
| [Failed Jobs Plugin](/cockpit/cockpit-failed-jobs-plugin)                  | Plugin                    | 7.0+    |

### Tasklist Examples

| Name                                                                       | Keywords                  | Version |
| ---------------------------------------------------------------------------|---------------------------|---------|
| [Create Standalone Task - client side](https://github.com/camunda/camunda-bpm-webapp/tree/master/webapp/src/main/resources-plugin/standaloneTask/app)                    | Plugin                    | 7.3+    |
| [Create Standalone Task - server side](https://github.com/camunda/camunda-bpm-webapp/tree/master/webapp/src/main/java/org/camunda/bpm/tasklist/impl/plugin/standalonetask)                  | Plugin                    | 7.3+    |

### SDK-JS Examples

| Name                                                      | Environment | Keywords                    | Version |
|-----------------------------------------------------------|-------------|-----------------------------|---------|
| [SDK JS forms](/sdk-js/browser-forms) *                   | Browser     | HTML, task, form, SDK       | 7.2+    |
| [SDK JS forms AngularJS](/sdk-js/browser-forms-angular) * | Browser     | HTML, task, form, AngularJS | 7.2+    |
| [SDK JS node.js](/sdk-js/nodejs) *                        | node.js     | CLI, deployment | 7.3+    |

### camunda Modeler Examples

| Name                                                                       | Keywords                  | Version |
| ---------------------------------------------------------------------------|---------------------------|---------|
| [Custom Task Simple](/modeler/custom-task-simple)                          | Plugin, Eclipse           | 2.3+    |
| [Custom Task Advanced](/modeler/custom-task-advanced)                      | Plugin, Eclipse           | 2.3+    |

### CMMN Examples

| Name                                                                       |
| ---------------------------------------------------------------------------|
| [Case Manager UI](https://github.com/camunda/camunda-casemanager-ui) (External) |

### Cycle Examples

| Name                                                                       | Version |
| ---------------------------------------------------------------------------|---------|
| [Connector Example](cycle/camunda-cycle-connector-example)                 | 3.1+    |

### Multi-Tenancy Examples

| Name                                                                             | Container | Keywords      | Version |
| ---------------------------------------------------------------------------------|-----------|---------------|---------|
| [Multi-Tenancy with Database Schema Isolation](multi-tenancy/schema-isolation)   | JBoss AS 7| Multi-Tenancy | 7.2+    |

### Spin Examples

| Name                                                                                       | Container | Keywords                | Version |
| -------------------------------------------------------------------------------------------|-----------|-------------------------|---------|
| [Data Format Configuration to Customize JSON serialization](spin/dataformat-configuration) | Unit Test | Spin, Process Variables | 7.2+    |


### Contribute!

  * Website: http://www.camunda.org/
  * Getting Started: http://docs.camunda.org/latest/guides/getting-started-guides/
  * Issue Tracker: https://app.camunda.com/jira
  * Contribution Guidelines: http://www.camunda.org/community/contribute.html
  * License: Apache License, Version 2.0  http://www.apache.org/licenses/LICENSE-2.0
