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
