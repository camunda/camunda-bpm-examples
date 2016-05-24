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

import java.util.List;

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.impl.cfg.multitenancy.TenantIdProvider;
import org.camunda.bpm.engine.impl.cfg.multitenancy.TenantIdProviderCaseInstanceContext;
import org.camunda.bpm.engine.impl.cfg.multitenancy.TenantIdProviderHistoricDecisionInstanceContext;
import org.camunda.bpm.engine.impl.cfg.multitenancy.TenantIdProviderProcessInstanceContext;
import org.camunda.bpm.engine.impl.context.Context;
import org.camunda.bpm.engine.impl.identity.Authentication;

/**
 * Provides the tenant-id based on the current authenticated tenant.
 */
public class CustomTenantIdProvider implements TenantIdProvider {

  @Override
  public String provideTenantIdForProcessInstance(TenantIdProviderProcessInstanceContext ctx) {
    return getTenantIdOfCurrentAuthentication();
  }

  @Override
  public String provideTenantIdForCaseInstance(TenantIdProviderCaseInstanceContext ctx) {
    return getTenantIdOfCurrentAuthentication();
  }

  @Override
  public String provideTenantIdForHistoricDecisionInstance(TenantIdProviderHistoricDecisionInstanceContext ctx) {
    return getTenantIdOfCurrentAuthentication();
  }

  protected String getTenantIdOfCurrentAuthentication() {

    IdentityService identityService = Context.getProcessEngineConfiguration().getIdentityService();
    Authentication currentAuthentication = identityService.getCurrentAuthentication();

    if (currentAuthentication != null) {

      List<String> tenantIds = currentAuthentication.getTenantIds();
      if (tenantIds.size() == 1) {
        return tenantIds.get(0);

      } else if (tenantIds.isEmpty()) {
        throw new IllegalStateException("no authenticated tenant");

      } else {
        throw new IllegalStateException("more than one authenticated tenant");
      }

    } else {
      throw new IllegalStateException("no authentication");
    }
  }

}
