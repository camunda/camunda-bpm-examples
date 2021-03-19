Camunda Platform examples
====================

> Looking for the "invoice" example contained in the distribution?  You can find it here: https://github.com/camunda/camunda-bpm-platform/tree/master/examples/invoice

Camunda Platform examples is a collection of focused usage examples for the [Camunda Platform](https://github.com/camunda/camunda-bpm-platform), intended to get you started quickly. The sources on the master branch work with the current Camunda release. Follow the links below to browse the examples for the Camunda version you use:

| Camunda Version  | Link                                                                 | Checkout command      |
| -----------------|----------------------------------------------------------------------|-----------------------|
| Latest           | [Master branch](https://github.com/camunda/camunda-bpm-examples)     | `git checkout master` |
| 7.14             | [7.14 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.14)| `git checkout 7.14`   |
| 7.13             | [7.13 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.13)| `git checkout 7.13`   |
| 7.12             | [7.12 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.12)| `git checkout 7.12`   |
| 7.11             | [7.11 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.11)| `git checkout 7.11`   |
| 7.10             | [7.10 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.10)| `git checkout 7.10`   |
| 7.9              | [7.9 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.9)  | `git checkout 7.9`    |
| 7.8              | [7.8 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.8)  | `git checkout 7.8`    |
| 7.7              | [7.7 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.7)  | `git checkout 7.7`    |
| 7.6              | [7.6 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.6)  | `git checkout 7.6`    |
| 7.5              | [7.5 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.5)  | `git checkout 7.5`    |
| 7.4              | [7.4 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.4)  | `git checkout 7.4`    |
| 7.3              | [7.3 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.3)  | `git checkout 7.3`    |
| 7.2              | [7.2 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.2)  | `git checkout 7.2`    |
| 7.1              | [7.1 tag](https://github.com/camunda/camunda-bpm-examples/tree/7.1)  | `git checkout 7.1`    |

If you clone this repository, use the checkout commands to access the sources for the desired version.

## Overview

* [Getting Started with Camunda Platform](#getting-started-with-camunda-bpm)
* [BPMN 2.0 & Process Implementation](#bpmn-20--process-implementation-examples)
* [Deployment & Project Setup](#deployment--project-setup-examples)
* [Process Engine Plugin](#process-engine-plugin-examples)
* [Bpmn 2.0 Model API](#bpmn-20-model-api-examples)
* [Cmmn 1.1 Model API Examples](#cmmn-11-model-api-examples)
* [Cockpit](#cockpit-examples)
* [Tasklist](#tasklist-examples)
* [camunda Modeler (Eclipse)](#camunda-modeler-eclipse-plugin-examples)
* [Multi-Tenancy](#multi-tenancy-examples)
* [Spin](#spin-examples)
* [DMN](#dmn-examples)
* [Process Instance Migration](#process-instance-migration-examples)
* [SDK-JS Examples](#sdk-js-examples)
* [Authentication](#authentication)
* [Spring Boot Starter examples](#spring-boot-starter-examples)
* [External Task Client](#external-task-client)
* [External Task Client Spring](#external-task-client-spring)
* [External Task Client Spring Boot](#external-task-client-spring-boot)

### Getting Started with Camunda Platform

| Name                                                                                                   | Container          |
| -------------------------------------------------------------------------------------------------------|--------------------|
| [Simple Process Applications](https://docs.camunda.org/get-started/bpmn20/)                            | All                |
| [Camunda Platform and the Spring Framework](https://docs.camunda.org/get-started/spring/)              | Tomcat             |
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
| [User Task Form Embedded - Serialized Java Object](/usertask/task-form-embedded-serialized-java-object) * | All    | Html, Form, Usertask      |
| [User Task Form Embedded - JSON](/usertask/task-form-embedded-json) *      | All                  | Html, Form, Usertask      |
| [User Task Form Embedded - Bpmn Elements](/usertask/task-form-embedded-bpmn-events) *  | All      | Html, Form, Usertask      |
| [User Task Form Embedded - React](/usertask/task-form-embedded-react) *    | All                  | Html, Form, Usertask      |
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
| [Process Application - Spring Servlet - WildFly](deployment/spring-servlet-pa-wildfly)        | WildFly               | Spring, Servlet, War      |
| [Process Application - Spring Servlet - Embedded Tomcat](deployment/spring-servlet-pa-tomcat) | Tomcat                | Spring, Servlet, War      |
| [Embedded Spring with embedded REST](deployment/embedded-spring-rest)                         | vanilla Apache Tomcat | Spring, Rest, Embedded    |
| [Plain Spring Web application - WildFly](deployment/spring-wildfly-non-pa)                    | WildFly               | Spring, Jndi, War         |
| [Process Application - Spring Boot](deployment/spring-boot)                                   | Spring Boot           | Spring                    |

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

| Name                                                                                                            | Keywords                                  |
| ----------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| [Fullstack (ReactJS 16.x & Java) "Count Processes" Cockpit Plugin](/cockpit/cockpit-fullstack-count-processes)  | Plugin, Custom Script, Fullstack, ReactJS |
| [Angular 10 "Open Usertasks" Cockpit Tab](/cockpit/cockpit-angular-open-usertasks)                              | Plugin, Custom Script, Angular            |
| [AngularJS 1.x "Search Processes" Cockpit Plugin](/cockpit/cockpit-angularjs-search-processes)                  | Plugin, Custom Script, AngularJS          |
| [ReactJS 16.x "Involved Users" Cockpit Plugin](/cockpit/cockpit-react-involved-users)                           | Plugin, Custom Script, ReactJS            |
| ["Cats" Cockpit Plugin](/cockpit/cockpit-cats)                                                                  | Plugin, Custom Script                     |
| ["Diagram interactions" Cockpit Plugin](/cockpit/cockpit-diagram-interactions)                                  | Plugin, Custom Script                     |
| ["Open Incidents" Cockpit Plugin](/cockpit/cockpit-open-incidents)                                              | Plugin, Custom Script                     |
| ["Request Interceptor" Cockpit Script](/cockpit/cockpit-request-interceptor)                                    | Plugin, Custom Script                     |
| [bpmn.js Cockpit module](/cockpit/cockpit-bpmn-js-module)                                                       | Plugin, Custom Script, bpmn-js            |

### Tasklist Examples

| Name                                                                       | Keywords                  |
| ---------------------------------------------------------------------------|---------------------------|
| [Create Standalone Task - client side](https://github.com/camunda/camunda-bpm-platform/tree/master/webapps/ui/tasklist/plugins/standaloneTask/app)| Plugin                    |
| [Create Standalone Task - server side](https://github.com/camunda/camunda-bpm-platform/blob/master/webapps/src/main/java/org/camunda/bpm/tasklist/impl/plugin)| Plugin                    |
| [Javascript Only Plugin](/tasklist/cats-plugin)                             | Plugin, Custom Script     |
| [JQuery 3.4 Behavior Patch](/tasklist/jquery-34-behavior)                   | Plugin, Custom Script     |

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

### Cycle Examples

| Name                                                                       | Version |
| ---------------------------------------------------------------------------|---------|
| [Connector Example](cycle/camunda-cycle-connector-example)                 | 3.1+    |

### Multi-Tenancy Examples

| Name                                                                             | Container | Keywords      |
| ---------------------------------------------------------------------------------|-----------|---------------|
| [Multi-Tenancy with Database Schema Isolation](multi-tenancy/schema-isolation)   | Wildfly | Multi-Tenancy |
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
 | [REST API](spring-boot-starter/example-web)                | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, REST API |
 | [Autodeployment](spring-boot-starter/example-autodeployment) | Spring boot with embedded engine and Webapps                             |  Spring Boot Starter           |
 | [Twitter](spring-boot-starter/example-twitter)             | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, Webapps, Twitter  |
 | [REST API DMN](spring-boot-starter/example-dmn-rest)       | Spring boot with embedded engine and Webapps                               |  Spring Boot Starter, REST API |
 | [Camunda Invoice Example](spring-boot-starter/example-invoice) | Spring boot with embedded engine, Webapps and Rest API                 |  Spring Boot Starter, REST API |

### External Task Client

| Name                                                                                                                         | Environment                         | Keywords                          |
|------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|-----------------------------------|
| [Loan Granting - Java](./clients/java/loan-granting)                                                                         | Java External Task Client           | External Task Client, Servicetask |
| [Order Handling - Java](./clients/java/order-handling)                                                                       | Java External Task Client           | External Task Client, Servicetask |
| [Dataformat - Java](./clients/java/dataformat)                                                                               | Java External Task Client           | External Task Client, Servicetask |
| [Loan Granting - JavaScript](https://github.com/camunda/camunda-external-task-client-js/tree/master/examples/granting-loans) | JavaScript External Task Client     | External Task Client, Servicetask |
| [Order Handling - JavaScript](https://github.com/camunda/camunda-external-task-client-js/tree/master/examples/order)         | JavaScript External Task Client     | External Task Client, Servicetask |

 
### External Task Client Spring

| Name                                                                                     | Keywords                          |
|------------------------------------------------------------------------------------------|-----------------------------------|
| [Loan Granting Example](./spring-boot-starter/external-task-client/loan-granting-spring) | External Task Client, Servicetask |

### External Task Client Spring Boot

| Name                                                                                                                      | Container                                           | Keywords                                               |
|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|--------------------------------------------------------|
| [Order Handling Example](./spring-boot-starter/external-task-client/order-handling-spring-boot)                           | Spring Boot with embedded Client                    | External Task Client, Servicetask, Spring Boot Starter |
| [Loan Granting w/ REST API & Webapp Example](./spring-boot-starter/external-task-client/loan-granting-spring-boot-webapp) | Spring Boot with embedded Client, REST API & Webapp | External Task Client, Servicetask, Spring Boot Starter |
| [Request Interceptor Example](./spring-boot-starter/external-task-client/request-interceptor-spring-boot)                 | Spring Boot with embedded Client                    | External Task Client, Servicetask, Spring Boot Starter |

### Container Specifics

| Name                                                                                          | Container             |  Keywords                 |
| ----------------------------------------------------------------------------------------------|-----------------------|---------------------------|
| [Jackson Annotation Example for WildFly](wildfly/jackson-annotations)                         | Wildfly               | War, Servlet              |


## Contributing

Have a look at our [contribution guide](https://github.com/camunda/camunda-bpm-platform/blob/master/CONTRIBUTING.md) for how to contribute to this repository.

## License
The source files in this repository are made available under the [Apache License Version 2.0](./LICENSE).
