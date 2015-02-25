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
package org.camunda.bpm.example.spin.dataformat.configuration;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.SerializableValue;
import org.camunda.spin.DataFormats;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;

public class JacksonConfiguratorTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources={"testProcess.bpmn"})
  public void shouldPackForHoliday() {
    RuntimeService runtimeService = processEngineRule.getRuntimeService();

    Car car = new Car();
    car.setPrice(new Money(1000));
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("testProcess",
        Variables.createVariables().putValueTyped("car",
            Variables
              .objectValue(car)
              .serializationDataFormat(DataFormats.JSON_DATAFORMAT_NAME)
              .create()));

    SerializableValue serializedCarValue =
        runtimeService.getVariableTyped(processInstance.getId(), "car");
    String carJson = serializedCarValue.getValueSerialized();
    Assert.assertEquals("{\"price\":1000}", carJson);

    Number price = (Number) runtimeService.getVariable(processInstance.getId(), "price");
    Assert.assertEquals(1000, price);
  }


}
