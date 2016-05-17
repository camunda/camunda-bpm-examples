# Multi-Tenancy with Tenant Isolation via Database Schemas

This is supplementary code to the tutorial on how to setup multi-tenancy by using one process engine and one database schema per tenant. Find the documentation on [docs.camunda.org](https://docs.camunda.org/manual/examples/tutorials/multi-tenancy/).

## Testing

The test class [ProcessIntegrationTest](src/test/java/org/camunda/bpm/tutorial/multitenancy/ProcessIntegrationTest.java) uses Arquillian to verify the behavior. To run the test, you have to start a JBoss on `localhost:8080`. Use the [Camunda BPM JBoss distribution](https://camunda.org/download/) and replace the `/server/jboss-as-{version}/standalone/configuration/standalone.xml` with [standalone.xml](standalone.xml) (requires manual schema creation) or [standalone_test.xml](standalone_test.xml) (auto schema creation).
