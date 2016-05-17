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

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.inject.Produces;
import javax.enterprise.inject.Specializes;
import javax.inject.Inject;
import javax.inject.Named;

import org.camunda.bpm.BpmPlatform;
import org.camunda.bpm.engine.AuthorizationService;
import org.camunda.bpm.engine.CaseService;
import org.camunda.bpm.engine.DecisionService;
import org.camunda.bpm.engine.ExternalTaskService;
import org.camunda.bpm.engine.FilterService;
import org.camunda.bpm.engine.FormService;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngineException;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.cdi.impl.ProcessEngineServicesProducer;
import org.camunda.bpm.engine.impl.context.Context;
import org.camunda.bpm.engine.impl.interceptor.CommandContext;

/**
 * @author Thorben Lindhauer
 *
 */
@Specializes
public class TenantAwareProcessEngineServicesProducer extends ProcessEngineServicesProducer {

  @Inject
  private Tenant tenant;

  @Override
  @Named
  @Produces
  @RequestScoped
  public ProcessEngine processEngine() {
    CommandContext commandContext = Context.getCommandContext();

    if (commandContext == null) {
      return getProcessEngineByTenantId(tenant.getId());

    } else {
      // used within the process engine (e.g. by the job executor)
      return commandContext.getProcessEngineConfiguration().getProcessEngine();
    }
  }

  protected ProcessEngine getProcessEngineByTenantId(String tenantId) {
    if (tenantId != null) {
      ProcessEngine processEngine = BpmPlatform.getProcessEngineService().getProcessEngine(tenantId);
      if (processEngine != null) {
        return processEngine;
      } else {
        throw new ProcessEngineException("No process engine found for tenant id '" + tenantId + "'.");
      }
    } else {
      throw new ProcessEngineException("No tenant id specified. A process engine can only be retrieved based on a tenant.");
    }
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public RuntimeService runtimeService() {
    return processEngine().getRuntimeService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public TaskService taskService() {
    return processEngine().getTaskService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public RepositoryService repositoryService() {
    return processEngine().getRepositoryService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public FormService formService() {
    return processEngine().getFormService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public HistoryService historyService() {
    return processEngine().getHistoryService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public IdentityService identityService() {
    return processEngine().getIdentityService();
  }

  @Override
  @Produces
  @Named
  @RequestScoped
  public ManagementService managementService() {
    return processEngine().getManagementService();
  }

  @Override
  @Produces
  @Named
  @ApplicationScoped
  public AuthorizationService authorizationService() {
    return processEngine().getAuthorizationService();
  }

  @Override
  @Produces
  @Named
  @ApplicationScoped
  public FilterService filterService() {
    return processEngine().getFilterService();
  }

  @Override
  @Produces
  @Named
  @ApplicationScoped
  public ExternalTaskService externalTaskService() {
    return processEngine().getExternalTaskService();
  }

  @Override
  @Produces
  @Named
  @ApplicationScoped
  public CaseService caseService() {
    return processEngine().getCaseService();
  }

  @Override
  @Produces
  @Named
  @ApplicationScoped
  public DecisionService decisionService() {
    return processEngine().getDecisionService();
  }

}