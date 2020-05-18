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
package org.camunda.bpm.example;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.spin.plugin.variable.value.JsonValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JsonJavaDelegate implements JavaDelegate {
  
  private static final Logger LOG = LoggerFactory.getLogger(JsonJavaDelegate.class);

  @Override
  public void execute(DelegateExecution execution) {
    JsonValue jsonCustomer = execution.getVariableTyped("customer");
    jsonCustomer.getValue().prop("isValid", randomValid());
    LOG.info("JSON customer: {}", jsonCustomer);
    execution.setVariable("customer", jsonCustomer);
  }
  
  protected boolean randomValid() {
    return Math.random() > 0.5 ? true : false;
  }

}
