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

import jakarta.enterprise.context.Dependent;
import jakarta.inject.Named;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.jboss.logging.Logger;

@Dependent
@Named
public class ApprovalServiceDelegate implements JavaDelegate {

  protected static final Logger LOG = Logger.getLogger(ApprovalServiceDelegate.class);

  @Override
  public void execute(DelegateExecution delegateExecution) {
    int amount = (int) delegateExecution.getVariable("amount");

    // some complex non-DMN evaluation logic goes here
    boolean approved = amount > 0;

    delegateExecution.setVariable("approved", approved);

    LOG.infov("Result of amount evaluation: {0}", approved);
  }

}