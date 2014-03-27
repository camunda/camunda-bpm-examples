/**
 * Copyright (C) 2011, 2012 camunda services GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example.spring.servlet.pa;

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.PreUndeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.ServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;

@ProcessApplication
public class SpringServletProcessApplication extends ServletProcessApplication {

  @PostDeploy
  public void startProcess(ProcessEngine processEngine) {
    System.out.println("Invoking @PostDeploy annotation in " + getClass().getName());
    System.out.println("Starting testResolveBean processdefinition");
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBean");
    System.out.println("Starting testResolveBeanFromJobExecutor processdefinition");
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBeanFromJobExecutor");
  }

  @PreUndeploy
  public void remove() {
    System.out.println("Invoking @PreUndeploy annotation in " + getClass().getName());
    System.out.println("Undeploying SpringServletProcessApplication-Example");
  }

}
