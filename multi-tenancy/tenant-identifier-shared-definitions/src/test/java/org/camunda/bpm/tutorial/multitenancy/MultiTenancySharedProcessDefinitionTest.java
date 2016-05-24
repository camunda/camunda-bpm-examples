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
import static org.junit.Assert.assertThat;

import java.util.Collections;

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class MultiTenancySharedProcessDefinitionTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  private RepositoryService repositoryService;
  private RuntimeService runtimeService;
  private TaskService taskService;
  private IdentityService identityService;

  @Before
  public void initServices() {
    repositoryService = processEngineRule.getRepositoryService();
    runtimeService = processEngineRule.getRuntimeService();
    taskService = processEngineRule.getTaskService();
    identityService = processEngineRule.getIdentityService();
  }

  @Test
  public void testTenantIdProvider() {
    // deploy shared process definitions (which belongs to no tenant)
    repositoryService
      .createDeployment()
      .addClasspathResource("processes/default/mainProcess.bpmn")
      .addClasspathResource("processes/default/subProcess.bpmn")
      .deploy();

    // set the authenticated tenant and start a process instance
    identityService.setAuthentication("john", null, Collections.singletonList("tenant1"));

    runtimeService.startProcessInstanceByKey("mainProcess");

    // check that the process instance got the tenant id from the custom tenant id provider
    ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().processDefinitionKey("mainProcess").singleResult();
    assertThat(processInstance.getTenantId(), is("tenant1"));

    // and started the default sub-process
    Task task = taskService.createTaskQuery().processDefinitionKey("subProcess").singleResult();
    assertThat(task.getName(), is("task in default subprocess"));
  }

  @Test
  public void testOverrideSharedProcessDefinition() {
    // deploy default process definitions (which belongs to no tenant)
    repositoryService
      .createDeployment()
      .addClasspathResource("processes/default/mainProcess.bpmn")
      .addClasspathResource("processes/default/subProcess.bpmn")
      .deploy();

    // deploy custom process definition for 'tenant2'
    repositoryService
      .createDeployment()
      .tenantId("tenant2")
      .addClasspathResource("processes/tenant2/subProcess.bpmn")
      .deploy();

    // set the authenticated tenant and start a process instance
    identityService.setAuthentication("mary", null, Collections.singletonList("tenant2"));

    runtimeService.startProcessInstanceByKey("mainProcess");

    // check that the process instance has the tenant id 'tenant2'
    ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().processDefinitionKey("mainProcess").singleResult();
    assertThat(processInstance.getTenantId(), is("tenant2"));

    // and started the tenant-specific sub-process which overrides the default one
    Task task = taskService.createTaskQuery().processDefinitionKey("subProcess").singleResult();
    assertThat(task.getName(), is("task in tenant specific subprocess"));
  }

  @After
  public void clean() {
    for(Deployment deployment : repositoryService.createDeploymentQuery().list()) {
      repositoryService.deleteDeployment(deployment.getId(), true);
    }
  }

}
