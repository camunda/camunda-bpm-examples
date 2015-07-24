/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example.modelapi;

import java.util.Collections;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.cfg.ProcessEnginePlugin;
import org.camunda.bpm.engine.impl.cmmn.transformer.CmmnTransformListener;
import org.camunda.bpm.model.cmmn.Cmmn;

/**
 * @author Thorben Lindhauer
 *
 */
public class CustomElementsProcessEnginePlugin implements ProcessEnginePlugin {

  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {

    // make sure the CMMN transformer uses the extended Cmmn element palette
    Cmmn.INSTANCE = new CustomCmmn();

    // register transform listener
    processEngineConfiguration.setCustomPostCmmnTransformListeners(
      Collections.<CmmnTransformListener>singletonList(new KPITransformListener()));
  }

  public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
  }

  public void postProcessEngineBuild(ProcessEngine processEngine) {
  }

}
