Camunda BPM examples
====================

> Looking for the "invoice" example contained in the distribution?  You can find it here: https://github.com/camunda/camunda-bpm-platform/tree/master/examples/invoice

Camunda BPM examples is a collection of focused usage examples for the [camunda BPM platform](https://github.com/camunda/camunda-bpm-platform), intended to get you started quickly. The sources on the master branch work with the current Camunda release. Follow the links below to browse the examples for the Camunda version you use:

| Camunda Version  | Link                                                                | Checkout command      |
| -----------------|---------------------------------------------------------------------|-----------------------|
| Latest           | [Master branch](https://github.com/camunda/camunda-bpm-examples)    | `git checkout master` |
| 7.9              | [7.9 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.9) | `git checkout 7.9`    |
| 7.8              | [7.8 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.8) | `git checkout 7.8`    |
| 7.7              | [7.7 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.7) | `git checkout 7.7`    |
| 7.6              | [7.6 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.6) | `git checkout 7.6`    |
| 7.5              | [7.5 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.5) | `git checkout 7.5`    |
| 7.4              | [7.4 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.4) | `git checkout 7.4`    |
| 7.3              | [7.3 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.3) | `git checkout 7.3`    |
| 7.2              | [7.2 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.2) | `git checkout 7.2`    |
| 7.1              | [7.1 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.1) | `git checkout 7.1`    |

If you clone this repository, use the checkout commands to access the sources for the desired version.

## Overview

* [Getting Started with camunda BPM](#getting-started-with-camunda-bpm)
* [BPMN 2.0 & Process Implementation](#bpmn-20--process-implementation-examples)
* [Deployment & Project Setup](#deployment--project-setup-examples)
* [Process Engine Plugin](#process-engine-plugin-examples)
* [Bpmn 2.0 Model API](#bpmn-20-model-api-examples)
* [Cmmn 1.1 Model API Examples](#cmmn-11-model-api-examples)
* [Cockpit](#cockpit-examples)
* [Tasklist](#tasklist-examples)
* [camunda Modeler (Eclipse)](#camunda-modeler-eclipse-plugin-examples)
* [CMMN](#cmmn-examples)
* [Multi-Tenancy](#multi-tenancy-examples)
* [Spin](#spin-examples)
* [DMN](#dmn-examples)
* [Process Instance Migration](#process-instance-migration-examples)
* [SDK-JS Examples](#sdk-js-examples)
* [Authentication](#authentication)
* [Spring Boot Starter examples](#spring-boot-starter-examples)

### Getting Started with camunda BPM

| Name                                                                                                   | Container          |
| -------------------------------------------------------------------------------------------------------|--------------------|
| [Simple Process Applications](https://docs.camunda.org/get-started/bpmn20/)                            | All                |
| [camunda BPM and the Spring Framework](https://docs.camunda.org/get-started/spring/)                   | Tomcat             |
| [Process Applications with JavaEE 6](https://docs.camunda.org/get-started/javaee6/)                    | JavaEE Containers  |

### BPMN 2.0 & Process Implementation Examples

| Name                                                                       | Container            | Keywords                  |
| ---------------------------------------------------------------------------|----------------------|---------------------------|
| [Service Task REST HTTP](/servicetask/rest-service)                        | Unit Test            | Rest Scripting, classless |
| [Service Task SOAP HTTP](/servicetask/soap-service)                        | Unit Test            | SOAP Scripting, classless |
| [Service Task SOAP CXF HTTP](/servicetask/soap-cxf-service)                | Unit Test            | SOAP, CXF, Spring, Spin   |
| [Service Invocation Synchronous](/servicetask/service-invocation-synchronous)     | Unit Test     | Java Delegate, Sync       |
| [Service Invocation Asynchronous](/servicetask/service-invocation-asynchronous)   | Unit Test     | Signal, Async             |
| [User Task Assignment Email](/usertask/task-assignment-email) *            | All                  | Email, Usertask           |
| [User Task Form Embedded](/usertask/task-form-embedded) *                  | All                  | Html, Form, Usertask      |
| [User Task Form Embedded - Serialized Java Object](/usertask/task-form-embedded-serialized-java-object) *                  | All                  | Html, Form, Usertask      |
| [User Task Form Embedded - JSON](/usertask/task-form-embedded-json) *      | All                  | Html, Form, Usertask      |
| [User Task Form Generated](/usertask/task-form-generated) *                | All                  | Html, Form, Usertask      |
| [User Task Form JSF](/usertask/task-form-external-jsf) *                   | JavaEE Containers    | JSF, Form, Usertask       |
| [Script Task XSLT](/scripttask/xslt-scripttask)                            | Unit Test            | XSLT Scripttask           |
| [Script Task XQuery](/scripttask/xquery-scripttask)                        | Unit Test            | XQuery Scripttask         |
| [Start Event - Message](/startevent/message-start)                         | Unit Test            | Message Start Event       |
| [Start Process - SOAP CXF](/startevent/soap-cxf-server-start)              | War                  | SOAP, CXF, Spring         |

(\*) _complete demo applications_.

### Deployment & Project Setup Examples

| Name                                                                                          | Container             |  Keywords                 |
| ----------------------------------------------------------------------------------------------|-----------------------|---------------------------|
| [Process Application - Servlet](deployment/servlet-pa)                                        | All                   | War, Servlet              |
| [Process Application - EJB](deployment/ejb-pa)                                                | JavaEE Containers     | Ejb, War                  |
| [Process Application - Spring Servlet - JBoss](deployment/spring-servlet-pa-jboss)            | JBoss AS 7            | Spring, Servlet, War      |
| [Process Application - Spring Servlet - Embedded Tomcat](deployment/spring-servlet-pa-tomcat) | Tomcat                | Spring, Servlet, War      |
| [Embedded Spring with embedded REST](deployment/embedded-spring-rest)                         | vanilla Apache Tomcat | Spring, Rest, Embedded    |
| [Plain Spring Webapplication JBoss AS 7](deployment/spring-jboss-non-pa)                      | JBoss AS 7            | Spring, Jndi, War         |
| [Process Application - Spring Boot](deployment/spring-boot)                                   | Spring Boot           | Spring                    |

Hint: Any example using the JBoss 7 Camunda BPM distribution **must** use JDK 6/7 to run/compile the project. Otherwise the JBoss 7 will not start, just hang. This is a JBoss 7.2 issue and does not affect JBoss Wildfly.


### Process Engine Plugin Examples

| Name                                                                                        | Container            |  Keywords                                   |
| --------------------------------------------------------------------------------------------|----------------------|---------------------------------------------|
| [BPMN Parse Listener](process-engine-plugin/bpmn-parse-listener)                            | Unit Test            | Process Engine Plugin, Bpmn Parse Listener  |
| [BPMN Parse Listener on User Task](process-engine-plugin/bpmn-parse-listener-on-user-task)  | Unit Test            | Process Engine Plugin, Bpmn Parse Listener  |
| [Custom History Level](process-engine-plugin/custom-history-level)                          | Unit Test            | Process Engine Plugin, Custom History Level |
| [Command Interceptor - Blocking](process-engine-plugin/command-interceptor-blocking)        | Unit Test            | Maintenance, Interceptor, Configuration     |
| [Failed Job Retry Profile](process-engine-plugin/failed-job-retry-profile)                  | Unit Test            | Process Engine Plugin, Failed Job Retry     |

### Bpmn 2.0 Model API Examples

| Name                                                                       | Container            | Keywords                  |
| ---------------------------------------------------------------------------|----------------------|---------------------------|
| [Generate BPMN process](/bpmn-model-api/generate-process-fluent-api)       | Unit Test            | Fluent API                |
| [Generate JSF forms](/bpmn-model-api/generate-jsf-form)                    | JavaEE Containers    | JSF, Usertask             |
| [Parse BPMN model](/bpmn-model-api/parse-bpmn)                             | Unit Test            | BPMN                      |

### Cmmn 1.1 Model API Examples

| Name                                                                                              | Container            | Keywords                  |
| --------------------------------------------------------------------------------------------------|----------------------|---------------------------|
| [Strongly-typed Access to Custom Extension Elements](/cmmn-model-api/typed-custom-elements)       | Unit Test            | CMMN, TransformListener   |

### Cockpit Examples

| Name                                                                       | Keywords                  |
| ---------------------------------------------------------------------------|---------------------------|
| [Cockpit Sample Plugin](/cockpit/cockpit-sample-plugin)                    | Plugin                    |
| [Failed Jobs Plugin](/cockpit/cockpit-failed-jobs-plugin)                  | Plugin                    |
| [Javascript Only Plugin](/cockpit/js-only-plugin)                          | Plugin, Custom Script     |
| [Request Interceptor](/cockpit/request-interceptor)                        | Custom Script             |

### Tasklist Examples

| Name                                                                       | Keywords                  |
| ---------------------------------------------------------------------------|---------------------------|
| [Create Standalone Task - client side](https://github.com/camunda/camunda-bpm-webapp/tree/master/ui/tasklist/plugins/standaloneTask/app)| Plugin                    |
| [Create Standalone Task - server side](https://github.com/camunda/camunda-bpm-webapp/blob/master/src/main/java/org/camunda/bpm/tasklist/impl/plugin)| Plugin                    |

### SDK-JS Examples

| Name                                                      | Environment | Keywords                    |
|-----------------------------------------------------------|-------------|-----------------------------|
| [SDK JS forms](/sdk-js/browser-forms) *                   | Browser     | HTML, task, form, SDK       |
| [SDK JS forms AngularJS](/sdk-js/browser-forms-angular) * | Browser     | HTML, task, form, AngularJS |
| [SDK JS node.js](/sdk-js/nodejs) *                        | node.js     | CLI, deployment             |

### Camunda Modeler Eclipse Plugin Examples

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

| Name                                                                             | Container | Keywords      |
| ---------------------------------------------------------------------------------|-----------|---------------|
| [Multi-Tenancy with Database Schema Isolation](multi-tenancy/schema-isolation)   | JBoss AS 7 | Multi-Tenancy |
| [Multi-Tenancy with Tenant Identifiers for Embedded Process Engine](multi-tenancy/tenant-identifier-embedded) | Unit Test | Multi-Tenancy |
| [Multi-Tenancy with Tenant Identifiers for Shared Process Engine](multi-tenancy/tenant-identifier-shared) | All | Multi-Tenancy |
| [Multi-Tenancy with Tenant Identifiers and Shared Process Definitions](multi-tenancy/tenant-identifier-shared-definitions) | Unit Test | Multi-Tenancy |

### Spin Examples

| Name                                                                                       | Container                                  | Keywords                |
| -------------------------------------------------------------------------------------------|--------------------------------------------|-------------------------|
| [Global Data Format Configuration to Customize JSON serialization](spin/dataformat-configuration-global) | Unit Test  | Spin, Configuration |
| [Process-Application-Specific Data Format Configuration to Customize JSON serialization](spin/dataformat-configuration-in-process-application) | Application Server | Spin, Configuration, Shared Engine |

### DMN Examples

| Name                                                                                       | Container | Keywords                |
| -------------------------------------------------------------------------------------------|-----------|-------------------------|
| [Embed Decision Engine - Dish Decision Maker](dmn-engine/dmn-engine-java-main-method)      | Jar       | DMN, Embed              |
| [Decision Requirements Graph(DRG) Example](dmn-engine/dmn-engine-drg)                      | Jar       | DMN, DRG, Embed         |

### Process Instance Migration Examples

| Name                                                                                         | Container                             | Keywords                |
| ---------------------------------------------------------------------------------------------|---------------------------------------|-------------------------|
| [Migration on Deployment of New Process Version](migration/migrate-on-deployment)            | Application Server with Shared Engine | BPMN, Migration         |

### Authentication

| Name                                                    | Container                                                                  | Keywords                |
| --------------------------------------------------------|----------------------------------------------------------------------------|-------------------------|
| [Basic Authentication](authentication/basic)            | Spring boot with embedded engine, REST API and Basic Authentication filter |  Authentication         |

### Spring Boot Starter examples
 
 | Name                                                       | Container                                                                  | Keywords                |
 | --------------------------------------------------------   |----------------------------------------------------------------------------|-------------------------|
 | [Plain Camunda Engine](spring-boot-starter/example-simple) | Jar                                                                        |  Spring Boot Starter           |
 | [Webapps](spring-boot-starter/example-webapp)              | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, Webapps  |
 | [Webapps EE](spring-boot-starter/example-webapp-ee)        | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, Webapps  |
 | [War](spring-boot-starter/example-war)                     | War                                                                        |  Spring Boot Starter, Webapps  |
 | [REST API](spring-boot-starter/example-web)                | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, REST API |
 | [Autodeployment](spring-boot-starter/example-autodeployment) | Spring boot with embedded engine and Webapps                             |  Spring Boot Starter           |
 | [Twitter](spring-boot-starter/example-twitter)             | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, Webapps, Twitter  |


### Contribute!

  * Website: http://www.camunda.org/
  * Getting Started: https://docs.camunda.org/get-started/
  * Issue Tracker: https://app.camunda.com/jira
  * Contribution Guidelines: http://www.camunda.org/community/contribute.html
  * License: Apache License, Version 2.0  http://www.apache.org/licenses/LICENSE-2.0
