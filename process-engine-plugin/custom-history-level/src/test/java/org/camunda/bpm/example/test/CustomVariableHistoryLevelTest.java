package org.camunda.bpm.example.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

/**
 * Test Bpmn Parse listener as process engine plugin and
 * parse extension properties on bpmn element
 *
 * @author kristin.polenz
 *
 */
public class CustomVariableHistoryLevelTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule("camunda-custom-variable.cfg.xml");

  protected RuntimeService runtimeService;
  protected HistoryService historyService;

  @Before
  public void getEngineServices() {
    runtimeService = processEngineRule.getRuntimeService();
    historyService = processEngineRule.getHistoryService();
  }

  @Test
  @Deployment(resources = { "process.bpmn" })
  public void testCustomVariableHistoryTest() {
    runtimeService.startProcessInstanceByKey("process");

    // assert that only variables which ends with '-hist' are written to history
    List<HistoricVariableInstance> variableInstances = historyService.createHistoricVariableInstanceQuery().list();
    assertEquals(2, variableInstances.size());
    for (HistoricVariableInstance variableInstance : variableInstances) {
      assertTrue(variableInstance.getName().endsWith("-hist"));
    }
  }

  @Test
  @Deployment(resources = { "process.bpmn" })
  public void testCustomVariableHistoryWithAdditionalVariablesTest() {
    Map<String, Object> variables = new HashMap<String, Object>();
    variables.put("a", "a");
    variables.put("b-hist", "b");
    variables.put("c-ist", "b");
    runtimeService.startProcessInstanceByKey("process", variables);

    // assert that only variables which ends with '-hist' are written to history
    List<HistoricVariableInstance> variableInstances = historyService.createHistoricVariableInstanceQuery().list();
    assertEquals(3, variableInstances.size());
    for (HistoricVariableInstance variableInstance : variableInstances) {
      assertTrue(variableInstance.getName().endsWith("-hist"));
    }
  }

}
