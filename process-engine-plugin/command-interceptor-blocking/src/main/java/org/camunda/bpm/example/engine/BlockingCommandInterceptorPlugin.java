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
package org.camunda.bpm.example.engine;

import java.util.ArrayList;
import java.util.List;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.interceptor.CommandInterceptor;

/**
 * @author Daniel Meyer
 *
 */
public class BlockingCommandInterceptorPlugin extends AbstractProcessEnginePlugin {

  protected BlockingCommandInterceptor blockingCommandInterceptor = new BlockingCommandInterceptor();

  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {

    // add command interceptor to configuration
    List<CommandInterceptor> customPreCommandInterceptorsTxRequired = processEngineConfiguration.getCustomPreCommandInterceptorsTxRequired();
    if(customPreCommandInterceptorsTxRequired == null) {
      customPreCommandInterceptorsTxRequired = new ArrayList<CommandInterceptor>();
      processEngineConfiguration.setCustomPreCommandInterceptorsTxRequired(customPreCommandInterceptorsTxRequired);
    }
    customPreCommandInterceptorsTxRequired.add(blockingCommandInterceptor);

    List<CommandInterceptor> customPreCommandInterceptorsTxRequiresNew = processEngineConfiguration.getCustomPreCommandInterceptorsTxRequiresNew();
    if(customPreCommandInterceptorsTxRequiresNew == null) {
      customPreCommandInterceptorsTxRequiresNew = new ArrayList<CommandInterceptor>();
      processEngineConfiguration.setCustomPreCommandInterceptorsTxRequiresNew(customPreCommandInterceptorsTxRequiresNew);
    }
    customPreCommandInterceptorsTxRequiresNew.add(blockingCommandInterceptor);
  }

  public void postProcessEngineBuild(ProcessEngine processEngine) {
    // after the process engine is built, start blocking
    blockingCommandInterceptor.startBlocking();
  }

  /**
   * @return the blockingCommandInterceptor
   */
  public BlockingCommandInterceptor getBlockingCommandInterceptor() {
    return blockingCommandInterceptor;
  }

}
