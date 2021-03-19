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

import org.camunda.bpm.client.spring.SpringTopicSubscription;
import org.camunda.bpm.client.spring.event.SubscriptionInitializedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class Subscriptions implements ApplicationListener<SubscriptionInitializedEvent> {

  protected static final Logger LOG = LoggerFactory.getLogger(Subscriptions.class);

  @Autowired
  public SpringTopicSubscription invoiceCreatorHandlerSubscription;

  @Autowired
  public SpringTopicSubscription invoiceArchiverHandlerSubscription;

  @PostConstruct
  public void listSubscriptionBeans() {
    LOG.info("Subscription bean 'invoiceCreatorHandlerSubscription' has topic name: {} ",
        invoiceCreatorHandlerSubscription.getTopicName());
    LOG.info("Subscription bean 'invoiceArchiverHandlerSubscription' has topic name: {} ",
        invoiceArchiverHandlerSubscription.getTopicName());
  }

  @Override
  public void onApplicationEvent(SubscriptionInitializedEvent event) {
    SpringTopicSubscription springTopicSubscription = event.getSource();
    String topicName = springTopicSubscription.getTopicName();
    LOG.info("Subscription with topic name '{}' initialized", topicName);

    if (!springTopicSubscription.isOpen()) {
      LOG.info("Subscription with topic name '{}' not yet opened", topicName);

      // do something before subscription is opened

      springTopicSubscription.open();

      LOG.info("Subscription with topic name '{}' opened", topicName);

      springTopicSubscription.close();

      LOG.info("Subscription with topic name '{}' temporarily closed", topicName);

      // do something with subscription closed

      springTopicSubscription.open();

      LOG.info("Subscription with topic name '{}' reopened again", topicName);
    }
  }

}
