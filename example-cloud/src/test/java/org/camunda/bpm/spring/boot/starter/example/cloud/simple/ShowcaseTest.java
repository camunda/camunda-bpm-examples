package org.camunda.bpm.spring.boot.starter.example.cloud.simple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.execute;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.historyService;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.jobQuery;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.runtimeService;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.taskService;
import static org.camunda.bpm.extension.mockito.DelegateExpressions.autoMock;
import static org.mockito.Mockito.mock;
import static org.springframework.test.util.ReflectionTestUtils.setField;

import org.camunda.bpm.engine.runtime.Job;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.spring.boot.starter.test.helper.AbstractProcessEngineRuleTest;
import org.junit.Before;
import org.junit.Test;
import org.springframework.context.event.ContextRefreshedEvent;

@Deployment(resources = "bpmn/sample.bpmn")
public class ShowcaseTest extends AbstractProcessEngineRuleTest {

  private Showcase showcase;

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
