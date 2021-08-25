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
package org.camunda.bpm.quarkus.example.datasource;

import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.quarkus.engine.extension.event.CamundaEngineStartupEvent;

import javax.enterprise.event.Observes;
import javax.inject.Inject;

import org.camunda.bpm.engine.RepositoryService;
import org.jboss.logging.Logger;

public class Deployments {

  protected static final Logger LOG = Logger.getLogger(Deployments.class);

  @Inject
  protected RepositoryService repositoryService;

  public void performDeployment(@Observes CamundaEngineStartupEvent startupEvent) {
    Deployment deployment = repositoryService.createDeployment()
        .enableDuplicateFiltering(true)
        .addClasspathResource("bpmn/process.bpmn")
        .deploy();

    LOG.infov("Deployment with id {0} created", deployment.getId());
  }

}