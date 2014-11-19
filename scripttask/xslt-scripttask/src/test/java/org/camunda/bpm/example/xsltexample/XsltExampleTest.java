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
package org.camunda.bpm.example.xsltexample;

import static org.assertj.core.api.Assertions.assertThat;

import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.commons.utils.IoUtil;
import org.junit.Rule;
import org.junit.Test;

/**
 * @author Stefan Hentschel.
 */
public class XsltExampleTest {
  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Test
  @Deployment(
    resources = {
      "xslt-example.bpmn"
    }
  )
  public void shouldTransformXml() {
    RuntimeService runtimeService = processEngineRule.getRuntimeService();
    HistoryService historyService = processEngineRule.getHistoryService();

    // start process instance
    runtimeService.startProcessInstanceByKey("xslt-example");

    // variable which contains our xmlOutput after transformation
    String output = (String) historyService
                                .createHistoricVariableInstanceQuery()
                                .variableName("xmlOutput")
                                .singleResult()
                                .getValue();

    String expected = IoUtil.fileAsString("expected_result.xml");

    assertThat(output).isXmlEqualTo(expected);
  }
}
