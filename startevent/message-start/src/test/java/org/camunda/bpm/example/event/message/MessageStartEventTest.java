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
package org.camunda.bpm.example.event.message;

import static org.junit.Assert.assertEquals;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;

/**
 * @author Thorben Lindhauer
 */
public class MessageStartEventTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources={"instantiating_process.bpmn", "message_start_process.bpmn"})
  public void shouldStartProcessByMessage() {
    RuntimeService runtimeService = processEngineRule.getRuntimeService();
    TaskService taskService = processEngineRule.getTaskService();

    runtimeService.startProcessInstanceByKey("Instantiating_Process");

    // now there should be two instances: one of Instantiating_Process and
    // one of the process that was instantiated by message from the service task
    assertEquals(2, runtimeService.createProcessInstanceQuery().count());

    // the instantiating process has advanced to the user task
    Task task = taskService.createTaskQuery().processDefinitionKey("Instantiating_Process").singleResult();
    Assert.assertNotNull(task);
    assertEquals("Wait in Instantiating Process", task.getName());

    // the message start event process has advanced to the user task
    task = taskService.createTaskQuery().processDefinitionKey("Message_Start_Process").singleResult();
    Assert.assertNotNull(task);
    assertEquals("Wait in Message Process", task.getName());
  }
}
