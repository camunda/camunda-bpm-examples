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
package org.camunda.bpm.spring.boot.example.dmn.rest;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.cfg.ProcessEnginePlugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DmnRestApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(DmnRestApplication.class, args);
  }

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Bean
  public ProcessEnginePlugin statusPlugin() {
    return new AbstractProcessEnginePlugin() {
      @Override
      public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
        logger.warn("post init");
      }

      @Override
      public void postProcessEngineBuild(ProcessEngine processEngine) {
        logger.warn("post build");
      }

      @Override
      public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
        logger.warn("pre init");
      }
    };
  }

}
