package org.camunda.bpm.spring.boot.example.web;

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.rest.dto.repository.ProcessDefinitionDto;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = { RestApplication.class, CamundaBpmRestIT.RestConfig.class}, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
public class CamundaBpmRestIT {

  @Autowired
  private TestRestTemplate testRestTemplate;

  @Autowired
  private IdentityService identityService;

  @Test
  public void processDefinitionTest() {
    final ResponseEntity<Object> forEntity = testRestTemplate.getForEntity("/rest/engine/{engineName}/process-definition", Object.class, "default");

    ResponseEntity<ProcessDefinitionDto[]> entity = testRestTemplate.getForEntity("/rest/engine/{engineName}/process-definition", ProcessDefinitionDto[].class,
        "default");
    assertEquals(HttpStatus.OK, entity.getStatusCode());
    assertEquals("Sample", entity.getBody()[0].getKey());
  }

  @TestConfiguration
  protected static class RestConfig {

    @Value("${security.user.password}")
    private String password;

    @Bean
    public RestTemplateBuilder restTemplateBuilder() {
      return new RestTemplateBuilder().basicAuthorization("user", password);
    }

  }
}
