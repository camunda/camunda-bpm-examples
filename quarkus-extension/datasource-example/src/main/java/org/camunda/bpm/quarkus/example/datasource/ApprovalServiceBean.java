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

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ApprovalServiceBean {

  protected static final Logger LOG = Logger.getLogger(ApprovalServiceBean.class);

  @Inject
  protected RuntimeService runtimeService;

  @Inject
  protected HistoryService historyService;

  @Transactional
  public String evaluateForApproval(int amount) {
    // first, let's use the Camunda engine to approve a given amount of something
    VariableMap variables = Variables.createVariables().putValue("amount", amount);
    ProcessInstance processInstance = runtimeService
        .startProcessInstanceByKey("approval-process", variables);

    // next, let's do some additional steps in the same transaction
    HistoricVariableInstance variable = historyService.createHistoricVariableInstanceQuery()
        .processInstanceId(processInstance.getId())
        .variableName("approved")
        .singleResult();

    String result = "";
    if (variable != null && variable.getValue().equals(true)) {
      result = "The amount was approved";
      LOG.info(result);
    } else {
      throw new IllegalArgumentException(result);
    }

    return result;
  }

}