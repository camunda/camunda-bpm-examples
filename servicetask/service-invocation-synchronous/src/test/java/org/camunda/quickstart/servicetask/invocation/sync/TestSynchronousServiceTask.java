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
package org.camunda.quickstart.servicetask.invocation.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.Collections;
import java.util.Map;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Rule;
import org.junit.Test;

/**
 * Test case for demonstrating the synchronous service invocation.
 * 
 */
public class TestSynchronousServiceTask {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources = { "synchronousServiceInvocation.bpmn" })
  public void shouldCallServiceSuccessfully() {

    final RuntimeService runtimeService = processEngineRule.getRuntimeService();
    final TaskService taskService = processEngineRule.getTaskService();

    // this invocation should NOT fail
    Map<String, Object> variables = Collections.<String, Object> singletonMap(SynchronousServiceTask.SHOULD_FAIL_VAR_NAME, false);

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("synchronousServiceInvocation", variables);

    // the process instance is now waiting in the first wait state (user task):
    Task waitStateBefore = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateBefore")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateBefore);

    // Complete this task. This triggers the synchronous invocation of the
    // service task. This method invocation returns after the service task 
    // has been executed and the process instance has advanced to the second waitstate.
    taskService.complete(waitStateBefore.getId());

    // the process instance is now waiting in the second wait state (user task):
    Task waitStateAfter = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateAfter")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateAfter);

    // check for variable set by the service task:
    variables = runtimeService.getVariables(processInstance.getId());
    assertEquals(SynchronousServiceTask.PRICE, variables.get(SynchronousServiceTask.PRICE_VAR_NAME));

  }

  @Test
  @Deployment(resources = { "synchronousServiceInvocation.bpmn" })
  public void shouldCallServiceWithFailure() {

    final RuntimeService runtimeService = processEngineRule.getRuntimeService();
    final TaskService taskService = processEngineRule.getTaskService();

    // this invocation should fail
    Map<String, Object> variables = Collections.<String, Object> singletonMap(SynchronousServiceTask.SHOULD_FAIL_VAR_NAME, true);

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("synchronousServiceInvocation", variables);

    // the process instance is now waiting in the first wait state (user task):
    Task waitStateBefore = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateBefore")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateBefore);

    // Complete this task. This triggers the synchronous invocation of the service task.
    // This time the service task will fail and the process instance will roll
    // back to it's previous state:
    try {
      taskService.complete(waitStateBefore.getId());
      fail("Exception expected.");
    } catch (Exception e) {
      assertTrue(e.getMessage().contains("Service invocation failure!"));
    }

    // the process instance is still waiting in the first wait state (user
    // task):
    waitStateBefore = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateBefore")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateBefore);

    // the variable is not present:
    variables = runtimeService.getVariables(processInstance.getId());
    assertNull(variables.get(SynchronousServiceTask.PRICE_VAR_NAME));

  }

}
