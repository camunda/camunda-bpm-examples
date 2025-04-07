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
package org.camunda.bpm.example.spin.dataformat.servlet;

import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;

import org.camunda.bpm.application.ProcessApplicationContext;
import org.camunda.bpm.application.ProcessApplicationInterface;

/**
 * Intercepts method invocations when the methods are annotated with {@link InProcessApplicationContext}.
 *
 * @author Thorben Lindhauer
 */
@InProcessApplicationContext
@Interceptor
public class ProcessApplicationContextInterceptor {

  @Inject
  protected ProcessApplicationInterface processApplication;

  @AroundInvoke
  public Object performContextSwitch(InvocationContext invocationContext) throws Exception {

    try {
      ProcessApplicationContext.setCurrentProcessApplication(processApplication.getName());
      return invocationContext.proceed();
    } finally {
      ProcessApplicationContext.clear();
    }
  }

  public ProcessApplicationInterface getProcessApplication() {
    return processApplication;
  }

  public void setProcessApplication(ProcessApplicationInterface processApplication) {
    this.processApplication = processApplication;
  }

}
