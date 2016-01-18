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
package org.camunda.bpm.example.spin.dataformat.servlet;

import javax.enterprise.context.ApplicationScoped;

import org.camunda.bpm.BpmPlatform;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.example.spin.dataformat.configuration.Car;
import org.camunda.spin.DataFormats;

/**
 * @author Thorben Lindhauer
 *
 */
@ApplicationScoped
public class ProcessInstanceStarterBean {

  @InProcessApplicationContext
  public ProcessInstance startProcess(Car car) {
    ProcessEngine processEngine = BpmPlatform.getDefaultProcessEngine();

    RuntimeService runtimeService = processEngine.getRuntimeService();

    return runtimeService.startProcessInstanceByKey("testProcess",
        Variables.createVariables().putValueTyped("car",
            Variables
              .objectValue(car)
              .serializationDataFormat(DataFormats.JSON_DATAFORMAT_NAME)
              .create()));

  }
}
