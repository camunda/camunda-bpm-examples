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
package org.camunda.bpm.spring.boot.example;

import org.camunda.bpm.client.spring.annotation.ExternalTaskSubscription;
import org.camunda.bpm.client.task.ExternalTaskHandler;
import org.camunda.bpm.client.variable.ClientValues;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.camunda.bpm.engine.variable.value.TypedValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class HandlerConfiguration {

  protected static final Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

  @Bean
  @ExternalTaskSubscription("invoiceCreator")
  public ExternalTaskHandler invoiceCreatorHandler() {
    return (externalTask, externalTaskService) -> {

      // instantiate an invoice object
      Invoice invoice = new Invoice("A123");

      // create an object typed variable with the serialization format XML
      ObjectValue invoiceValue = ClientValues
          .objectValue(invoice)
          .serializationDataFormat("application/xml")
          .create();

      // add the invoice object and its id to a map
      Map<String, Object> variables = new HashMap<>();
      variables.put("invoiceId", invoice.id);
      variables.put("invoice", invoiceValue);

      // select the scope of the variables
      boolean isRandomSample = Math.random() <= 0.5;
      if (isRandomSample) {
        externalTaskService.complete(externalTask, variables);
      } else {
        externalTaskService.complete(externalTask, null, variables);
      }

      LOG.info("The External Task {} has been completed!", externalTask.getId());

    };
  }

  @Bean
  @ExternalTaskSubscription(
      topicName = "invoiceArchiver",
      autoOpen = false
  )
  public ExternalTaskHandler invoiceArchiverHandler() {
    return (externalTask, externalTaskService) -> {
      TypedValue typedInvoice = externalTask.getVariableTyped("invoice");
      Invoice invoice = (Invoice) typedInvoice.getValue();
      LOG.info("Invoice on process scope archived: {}", invoice);
      externalTaskService.complete(externalTask);
    };
  }

}
