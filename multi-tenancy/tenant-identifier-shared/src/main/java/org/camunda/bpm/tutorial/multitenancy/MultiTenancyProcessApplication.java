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

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.ServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.repository.ProcessDefinition;

@ProcessApplication(name="Multi-Tenancy App")
public class MultiTenancyProcessApplication extends ServletProcessApplication {

  @PostDeploy
  public void startProcessInstances(ProcessEngine processEngine) {

    RepositoryService repositoryService = processEngine.getRepositoryService();
    RuntimeService runtimeService = processEngine.getRuntimeService();

    // get the process definition from 'tenant1'
    ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery().tenantIdIn("tenant1").singleResult();
    if(processDefinition == null) {
      throw new RuntimeException("no process definition for 'tenant1' found");
    }

    // and start a process instance by id
    runtimeService.startProcessInstanceById(processDefinition.getId());

    // next, start a process instance of the process definition from 'tenant2' using the key
    // - note that this would fail if there is another deployed process definition from another tenant with the same key
    runtimeService.startProcessInstanceByKey("tenant2-process");
  }

}
