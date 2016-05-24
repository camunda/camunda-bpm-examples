package org.camunda.bpm.example.test;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.util.List;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.example.delegate.ServiceTaskOneDelegate;
import org.camunda.bpm.example.delegate.ServiceTaskTwoDelegate;
import org.camunda.bpm.example.executionlistener.ProgressLoggingExecutionListener;
import org.junit.Rule;
import org.junit.Test;

/**
 * Test Bpmn Parse listener as process engine plugin and
 * parse extension properties on bpmn element
 *
 * @author kristin.polenz
 *
 */
public class BpmnParseListenerTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(resources = { "bpmnParseListener.bpmn" })
  public void testBpmnParseListener() throws IOException {
    ServiceTaskOneDelegate.wasExecuted = false;
    ServiceTaskTwoDelegate.wasExecuted = false;

    RuntimeService runtimeService = processEngineRule.getRuntimeService();

    // start the process instance
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("bpmnParseListener");

    // check if process instance ended
    assertEquals(true, processInstance.isEnded());

    // check if execution listener was executed
    List<String> progressValueList = ProgressLoggingExecutionListener.progressValueList;
    assertEquals(2, progressValueList.size());
    assertEquals("50%", progressValueList.get(0));
    assertEquals("100%", progressValueList.get(1));

    // check if service task executed
    assertEquals(true, ServiceTaskOneDelegate.wasExecuted);
    assertEquals(true, ServiceTaskTwoDelegate.wasExecuted);
  }

}
