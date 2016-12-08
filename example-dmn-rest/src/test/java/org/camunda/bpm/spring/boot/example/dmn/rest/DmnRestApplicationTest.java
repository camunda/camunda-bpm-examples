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
