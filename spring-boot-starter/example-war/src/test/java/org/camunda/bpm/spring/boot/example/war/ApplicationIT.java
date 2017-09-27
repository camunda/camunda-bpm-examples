package org.camunda.bpm.spring.boot.example.war;

import org.camunda.bpm.engine.ProcessEngine;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = { WebappExampleApplication.class }, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApplicationIT {

  @Autowired
  private ProcessEngine processEngine;

  @Test
  public void testEngineStartedAndProcessDeployed() {
    assertThat(processEngine.getRepositoryService().createProcessDefinitionQuery().processDefinitionName("Sample").count()).isEqualTo(1);
    final String source = processEngine.getRepositoryService().createDeploymentQuery().singleResult().getSource();
    assertThat(source).isNotNull();
    assertThat(source).isNotEmpty();
  }

}
