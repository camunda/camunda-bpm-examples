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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.Provider;

import org.jboss.resteasy.annotations.interception.ServerInterceptor;
import org.jboss.resteasy.core.ResourceMethod;
import org.jboss.resteasy.core.ServerResponse;
import org.jboss.resteasy.spi.Failure;
import org.jboss.resteasy.spi.HttpRequest;
import org.jboss.resteasy.spi.interception.PreProcessInterceptor;

/**
 * @author Thorben Lindhauer
 *
 */
@Provider
@ServerInterceptor
public class TenantInterceptor implements PreProcessInterceptor {

  protected static final Map<String, String> USER_TENANT_MAPPING = new HashMap<String, String>();

  static {
    USER_TENANT_MAPPING.put("kermit", "tenant1");
    USER_TENANT_MAPPING.put("gonzo", "tenant2");
  }

  @Inject
  protected Tenant tenant;

  public ServerResponse preProcess(HttpRequest request, ResourceMethod method) throws Failure, WebApplicationException {
    List<String> user = request.getUri().getQueryParameters().get("user");

    if (user.size() != 1) {
      throw new WebApplicationException(Status.BAD_REQUEST);
    }

    String tenantForUser = USER_TENANT_MAPPING.get(user.get(0));
    tenant.setId(tenantForUser);

    return null;
  }
}
