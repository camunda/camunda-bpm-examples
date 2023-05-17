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

import org.camunda.bpm.engine.ProcessEngineException;
import org.camunda.bpm.engine.impl.errorcode.ExceptionCodeProvider;

public class ActiveDirectoryExceptionCodeProvider implements ExceptionCodeProvider {

  protected final int ldapErrorCode;
  protected final int activeDirectoryErrorCode;
  protected final int camundaCustomExceptionCode;
  protected final Class exceptionType;

  public ActiveDirectoryExceptionCodeProvider(
      int ldapErrorCode, int activeDirectoryErrorCode, int camundaCustomExceptionCode,String className) throws ClassNotFoundException {
    this.ldapErrorCode = ldapErrorCode;
    this.activeDirectoryErrorCode = activeDirectoryErrorCode;
    this.camundaCustomExceptionCode = camundaCustomExceptionCode;
    this.exceptionType = Class.forName(className);
  }

  public Integer provideCode(ProcessEngineException processEngineException) {
    Throwable cause = processEngineException.getCause();
    String message = cause.getMessage();
    System.out.println("ActiveDirectoryErrorCodeProviderPlugin got exception with cause: " + cause.getClass());
    System.out.println("ActiveDirectoryErrorCodeProviderPlugin got message: " + message);

    if(exceptionType.isInstance(cause)
        && message.contains("LDAP: error code " + ldapErrorCode)
        && message.contains("data " + activeDirectoryErrorCode)) {
      return camundaCustomExceptionCode;
    }

    return processEngineException.getCode();
  }

}
