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

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.JakartaServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;

@ProcessApplication(name="Multi-Tenancy App")
public class MultiTenancyProcessApplication extends JakartaServletProcessApplication {

  @PostDeploy
  public void startProcessInstances(ProcessEngine processEngine) {

    RuntimeService runtimeService = processEngine.getRuntimeService();

    // start a process instance for 'tenant1'
    runtimeService
      .createProcessInstanceByKey("example-process")
      .processDefinitionTenantId("tenant1")
      .execute();

    // next, start a process instance for 'tenant2'
    runtimeService
      .createProcessInstanceByKey("example-process")
      .processDefinitionTenantId("tenant2")
      .execute();
  }

}
