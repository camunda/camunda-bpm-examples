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
package org.camunda.bpm.quarkus.example;

import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.quarkus.engine.extension.event.CamundaEngineStartupEvent;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;

@ApplicationScoped
public class ResourceDeployment {

  protected static final Logger LOG = Logger.getLogger(ResourceDeployment.class);

  @Inject
  protected RepositoryService repositoryService;

  public void createDeployment(@Observes CamundaEngineStartupEvent event) {
    String deploymentId = repositoryService.createDeployment()
        .name("example-deployment")
        .addClasspathResource("process.bpmn")
        .enableDuplicateFiltering(true)
        .deploy()
        .getId();

    LOG.infov("Deployment with id {0} created", deploymentId);
  }

}
