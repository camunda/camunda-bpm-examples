# SimpleApplication Example

This example only uses camunda-bpm-spring-boot-starter, so it does not start an embedded tomcat and provides no rest api.
It demonstrates how camunda can be used in combination with spring boot to spawn a node that:

- connects to a database (and sets it up if needed, in this case h2 in memory db)
- configures and starts a process engine
- deploys the 'sample.bpmn' process
- starts this process
- automatically executes the user task
- JobExecutor executes async service task
- Once the process instance is ended, the spring boot application terminates
