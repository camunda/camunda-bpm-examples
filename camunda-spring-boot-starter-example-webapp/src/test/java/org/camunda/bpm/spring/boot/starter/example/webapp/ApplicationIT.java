package org.camunda.bpm.spring.boot.starter.example.webapp;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

// FIXME did bot run with sb1.4
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = { WebappExampleApplication.class })
@WebAppConfiguration
@IntegrationTest({ "server.port=0" })
public class ApplicationIT {

  @Test
  public void startUpTest() {
    // context init test
  }

}
