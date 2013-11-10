package org.camunda.quickstart.servicetask.invocation.sync;

import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertNotNull;
import static junit.framework.Assert.assertTrue;
import static junit.framework.Assert.fail;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.quickstart.servicetask.invocation.AsynchronousServiceTask;
import org.camunda.quickstart.servicetask.invocation.BusinessLogic;
import org.camunda.quickstart.servicetask.invocation.MockMessageQueue;
import org.camunda.quickstart.servicetask.invocation.MockMessageQueue.Message;
import org.junit.Rule;
import org.junit.Test;

/**
 * Test case for demonstrating the asynchronous service invocation.
 * 
 */
public class TestAsynchronousServiceTask {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources = { "asynchronousServiceInvocation.bpmn" })
  public void testServiceInvocationSuccessful() {

    final ProcessEngine processEngine = processEngineRule.getProcessEngine();
    final RuntimeService runtimeService = processEngineRule.getRuntimeService();
    final TaskService taskService = processEngineRule.getTaskService();

    // this invocation should NOT fail
    Map<String, Object> variables = Collections.<String, Object> singletonMap(BusinessLogic.SHOULD_FAIL_VAR_NAME, false);

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("asynchronousServiceInvocation", variables);

    // the process instance is now waiting in the first wait state (user task):
    Task waitStateBefore = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateBefore")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateBefore);

    // Complete the first task. This triggers causes the Service task to be executed. 
    // After the method call returns, the message will be put into the queue and 
    // the process instance is waiting in the service task activity.
    taskService.complete(waitStateBefore.getId());

    // the process instance is now waiting in the service task activity:
    assertEquals(Arrays.asList("serviceTaskActivity"), runtimeService.getActiveActivityIds(processInstance.getId()));
    
    // the message is present in the Queue:
    Message message = MockMessageQueue.INSTANCE.getNextMessage();
    assertNotNull(message);
    assertEquals(processInstance.getId(), message.getPayload().get(AsynchronousServiceTask.EXECUTION_ID));

    // Next, trigger the business logic. This will send the callback to the process engine.
    // When this method call returns, the process instance will be waiting in the next waitstate.
    BusinessLogic.INSTANCE.invoke(message, processEngine);
    
    // the process instance is now waiting in the second wait state (user task):
    Task waitStateAfter = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateAfter")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateAfter);
        
    // check for variable set by the service task:
    variables = runtimeService.getVariables(processInstance.getId());
    assertEquals(BusinessLogic.PRICE, variables.get(BusinessLogic.PRICE_VAR_NAME));

  }

  @Test
  @Deployment(resources = { "asynchronousServiceInvocation.bpmn" })
  public void testServiceInvocationFailure() {

    final ProcessEngine processEngine = processEngineRule.getProcessEngine();
    final RuntimeService runtimeService = processEngine.getRuntimeService();
    final TaskService taskService = processEngine.getTaskService();

    // this invocation should fail
    Map<String, Object> variables = Collections.<String, Object> singletonMap(BusinessLogic.SHOULD_FAIL_VAR_NAME, true);

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("asynchronousServiceInvocation", variables);

    // the process instance is now waiting in the first wait state (user task):
    Task waitStateBefore = taskService.createTaskQuery()
      .taskDefinitionKey("waitStateBefore")
      .processInstanceId(processInstance.getId())
      .singleResult();
    assertNotNull(waitStateBefore);

    // Complete the first task. This triggers causes the Service task to be executed. 
    // After the method call returns, the message will be put into the queue and 
    // the process instance is waiting in the service task activity.
    taskService.complete(waitStateBefore.getId());

    // the process instance is now waiting in the service task activity:
    assertEquals(Arrays.asList("serviceTaskActivity"), runtimeService.getActiveActivityIds(processInstance.getId()));
    
    // the message is present in the Queue:
    Message message = MockMessageQueue.INSTANCE.getNextMessage();
    assertNotNull(message);
    assertEquals(processInstance.getId(), message.getPayload().get(AsynchronousServiceTask.EXECUTION_ID));

    // Next, trigger the business logic. In this case, this will throw an exception:
    try {
      BusinessLogic.INSTANCE.invoke(message, processEngine);
      fail("exception expected!");
    } catch (Exception e) {
      assertTrue(e.getMessage().contains("Service invocation failure!"));
    }

    // the process instance is still waiting in the service task activity:
    assertEquals(Arrays.asList("serviceTaskActivity"), runtimeService.getActiveActivityIds(processInstance.getId()));

  }

}
