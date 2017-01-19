package org.camunda.bpm.example.test;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.example.tasklistener.InformAssigneeTaskListener;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * Test Bpmn Parse listener as process engine plugin has appended task listeners
 * and if task listeners are executed.
 */
public class BpmnParseListenerOnUserTaskTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  protected TaskService taskService;
  protected RuntimeService runtimeService;

  @Before
  public void init() {
    taskService = processEngineRule.getTaskService();
    runtimeService = processEngineRule.getRuntimeService();
  }

  @Test
  @Deployment(resources = { "bpmnParseListenerOnUserTask.bpmn" })
  public void testBpmnParseListener() throws IOException {

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("bpmnParseListenerOnUserTask");

    // check if the first task listener was executed
    List<String> assigneeList = InformAssigneeTaskListener.assigneeList;
    assertThat(assigneeList.size(), is(1));
    assertThat(assigneeList.get(0), is("Kermit"));

    // complete first user task
    Task task = taskService.createTaskQuery().singleResult();
    taskService.complete(task.getId());

    // check if the second task lister was executed
    assertThat(assigneeList.size(), is(2));
    assertThat(assigneeList.get(1), is("Fozzie"));

    // complete second user task
    task = taskService.createTaskQuery().singleResult();
    taskService.complete(task.getId());

    // check if process instance ended
    processInstance = runtimeService
                        .createProcessInstanceQuery()
                        .processInstanceId(processInstance.getId())
                        .singleResult();
    assertThat(processInstance, is(nullValue()));
  }

}
