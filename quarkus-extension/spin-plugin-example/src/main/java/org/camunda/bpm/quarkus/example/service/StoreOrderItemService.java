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
package org.camunda.bpm.quarkus.example.service;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.quarkus.example.dto.OrderItem;
import org.jboss.logging.Logger;

import javax.enterprise.context.Dependent;
import javax.inject.Named;

@Named
@Dependent
public class StoreOrderItemService implements JavaDelegate {

  protected static final Logger LOG = Logger.getLogger(StoreOrderItemService.class);

  @Override
  public void execute(DelegateExecution execution) {
    OrderItem orderItem = (OrderItem) execution.getVariable("orderItem");
    String name = orderItem.getName();
    double price = orderItem.getPrice();

    LOG.infov("Hurray, order item {0} with price {1} stored!", name, price);

    // Add logic to store order item here
  }

}
