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
package org.camunda.bpm.spring.boot.example.simple;

import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.complete;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.execute;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.job;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.runtimeService;
import static org.camunda.bpm.engine.test.assertions.ProcessEngineTests.task;
import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.assertThat;
import static org.camunda.bpm.extension.mockito.DelegateExpressions.autoMock;

import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.spring.boot.starter.test.helper.AbstractProcessEngineRuleTest;
import org.junit.Test;

/**
 * Ensure the sample.bpmn Process is working correctly.
 */
@Deployment(resources = "bpmn/sample.bpmn")
public class SampleProcessTest extends AbstractProcessEngineRuleTest {

  @Test
  public void start_and_finish_process() {
    autoMock("bpmn/sample.bpmn");

    final ProcessInstance processInstance = runtimeService().startProcessInstanceByKey("Sample");

    assertThat(processInstance).isWaitingAt("UserTask_1");

    complete(task());

    assertThat(processInstance).isWaitingAt("ServiceTask_1");
    execute(job());

    assertThat(processInstance).isEnded();
  }
}
