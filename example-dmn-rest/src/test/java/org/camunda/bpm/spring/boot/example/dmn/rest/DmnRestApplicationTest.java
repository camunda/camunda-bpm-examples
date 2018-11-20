/*
 * Copyright © 2013 - 2018 camunda services GmbH and various authors (info@camunda.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
package org.camunda.bpm.spring.boot.example.dmn.rest;

import static org.assertj.core.api.Assertions.assertThat;

import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.impl.util.json.JSONArray;
import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.spring.boot.starter.property.CamundaBpmProperties;
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
  public void deploys_orderDiscount_dmn() {
    final DecisionDefinition definition = repositoryService.createDecisionDefinitionQuery().decisionDefinitionKey(CHECK_ORDER).singleResult();
    assertThat(definition).isNotNull();
  }

  @Test
  public void evaluate_checkOrder() throws InterruptedException {
    String JSONInput = "{\n" + "  \"variables\" : {\n" + "    \"status\" : { \"value\" : \"silver\", \"type\" : \"String\" },\n"
        + "    \"sum\" : { \"value\" : 900, \"type\" : \"Integer\" }\n" + "  }\n" + "}\n";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<String> request = new HttpEntity<String>(JSONInput, headers);

    final String check = testRestTemplate.postForObject("/rest/engine/{engineName}/decision-definition/key/{key}/evaluate", request, String.class,
        camundaBpmProperties.getProcessEngineName(), CHECK_ORDER);

    assertThat(new JSONArray(check).getJSONObject(0).getJSONObject("result").getString("value")).isEqualTo("ok");

  }

}
