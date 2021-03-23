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
import org.camunda.bpm.client.spring.annotation.ExternalTaskSubscription;
import org.camunda.bpm.client.spring.boot.starter.ClientProperties;
import org.camunda.bpm.client.spring.event.SubscriptionInitializedEvent;
import org.camunda.bpm.client.task.ExternalTaskHandler;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class HandlerConfiguration {
  
  protected static Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

  protected String workerId;

  public HandlerConfiguration(ClientProperties properties) {
    workerId = properties.getWorkerId();
  }

  @ExternalTaskSubscription("creditScoreChecker")
  @Bean
  public ExternalTaskHandler creditScoreChecker() {
    return (externalTask, externalTaskService) -> {

      // retrieve a variable from the Workflow Engine
      int defaultScore = externalTask.getVariable("defaultScore");

      List<Integer> creditScores = new ArrayList<>(Arrays.asList(defaultScore, 9, 1, 4, 10));

      // create an object typed variable
      ObjectValue creditScoresObject = Variables.objectValue(creditScores).create();

      // complete the external task
      externalTaskService.complete(externalTask, Variables.putValueTyped("creditScores", creditScoresObject));

      LOG.info("{}: The External Task {} has been checked!", workerId, externalTask.getId());
    };
  }

  @ExternalTaskSubscription("loanGranter")
  @Bean
  public ExternalTaskHandler loanGranter() {
    return (externalTask, externalTaskService) -> {
      int score = externalTask.getVariable("score");
      externalTaskService.complete(externalTask);

      LOG.info("{}: The External Task {} has been granted with score {}!", workerId, externalTask.getId(), score);
    };
  }

  @ExternalTaskSubscription("requestRejecter")
  @Bean
  public ExternalTaskHandler requestRejecter() {
    return (externalTask, externalTaskService) -> {
      int score = externalTask.getVariable("score");
      externalTaskService.complete(externalTask);

      LOG.info("{}: The External Task {} has been rejected with score {}!", workerId, externalTask.getId(), score);
    };
  }

  @EventListener(SubscriptionInitializedEvent.class)
  public void catchSubscriptionInitEvent(SubscriptionInitializedEvent event) {

    SpringTopicSubscription topicSubscription = event.getSource();
    if (!topicSubscription.isAutoOpen()) {

      // open topic in case it is not opened already
      topicSubscription.open();

      LOG.info("Subscription with topic name '{}' has been opened!",
          topicSubscription.getTopicName());
    }
  }

}
