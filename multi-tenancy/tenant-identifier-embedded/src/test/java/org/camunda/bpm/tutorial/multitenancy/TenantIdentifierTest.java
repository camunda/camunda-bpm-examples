/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.tutorial.multitenancy;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class TenantIdentifierTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  private RepositoryService repositoryService;
  private RuntimeService runtimeService;

  private Service mockService;

  @Before
  public void initServices() {
    repositoryService = processEngineRule.getRepositoryService();
    runtimeService = processEngineRule.getRuntimeService();

    // create a mock service and register it on the service task
    mockService = mock(Service.class);
    TenantAwareServiceTask.setService(mockService);
  }

  @Test
  public void deployProcessDefinitionsAndStartProcessInstances() {
    // deploy process definition for 'tenant1'
    repositoryService
      .createDeployment()
      .tenantId("tenant1")
      .addClasspathResource("processes/tenant1/tenant1_process.bpmn")
      .deploy();

    // deploy another process definition for 'tenant2'
    repositoryService
      .createDeployment()
      .tenantId("tenant2")
      .addClasspathResource("processes/tenant2/tenant2_process.bpmn")
      .deploy();

    // check that two process definitions are deployed
    assertThat(repositoryService.createProcessDefinitionQuery().count(), is(2L));

    // start a process instance for 'tenant1'
    runtimeService
      .createProcessInstanceByKey("process")
      .processDefinitionTenantId("tenant1")
      .execute();

    // check that the process instance have the same tenant-id
    ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().singleResult();
    assertThat(processInstance, is(notNullValue()));
    assertThat(processInstance.getTenantId(), is("tenant1"));

    // next, start a process instance for 'tenant2'
    runtimeService
      .createProcessInstanceByKey("process")
      .processDefinitionTenantId("tenant2")
      .execute();

    // check the tenant-id of the process instance
    processInstance = runtimeService.createProcessInstanceQuery().tenantIdIn("tenant2").singleResult();
    assertThat(processInstance, is(notNullValue()));
    assertThat(processInstance.getTenantId(), is("tenant2"));
  }

  @Test
  public void tenantAwareServiceTask() {
    // deploy process definition for 'tenant1'
    repositoryService
      .createDeployment()
      .tenantId("tenant1")
      .addClasspathResource("processes/tenant1/tenant1_process.bpmn")
      .deploy();

    // start a process instance by key
    // - note that this would fail if the process definition is also deployed for 'tenant2'
    runtimeService.startProcessInstanceByKey("process");

    // check that the service was invoked for 'tenant1'
    verify(mockService).invoke("tenant1");
  }

  @After
  public void clean() {
    for(Deployment deployment : repositoryService.createDeploymentQuery().list()) {
      repositoryService.deleteDeployment(deployment.getId(), true);
    }
  }

}
