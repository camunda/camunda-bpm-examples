# Multi-Tenancy with Tenant Isolation via Database Schemas

This is supplementary code to the tutorial on how to setup multi-tenancy by using one process engine and one database schema per tenant. Find the documentation on [docs.camunda.org](https://docs.camunda.org/manual/examples/tutorials/multi-tenancy/).

## Testing

The test class [ProcessIntegrationTest](src/test/java/org/camunda/bpm/tutorial/multitenancy/ProcessIntegrationTest.java) uses Arquillian to verify the behavior. 

Follow the steps to run the test:

* download the [Camunda BPM JBoss distribution](https://camunda.org/download/)
* replace the `camunda-bpm-jboss-{version}/server/jboss-as-{version}/standalone/configuration/standalone.xml` with
  * [standalone.xml](standalone.xml) (two schemas - requires manual schema creation) or 
  * [standalone_test.xml](standalone_test.xml) (two databases - auto schema creation)
* start the server using the script `camunda-bpm-jboss-{version}/start-camunda.bat`
* go to project directory and run the test with the Maven command `mvn test` 

In order to run the test with [Camunda BPM Wildlfy distribution](https://camunda.org/download/), you have to execute the Maven command `mvn test -P wildfly-remote`.