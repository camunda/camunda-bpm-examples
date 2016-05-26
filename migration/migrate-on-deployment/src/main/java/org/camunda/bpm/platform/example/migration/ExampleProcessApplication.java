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
package org.camunda.bpm.platform.example.migration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import org.camunda.bpm.BpmPlatform;
import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.ProcessApplicationDeploymentInfo;
import org.camunda.bpm.application.ProcessApplicationInfo;
import org.camunda.bpm.application.impl.ServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.migration.MigrationPlan;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.repository.ProcessDefinitionQuery;

@ProcessApplication
public class ExampleProcessApplication extends ServletProcessApplication {

  private final static Logger LOG = Logger.getLogger(ExampleProcessApplication.class.getName());

  /**
   * <p>Migrates all process instances from the last version of the process definitions
   * deployed by this application to the latest version.
   */
  @PostDeploy
  public void migrateProcessInstances(ProcessApplicationInfo processApplicationInfo) {

    Map<String, List<ProcessApplicationDeploymentInfo>> deploymentsByEngine = organizeDeploymentsByEngine(processApplicationInfo);

    for (String engineName : deploymentsByEngine.keySet()) {
      ProcessEngine processEngine = BpmPlatform.getProcessEngineService().getProcessEngine(engineName);

      List<ProcessDefinition> latestIncludedProcessDefinitions =
          collectLatestProcessDefinitions(processEngine, deploymentsByEngine.get(engineName));

      for (ProcessDefinition latestDefinition : latestIncludedProcessDefinitions) {
        ProcessDefinition previousDefinition = getPreviousVersion(processEngine, latestDefinition);
        migrateInstances(processEngine, previousDefinition, latestDefinition);
      }
    }
  }

  protected Map<String, List<ProcessApplicationDeploymentInfo>> organizeDeploymentsByEngine(ProcessApplicationInfo processApplicationInfo) {
    Map<String, List<ProcessApplicationDeploymentInfo>> deploymentsByEngine = new HashMap<String, List<ProcessApplicationDeploymentInfo>>();

    for (ProcessApplicationDeploymentInfo deployment : processApplicationInfo.getDeploymentInfo()) {
      addToMapOfLists(deploymentsByEngine, deployment.getProcessEngineName(), deployment);
    }

    return deploymentsByEngine;
  }


  protected List<ProcessDefinition> collectLatestProcessDefinitions(ProcessEngine processEngine, List<ProcessApplicationDeploymentInfo> list) {
    List<ProcessDefinition> latestDefinitions = processEngine
      .getRepositoryService()
      .createProcessDefinitionQuery()
      .latestVersion()
      .list();

    Set<String> deploymentIds = collectDeploymentIds(list);

    List<ProcessDefinition> latestDefinitionsForApplication = new ArrayList<ProcessDefinition>();

    for (ProcessDefinition latestDefinition : latestDefinitions) {
      if (deploymentIds.contains(latestDefinition.getDeploymentId())) {
        latestDefinitionsForApplication.add(latestDefinition);
      }
    }

    return latestDefinitionsForApplication;
  }

  protected Set<String> collectDeploymentIds(List<ProcessApplicationDeploymentInfo> deploymentInfos) {
    Set<String> deploymentIds = new HashSet<String>();

    for (ProcessApplicationDeploymentInfo deploymentInfo : deploymentInfos) {
      deploymentIds.add(deploymentInfo.getDeploymentId());
    }

    return deploymentIds;
  }

  /**
   * Selects the process definition with the preceding version for the same key and tenant as the argument.
   */
  protected ProcessDefinition getPreviousVersion(ProcessEngine processEngine, ProcessDefinition processDefinition) {

    if (processDefinition.getVersion() <= 1) {
      return null;
    }

    RepositoryService repositoryService = processEngine.getRepositoryService();

    ProcessDefinitionQuery processDefinitionQuery = repositoryService
      .createProcessDefinitionQuery()
      .processDefinitionKey(processDefinition.getKey())
      .processDefinitionVersion(processDefinition.getVersion() - 1);

    if (processDefinition.getTenantId() != null) {
      processDefinitionQuery.tenantIdIn(processDefinition.getTenantId());
    }
    else {
      processDefinitionQuery.withoutTenantId();
    }

    return processDefinitionQuery.singleResult();
  }

  protected void migrateInstances(ProcessEngine processEngine,
      ProcessDefinition sourceDefinition,
      ProcessDefinition targetDefinition) {

    RuntimeService runtimeService = processEngine.getRuntimeService();

    MigrationPlan migrationPlan = runtimeService
      .createMigrationPlan(sourceDefinition.getId(), targetDefinition.getId())
      .mapEqualActivities()
      .build();

    LOG.info("Migrating all process instances from " + sourceDefinition.getId() + " to " + targetDefinition.getId());

    runtimeService
      .newMigration(migrationPlan)
      .processInstanceQuery(runtimeService.createProcessInstanceQuery().processDefinitionId(sourceDefinition.getId()))
      .execute();
    // .executeAsync() for asynchronous execution in a batch (useful for large numbers of instances)
  }


  protected static <S, T> void addToMapOfLists(Map<S, List<T>> map, S key, T value) {
    List<T> list = map.get(key);
    if (list == null) {
      list = new ArrayList<T>();
      map.put(key, list);
    }
    list.add(value);
  }

}
