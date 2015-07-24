/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

package org.camunda.bpm.example.modelapi;

import java.util.List;

import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.Rule;
import org.junit.Test;

import static org.assertj.core.api.Assertions.*;

public class TransformListenerCustomElementsTest {

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  /**
   * Strongly typed access to custom elements from a transform listener.
   */
  @Test
  public void findElementById() {
    // when the case is deployed
    Deployment deployment = processEngineRule
      .getRepositoryService()
      .createDeployment()
      .addClasspathResource("case.cmmn")
      .deploy();

    // then the transform listener has processed the custom elements successfully
    List<KPIElement> parseKpiElements = KPITransformListener.PARSED_KPI_ELEMENTS;
    assertThat(parseKpiElements).hasSize(2);
    assertThat(parseKpiElements.get(0).getDescription()).isEqualTo("Average time in progress");
    assertThat(parseKpiElements.get(1).getDescription()).isEqualTo("Average time from ENABLED to ACTIVE");

    // clean up
    processEngineRule.getRepositoryService().deleteDeployment(deployment.getId());
  }

}
