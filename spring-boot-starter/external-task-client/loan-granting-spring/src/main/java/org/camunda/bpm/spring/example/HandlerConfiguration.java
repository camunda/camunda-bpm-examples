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
package org.camunda.bpm.spring.example;

import org.camunda.bpm.client.spring.annotation.ExternalTaskSubscription;
import org.camunda.bpm.client.task.ExternalTaskHandler;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class HandlerConfiguration {

  protected static final Logger LOG = LoggerFactory.getLogger(HandlerConfiguration.class);

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

      LOG.info("The External Task {} has been checked!", externalTask.getId());
    };
  }

  @ExternalTaskSubscription(
      topicName = "loanGranter",
      lockDuration = 10_0000
  )
  @Bean
  public ExternalTaskHandler loanGranter() {
    return (externalTask, externalTaskService) -> {
      int score = externalTask.getVariable("score");
      externalTaskService.complete(externalTask);

      LOG.info("The External Task {} has been granted with score {}!", externalTask.getId(), score);
    };
  }

  @ExternalTaskSubscription("requestRejecter")
  @Bean
  public ExternalTaskHandler requestRejecter() {
    return (externalTask, externalTaskService) -> {
      int score = externalTask.getVariable("score");
      externalTaskService.complete(externalTask);

      LOG.info("The External Task {} has been rejected with score {}!", externalTask.getId(), score);
    };
  }
}
