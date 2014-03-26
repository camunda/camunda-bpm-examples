camunda BPM examples
====================

camunda BPM examples is a collection of focused usage examples for [camunda BPM platform](https://github.com/camunda/camunda-bpm-platform), intended to get you started quickly:

* <a href="#bpmn-20--process-implementation-examples">BPMN 2.0 & Process Implementation</a>
* <a href="#deployment--project-setup-examples">Deployment & Project Setup</a>
* <a href="#process-engine-plugin-examples">Process Engine Plugin</a>
* <a href="#bpmn-20-model-api-examples">Bpmn 2.0 Model API</a>
* <a href="#cockpit-examples">Cockpit</a>
* <a href="#camunda-modeler-examples">camunda Modeler (Eclipse)</a>

### BPMN 2.0 & Process Implementation Examples

| Name                                                                       | Container            | Keywords                  | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Service Invocation Synchronous](/servicetask/service-invocation-synchronous)     | Unit Test            | Java Delegate, Sync       | 7.0+    |
| [Service Invocation Asynchronous](/servicetask/service-invocation-asynchronous)   | Unit Test            | Signal, Async             | 7.0+    |
| [User Task Assignment Email](/usertask/task-assignment-email) *                 | All                  | Email, Usertask           | 7.0+    |
| [User Task Form Embedded](/usertask/task-form-embedded) *                       | All                  | Html, Form, Usertask      | 7.1+    |
| [User Task Form Generated](/usertask/task-form-generated) *                     | All                  | Html, Form, Usertask      | 7.1+    |
| [User Task Form JSF](/usertask/task-form-external-jsf) *                        | JavaEE Containers    | JSF, Form, Usertask       | 7.1+    |

(*) _complete demo applications_.

### Deployment & Project Setup Examples

| Name                                                                       | Container            |  Keywords                 | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Process Application - Servlet](deployment/servlet-pa)                     | All                  | War, Servlet              | 7.1+    |
| [Process Application - Ejb](deployment/ejb-pa)                             | JavaEE Containers    | Ejb, War                  | 7.0+    |
| [Process Application - Spring Servlet](deployment/spring-servlet-pa)       | All                  | Spring, Servlet, War      | 7.0+    |
| [Embedded Spring with embedded REST](deployment/embedded-spring-rest)      | vanilla Apache Tomcat | Spring, Rest, Embedded    | 7.0+    |
| [Plain Spring Webapplication JBoss AS 7](deployment/spring-jboss-non-pa)   | JBoss AS 7           | Spring, Jndi, War         | 7.0+    |


### Process Engine Plugin Examples

| Name                                                                       | Container            |  Keywords                 | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [BPMN Parse Listener](process-engine-plugin/bpmn-parse-listener)           | Unit Test            | Process Engine Plugin, Bpmn Parse Listener | 7.0+    |

### Bpmn 2.0 Model API Examples

| Name                                                                       | Container            | Keywords                  | Version |
| ---------------------------------------------------------------------------|----------------------|---------------------------|---------|
| [Generate BPMN process](/bpmn-model-api/generate-process-fluent-api)          | All                  | Fluent API                | 7.1+    |
| [Generate JSF forms](/bpmn-model-api/generate-jsf-form)                     | JavaEE Containers    | JSF, Usertask             | 7.1+    |

### Cockpit Examples

| Name                                                                       | Keywords                  | Version |
| ---------------------------------------------------------------------------|---------------------------|---------|
| [Cockpit Sample Plugin](/cockpit/cockpit-sample-plugin)                    | Plugin 					 | 7.0+    |
| [Failed Jobs Plugin](/cockpit/cockpit-failed-jobs-plugin)                  | Plugin 					 | 7.0+    |

### camunda Modeler Examples

| Name                                                                       | Keywords                  | Version |
| ---------------------------------------------------------------------------|---------------------------|---------|
| [Custom Task Simple](/modeler/custom-task-simple)                          | Plugin, Eclipse			 | 2.3+    |
| [Custom Task Advanced](/modeler/custom-task-advanced)                      | Plugin, Eclipse			 | 2.3+    |


### Contribute!

  * Web Site: http://www.camunda.org/
  * Getting Started: http://www.camunda.org/implement-getting-started.html
  * Issue Tracker: https://app.camunda.com/jira
  * Contribution Guildelines: http://www.camunda.org/community/contribute.html
  * License: Apache License, Version 2.0  http://www.apache.org/licenses/LICENSE-2.0
