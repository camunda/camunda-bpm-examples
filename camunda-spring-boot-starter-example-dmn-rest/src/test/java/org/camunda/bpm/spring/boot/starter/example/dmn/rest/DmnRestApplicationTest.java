package org.camunda.bpm.spring.boot.starter.example.dmn.rest;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.impl.util.json.JSONArray;
import org.camunda.bpm.engine.impl.util.json.JSONObject;
import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.spring.boot.starter.CamundaBpmProperties;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JacksonJsonParser;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.slf4j.LoggerFactory.getLogger;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = {DmnRestApplication.class})
@WebAppConfiguration
@IntegrationTest({"server.port=0"})
@DirtiesContext
public class DmnRestApplicationTest {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Result {
    public String type;
    public String value;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Check {
    public Result result;
    public Result reason;
  }





  private static final String CHECK_ORDER = "checkOrder";

  @Value("${local.server.port}")
  private int port;

  @Autowired
  private CamundaBpmProperties camundaBpmProperties;

  private final Logger logger = getLogger(this.getClass());

  @Autowired
  private RepositoryService repositoryService;

  @Test
  public void deploys_orderDiscount_dmn() {
    final DecisionDefinition definition = repositoryService.createDecisionDefinitionQuery()
      .decisionDefinitionKey(CHECK_ORDER)
      .singleResult();
    assertThat(definition).isNotNull();
  }

  @Test
  public void evaluate_checkOrder() throws InterruptedException {
    String url = String.format("http://localhost:%d/rest/engine/%s/decision-definition/key/%s/evaluate",
      port,
      camundaBpmProperties.getProcessEngineName(),
      CHECK_ORDER);

    String JSONInput = "{\n" +
      "  \"variables\" : {\n" +
      "    \"status\" : { \"value\" : \"silver\", \"type\" : \"String\" },\n" +
      "    \"sum\" : { \"value\" : 900, \"type\" : \"Integer\" }\n" +
      "  }\n" +
      "}\n";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity request= new HttpEntity(JSONInput, headers);

    final String check = new TestRestTemplate().postForObject(url, request, String.class);

    assertThat(new JSONArray(check).getJSONObject(0)
      .getJSONObject("result")
      .getString("value")).isEqualTo("ok");

  }

}
