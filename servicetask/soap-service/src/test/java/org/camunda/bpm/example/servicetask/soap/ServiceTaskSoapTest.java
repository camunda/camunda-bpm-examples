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
package org.camunda.bpm.example.servicetask.soap;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.camunda.bpm.example.servicetask.soap.MockedSoapRule.MOCKED_BASE_URL;
import static org.camunda.bpm.example.servicetask.soap.MockedSoapRule.MOCKED_HOST;
import static org.camunda.bpm.example.servicetask.soap.MockedSoapRule.MOCKED_PORT;
import static org.camunda.bpm.example.servicetask.soap.MockedSoapRule.MOCKED_SERVICE_PATH;
import static org.camunda.bpm.example.servicetask.soap.MockedSoapRule.MOCKED_SOAP_ACTION;

public class ServiceTaskSoapTest {

  @ClassRule
  public static MockedSoapRule mockedBackend = new MockedSoapRule(options()
      .bindAddress(MOCKED_HOST)
      .port(MOCKED_PORT));

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  protected RuntimeService runtimeService;
  protected TaskService taskService;

  @Before
  public void assignServices() {
    runtimeService = processEngineRule.getRuntimeService();
    taskService = processEngineRule.getTaskService();
  }

  @Test
  @Deployment(resources={"invokeSoapService.bpmn"})
  public void shouldCallMockedServiceWithTemperature17() {
    // given
    String city = "Berlin-Tempelhof";
    mockedBackend.response("response_temperature_17.xml", city);

    Map<String, Object> variables = new HashMap<>();
    variables.put("base_url", MOCKED_BASE_URL);
    variables.put("service_path", MOCKED_SERVICE_PATH);
    variables.put("soap_action", MOCKED_SOAP_ACTION);

    variables.put("city", city);
    variables.put("country", "Germany");

    // when
    runtimeService.startProcessInstanceByKey("weatherForecast", variables);

    // then
    Task task = taskService.createTaskQuery().singleResult();
    Assert.assertNotNull(task);

    String temperature = (String) taskService.getVariable(task.getId(), "temperature");
    Assert.assertEquals("17", temperature);
    Assert.assertEquals("UserTask_2", task.getTaskDefinitionKey());

  }

  @Test
  @Deployment(resources={"invokeSoapService.bpmn"})
  public void shouldCallMockedServiceWithTemperature20() {
    // given
    String city = "Munich";
    mockedBackend.response("response_temperature_20.xml", city);

    Map<String, Object> variables = new HashMap<>();
    variables.put("base_url", MOCKED_BASE_URL);
    variables.put("service_path", MOCKED_SERVICE_PATH);
    variables.put("soap_action", MOCKED_SOAP_ACTION);

    variables.put("city", city);
    variables.put("country", "Germany");

    // when
    runtimeService.startProcessInstanceByKey("weatherForecast", variables);

    // then
    Task task = taskService.createTaskQuery().singleResult();
    Assert.assertNotNull(task);

    String temperature = (String) taskService.getVariable(task.getId(), "temperature");
    Assert.assertEquals("20", temperature);
    Assert.assertEquals("UserTask_1", task.getTaskDefinitionKey());
  }

}
