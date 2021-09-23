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
package org.camunda.bpm.example.queryexample;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.commons.utils.IoUtil;
import org.camunda.templateengines.XQueryOperator;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

/**
 * @author Thomas Skjolberg
 */
public class XQueryExampleTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  protected static final String TRANSFORM = "/org/camunda/bpm/example/xqueryexample/example.xquery";
  protected static final String INPUT_1 = "org/camunda/bpm/example/xqueryexample/example_skills.xml";
  protected static final String INPUT_2 = "org/camunda/bpm/example/xqueryexample/example_names.xml";

  protected XQueryOperator variableXQueryOperator;

  @Rule
  public ExpectedException expectedException = ExpectedException.none();

  @Before
  public void load() throws Exception {
    variableXQueryOperator = XQueryOperator.builder().withStylesheetResource(TRANSFORM).build();
  }

  @Test
  @Deployment(resources = { "xquery-example.bpmn" })
  public void shouldTransformScriptlet() {
    RuntimeService runtimeService = processEngineRule.getRuntimeService();
    HistoryService historyService = processEngineRule.getHistoryService();

    // add variables
    Map<String, Object> variables = new HashMap<>();

    variables.put("skills", IoUtil.fileAsString(INPUT_1));
    variables.put("names", IoUtil.fileAsString(INPUT_2));

    // start process instance
    runtimeService.startProcessInstanceByKey("xquery-example", variables);

    // get variable which contains our xmlOutput after transformation
    String output = (String) historyService.createHistoricVariableInstanceQuery()
        .variableName("xmlOutput")
        .singleResult()
        .getValue();

    System.out.println("Transform result:");
    System.out.println(output);

    String expected = IoUtil.fileAsString("expected_result.xml");

    assertThat(output).isXmlEqualTo(expected);
  }

  @Test
  public void shouldTransform() throws Exception {
    String skillsAsString = IoUtil.fileAsString(INPUT_1);
    String namesAsString = IoUtil.fileAsString(INPUT_2);
    String output = variableXQueryOperator.evaluateToString("skills", skillsAsString, "names", namesAsString);

    System.out.println("Transform result:");
    System.out.println(output);

    String expected = IoUtil.fileAsString("expected_result.xml");

    assertThat(output).isXmlEqualTo(expected);
  }
}
