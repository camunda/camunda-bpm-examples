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
package org.camunda.bpm.example.servicetask.soap;

import java.util.HashMap;
import java.util.Map;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
/**
 * @author Daniel Meyer
 *
 */
public class ServiceTaskSoapTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources={"invokeSoapService.bpmn"})
  public void shouldInvokeService() {
    Map<String, Object> variables = new HashMap<String, Object>();
    variables.put("city", "Berlin-Tempelhof");
    variables.put("country", "Germany");

    RuntimeService runtimeService = processEngineRule.getRuntimeService();
    TaskService taskService = processEngineRule.getTaskService();

    runtimeService.startProcessInstanceByKey("weatherForecast", variables);

    Task task = taskService.createTaskQuery().singleResult();
    Assert.assertNotNull(task);

    int temperature = Integer.parseInt( taskService.getVariable(task.getId(), "temperature").toString() );
    if(temperature >= 18) {
      Assert.assertEquals("UserTask_1", task.getTaskDefinitionKey());
    } else {
      Assert.assertEquals("UserTask_2", task.getTaskDefinitionKey());
    }

  }

}
