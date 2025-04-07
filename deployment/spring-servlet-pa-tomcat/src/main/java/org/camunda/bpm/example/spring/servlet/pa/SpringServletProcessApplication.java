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
package org.camunda.bpm.example.spring.servlet.pa;

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.PreUndeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.JakartaServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;

import java.util.logging.Level;
import java.util.logging.Logger;

@ProcessApplication
public class SpringServletProcessApplication extends JakartaServletProcessApplication {

  public static final Logger LOG = Logger.getLogger(SpringServletProcessApplication.class.getName());

  @PostDeploy
  public void startProcess(ProcessEngine processEngine) {
    LOG.log(Level.INFO, "Invoking @PostDeploy annotation in {0}\n" +
            "Starting testResolveBean processdefinition", getClass().getName());
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBean");

    LOG.info("Starting testResolveBeanFromJobExecutor processdefinition");
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBeanFromJobExecutor");
  }

  @PreUndeploy
  public void remove() {
    LOG.log(Level.INFO, "Invoking @PreUndeploy annotation in {0}\n" +
        "Undeploying SpringServletProcessApplication-Example", getClass().getName());
  }

}
