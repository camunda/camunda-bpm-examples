/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
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

  private static String transform = "/org/camunda/bpm/example/xqueryexample/example.xquery";
  private static String input1 = "org/camunda/bpm/example/xqueryexample/example_skills.xml";
  private static String input2 = "org/camunda/bpm/example/xqueryexample/example_names.xml";

  private XQueryOperator variableXQueryOperator;

  @Rule
  public ExpectedException expectedException = ExpectedException.none();

  @Before
  public void load() throws Exception {
    variableXQueryOperator = XQueryOperator.builder().withStylesheetResource(transform).build();
  }

  @Test
  @Deployment(resources = { "xquery-example.bpmn" })
  public void testScriptletTransform() {
    RuntimeService runtimeService = processEngineRule.getRuntimeService();
    HistoryService historyService = processEngineRule.getHistoryService();

    // add variables
    Map<String, Object> variables = new HashMap<String, Object>();

    variables.put("skills", IoUtil.fileAsString(input1));
    variables.put("names", IoUtil.fileAsString(input2));

    // start process instance
    runtimeService.startProcessInstanceByKey("xquery-example", variables);

    // get variable which contains our xmlOutput after transformation
    String output = (String) historyService.createHistoricVariableInstanceQuery().variableName("xmlOutput").singleResult().getValue();

    System.out.println("Transform result:");
    System.out.println(output);

    String expected = IoUtil.fileAsString("expected_result.xml");

    assertThat(output).isXmlEqualTo(expected);
  }

  @Test
  public void testTransform() throws Exception {
    String output = variableXQueryOperator.evaluateToString("skills", IoUtil.fileAsString(input1), "names", IoUtil.fileAsString(input2));

    System.out.println("Transform result:");
    System.out.println(output);

    String expected = IoUtil.fileAsString("expected_result.xml");

    assertThat(output).isXmlEqualTo(expected);
  }
}
