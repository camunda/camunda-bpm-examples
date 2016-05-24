# Multi-Tenancy with Tenant Identifiers for Embedded Process Engine

This example demonstrates how to use multi-tenancy for an embedded process engine. You learn

* How to deploy a process definition with a tenant-id,
* How to start a process instance from a process definition with a tenant-id,
* How to implement a service task which uses the tenant-id from the process instance

The example process for the tenants looks like:

![Example Process for Tenant](docs/process.png)

## How it works

Please refer to the [User Guide](http://docs.camunda.org/manual/develop/user-guide/process-engine/multi-tenancy/) for details about multi-tenancy.

### Deploy a Process Definition with Tenant-Id

Using the `RepositoryService` to create a deployment for a specific tenant.

``` java
// deploy process definition for 'tenant1'
repositoryService
  .createDeployment()
  .tenantId("tenant1")
  .addClasspathResource("processes/tenant1/tenant1_process.bpmn")
  .deploy();
```

### Start a Process Instance from a Tenant Specific Process Definition

Using the `RuntimeService` to start a process instance of a process definition which is deployed for a specific tenant.

``` java
runtimeService
  .createProcessInstanceByKey("process")
  .processDefinitionTenantId("tenant1")
  .execute();
```

After starting a process instance, you can find it by their tenant-id which is inherit from the process definition.

``` java
List<ProcessInstance> processInstances = runtimeService
  .createProcessInstanceQuery()
  .tenantIdIn("tenant1")
  .list();
```

### Implement a Tenant-Aware Service Task

Implement a service task as `JavaDelegate` that can be used for multiple tenants. While execution, it retrieves the tenant-id from the execution (i.e. the process instance) and do some tenant specific logic.  

``` java
public class TenantAwareServiceTask implements JavaDelegate {

  @Override
  public void execute(DelegateExecution execution) throws Exception {

    String tenantId = execution.getTenantId();

    // do some logic based on the tenant-id (e.g. invoke a tenant-aware service)
  }
}
```

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test.
