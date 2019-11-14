/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.tutorial.multitenancy;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.Provider;

/**
 * @author Thorben Lindhauer
 *
 */
@Provider
public class TenantInterceptor implements ContainerRequestFilter {

  protected static final Map<String, String> USER_TENANT_MAPPING = new HashMap<>();

  static {
    USER_TENANT_MAPPING.put("kermit", "tenant1");
    USER_TENANT_MAPPING.put("gonzo", "tenant2");
  }

  @Inject
  protected Tenant tenant;

  @Override
  public void filter(ContainerRequestContext requestContext) throws IOException {
    List<String> user = requestContext.getUriInfo().getQueryParameters().get("user");

    if (user.size() != 1) {
      throw new WebApplicationException(Status.BAD_REQUEST);
    }

    String tenantForUser = USER_TENANT_MAPPING.get(user.get(0));
    tenant.setId(tenantForUser);
  }

}
