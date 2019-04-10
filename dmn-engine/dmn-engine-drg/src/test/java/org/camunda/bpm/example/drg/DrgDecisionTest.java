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
package org.camunda.bpm.example.drg;

import static org.assertj.core.api.Assertions.assertThat;

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

public class DrgDecisionTest {

  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();

  public DmnEngine dmnEngine;
  public DmnDecision decision;

  @Before
  public void parseDecision() {
    InputStream inputStream = DrgDecisionTest.class
      .getResourceAsStream("dinnerDecisions.dmn");
    dmnEngine = dmnEngineRule.getDmnEngine();
    decision = dmnEngine.parseDecision("beverages", inputStream);
  }

  @Test
  public void shouldServeGuiness() {
    VariableMap variables = Variables
      .putValue("season", "Spring")
      .putValue("guestCount", 10)
      .putValue("guestsWithChildren", false);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

    assertThat(result.collectEntries("beverages"))
      .hasSize(2)
      .contains("Guiness", "Water");
  }

  @Test
  public void shouldServeBordeauxAndAppleJuice() {
    VariableMap variables = Variables
      .putValue("season", "Winter")
      .putValue("guestCount", 7)
      .putValue("guestsWithChildren", true);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

    assertThat(result.collectEntries("beverages"))
      .hasSize(3)
      .contains("Bordeaux", "Apple Juice", "Water");
  }

  @Test
  public void shouldServePinotNoir() {
    VariableMap variables = Variables
      .putValue("season", "Summer")
      .putValue("guestCount", 14)
      .putValue("guestsWithChildren", false);

    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

    assertThat(result.collectEntries("beverages"))
      .hasSize(2)
      .contains("Pinot Noir", "Water");
  }

}