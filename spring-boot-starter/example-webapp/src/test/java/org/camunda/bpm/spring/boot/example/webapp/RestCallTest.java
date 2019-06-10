package org.camunda.bpm.spring.boot.example.webapp;

import org.camunda.bpm.spring.boot.example.webapp.controller.ProcessController;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertTrue;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = {WebappExampleApplication.class, ProcessController.class}, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
public class RestCallTest {

    private static final Logger LOGGER = LoggerFactory.getLogger(RestCallTest.class);

    @Autowired
    private TestRestTemplate testRestTemplate;

    @Test
    public void startProcess() {
        LOGGER.info("Sending Http.GET request to /process/start/Sample ...");
        ResponseEntity<String> entity = testRestTemplate.getForEntity("/process/start/Sample", String.class);
        final String body = entity.getBody();
        assertTrue("Starting process failed " + body, body.equals("\"OK\""));
        LOGGER.info("body: {}", body);
    }


}
