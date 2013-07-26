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
package org.camunda.bpm.example.spring.jboss;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.camunda.bpm.engine.ProcessEngine;
import org.springframework.beans.factory.InitializingBean;

/**
 * @author Daniel Meyer
 *
 */
public class ProcessEngineClient implements InitializingBean {

  private final static Logger LOGG = Logger.getLogger(ProcessEngineClient.class.getName());
  
  protected ProcessEngine processEngine;
  
  public void afterPropertiesSet() throws Exception {
    
    long deployedProcessDefinitionsCount = processEngine.getRepositoryService()
        .createProcessDefinitionQuery()
        .count();
    
    LOGG.log(Level.INFO, "\n\n\n" +
      "Hi there!" +
      "\n" +
      "I am a spring bean and I am using a container managed process engine provided as JBoss Service for all applications to share." +
      "\n" +
      "The engine is named {0}." +
      "\n" +
      "There are currently {1} processes deployed on this engine." +
      "\n\n",
      new Object[]{ processEngine.getName(), deployedProcessDefinitionsCount});
  }
    
  public void setProcessEngine(ProcessEngine processEngine) {
    this.processEngine = processEngine;
  }

}
