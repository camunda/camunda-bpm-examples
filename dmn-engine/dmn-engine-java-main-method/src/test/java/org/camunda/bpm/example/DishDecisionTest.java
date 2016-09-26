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

package org.camunda.bpm.example;

import static org.junit.Assert.assertEquals;

import java.io.InputStream;

import org.camunda.bpm.dmn.engine.DmnDecision;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.dmn.engine.DmnEngine;
import org.camunda.bpm.dmn.engine.test.DmnEngineRule;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class DishDecisionTest {

  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();

  public DmnEngine dmnEngine;
  public DmnDecision decision;

  @Before
  public void parseDecision() {
    InputStream inputStream = DishDecisionTest.class.getResourceAsStream("dish-decision.dmn11.xml");
    dmnEngine = dmnEngineRule.getDmnEngine();
    decision = dmnEngine.parseDecision("decision", inputStream);
  }

  @Test
  public void shouldServeDryAgedInSpringForFewGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 4);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Dry Aged Gourmet Steak", result.getSingleResult().getSingleEntry());
  }

  @Test
  public void shouldServeSteakInSpringForSomeGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 7);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Steak", result.getSingleResult().getSingleEntry());
  }

  @Test
  public void shouldServeStewInSpringForManyGuests() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 20);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Stew", result.getSingleResult().getSingleEntry());
  }

}
