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
package org.camunda.bpm.plugin.activedirectory;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.cfg.ProcessEnginePlugin;

public class ActiveDirectoryErrorCodeProviderPlugin implements ProcessEnginePlugin {

  protected int ldapErrorCode = 49;
  protected int activeDirectoryErrorCode = 773;
  protected int camundaCustomExceptionCode = 22_222;
  protected String exceptionType = "javax.naming.AuthenticationException";

  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    System.out.println("ActiveDirectoryErrorCodeProviderPlugin registered");
    try {
      processEngineConfiguration.setCustomExceptionCodeProvider(
          new ActiveDirectoryExceptionCodeProvider(ldapErrorCode, activeDirectoryErrorCode, camundaCustomExceptionCode, exceptionType));
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    }
  }

  public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    // do nothing
  }

  public void postProcessEngineBuild(ProcessEngine processEngine) {
    // do nothing
  }

  public int getLdapErrorCode() {
    return ldapErrorCode;
  }

  public void setLdapErrorCode(int ldapErrorCode) {
    this.ldapErrorCode = ldapErrorCode;
  }

  public int getActiveDirectoryErrorCode() {
    return activeDirectoryErrorCode;
  }

  public void setActiveDirectoryErrorCode(int activeDirectoryErrorCode) {
    this.activeDirectoryErrorCode = activeDirectoryErrorCode;
  }

  public int getCamundaCustomExceptionCode() {
    return camundaCustomExceptionCode;
  }

  public void setCamundaCustomExceptionCode(int camundaCustomExceptionCode) {
    this.camundaCustomExceptionCode = camundaCustomExceptionCode;
  }

  public String getExceptionType() {
    return exceptionType;
  }

  public void setExceptionType(String exceptionType) {
    this.exceptionType = exceptionType;
  }

}
