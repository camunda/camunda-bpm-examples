package org.camunda.bpm.spring.boot.example.web;

import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = { RestApplication.class }, webEnvironment = WebEnvironment.RANDOM_PORT, properties = "management.security.enabled:false")
public class CamundaBpmActuatorIT {

  private static final Logger LOGGER = LoggerFactory.getLogger(CamundaBpmActuatorIT.class);

  @Autowired
  private TestRestTemplate testRestTemplate;

  @Test
  public void jobExecutorHealthIndicatorTest() {
    final String body = getHealthBody();
    assertTrue("wrong body " + body, body.contains("jobExecutor\":{\"status\":\"UP\""));
  }

  @Test
  public void processEngineHealthIndicatorTest() {
    final String body = getHealthBody();
    assertTrue("wrong body " + body, body.contains("\"processEngine\":{\"status\":\"UP\",\"name\":\"default\"}"));
  }

  private String getHealthBody() {
    ResponseEntity<String> entity = testRestTemplate.getForEntity("/health", String.class);
    final String body = entity.getBody();
    LOGGER.info("body: {}", body);
    return body;
  }
}
