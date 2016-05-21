package org.camunda.bpm.spring.boot.starter.example.cloud.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.execute;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.historyService;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.jobQuery;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.runtimeService;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.taskService;
import static org.camunda.bpm.extension.mockito.DelegateExpressions.autoMock;
import static org.mockito.Mockito.mock;
import static org.springframework.test.util.ReflectionTestUtils.setField;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngineConfiguration;
import org.camunda.bpm.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration;
import org.camunda.bpm.engine.runtime.Job;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.engine.test.mock.MockExpressionManager;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.springframework.context.event.ContextRefreshedEvent;

@Deployment(resources = "bpmn/sample.bpmn")
public class ShowcaseTest {

  private static final ProcessEngineConfiguration processEngineConfiguration = new StandaloneInMemProcessEngineConfiguration() {
    {
      jobExecutorActivate = false;
      expressionManager = new MockExpressionManager();
      databaseSchemaUpdate = DB_SCHEMA_UPDATE_DROP_CREATE;
    }
  };

  private static final ProcessEngine PROCESS_ENGINE_NEEDS_CLOSE = processEngineConfiguration.buildProcessEngine();

  @Rule
  public final ProcessEngineRule processEngine = new ProcessEngineRule(PROCESS_ENGINE_NEEDS_CLOSE);

  private Showcase showcase;

  @AfterClass
  public static void shutdown() {
    PROCESS_ENGINE_NEEDS_CLOSE.close();
  }

  @Before
  public void setUp() {
    autoMock("bpmn/sample.bpmn");

    showcase = new Showcase();
    setField(showcase, "runtimeService", runtimeService());
    setField(showcase, "taskService", taskService());
  }

  @Test
  public void startAndFinishProcess() {
    showcase.notify(mock(ContextRefreshedEvent.class));
    final String processInstanceId = showcase.getProcessInstanceId();

    final Job job = jobQuery().active().processInstanceId(processInstanceId).singleResult();

    execute(job);

    assertThat(historyService().createHistoricProcessInstanceQuery().processInstanceId(processInstanceId).singleResult().getEndTime()).isNotNull();
  }

}
