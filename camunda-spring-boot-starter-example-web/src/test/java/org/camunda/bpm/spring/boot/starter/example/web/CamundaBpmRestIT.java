package org.camunda.bpm.spring.boot.starter.example.web;

import static org.junit.Assert.assertEquals;

import org.camunda.bpm.engine.rest.dto.repository.ProcessDefinitionDto;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = { RestApplication.class })
@WebAppConfiguration
@IntegrationTest({ "server.port=0" })
@DirtiesContext
public class CamundaBpmRestIT {

  @Value("${local.server.port}")
  private int port;

  @Value("${security.user.password}")
  private String password;

  @Test
  public void processDefinitionTest() {
    ResponseEntity<ProcessDefinitionDto[]> entity = new TestRestTemplate("user", password)
        .getForEntity("http://localhost:{port}/rest/engine/{engineName}/process-definition", ProcessDefinitionDto[].class, port, "default");
    assertEquals(HttpStatus.OK, entity.getStatusCode());
    assertEquals("Sample", entity.getBody()[0].getKey());
  }

}
