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
package org.camunda.bpm.spring.boot.example.dmn.rest;

import static org.assertj.core.api.Assertions.assertThat;

import org.camunda.bpm.engine.RepositoryService;

import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.spring.boot.starter.property.CamundaBpmProperties;
import org.json.JSONArray;
import org.json.JSONException;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = { DmnRestApplication.class }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class DmnRestApplicationTest {

  private static final String CHECK_ORDER = "checkOrder";

  @Autowired
  private TestRestTemplate testRestTemplate;

  @Autowired
  private CamundaBpmProperties camundaBpmProperties;

  @Autowired
  private RepositoryService repositoryService;

  @Test
  public void deploysOrderDiscountDmn() {
    final DecisionDefinition definition = repositoryService.createDecisionDefinitionQuery().decisionDefinitionKey(CHECK_ORDER).singleResult();
    assertThat(definition).isNotNull();
  }

  @Test
  public void evaluateCheckOrder() throws JSONException {
    String JSONInput = "{\n" + "  \"variables\" : {\n" + "    \"status\" : { \"value\" : \"silver\", \"type\" : \"String\" },\n"
        + "    \"sum\" : { \"value\" : 900, \"type\" : \"Integer\" }\n" + "  }\n" + "}\n";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<String> request = new HttpEntity<String>(JSONInput, headers);

    final String check = testRestTemplate.postForObject("/engine-rest/engine/{engineName}/decision-definition/key/{key}/evaluate", request, String.class,
        camundaBpmProperties.getProcessEngineName(), CHECK_ORDER);

    assertThat(new JSONArray(check).getJSONObject(0).getJSONObject("result").getString("value")).isEqualTo("ok");
  }

}
