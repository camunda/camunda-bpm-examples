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
import java.util.Map;

/**
 * Provides the tenant id for a given user. Simple implementation just holds a
 * static mapping.
 */
public class TenantIdMapping {

  private static final Map<String, String> USER_TENANT_MAPPING = new HashMap<String, String>();

  static {
    USER_TENANT_MAPPING.put("demo", null);

    USER_TENANT_MAPPING.put("john", "tenant1");

    USER_TENANT_MAPPING.put("mary", "tenant2");
    USER_TENANT_MAPPING.put("peter", "tenant2");
  }

  public String getTenantIdForUser(String userId) {
    return USER_TENANT_MAPPING.get(userId);
  }

}
