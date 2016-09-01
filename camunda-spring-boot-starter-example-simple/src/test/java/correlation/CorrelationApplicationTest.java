package correlation;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngineConfiguration;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.spring.ProcessEngineFactoryBean;
import org.camunda.bpm.engine.spring.SpringProcessEngineConfiguration;
import org.camunda.bpm.engine.task.Task;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowire;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.DataSourceFactory;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.slf4j.LoggerFactory.getLogger;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = CorrelationApplicationTest.TestConfig.class)
public class CorrelationApplicationTest {

  private static Logger logger = LoggerFactory.getLogger(CorrelationApplicationTest.class);


  public static class TestConfig {

    @Bean
    public ProcessEngineFactoryBean processEngineFactoryBean(SpringProcessEngineConfiguration processEngineConfiguration) {
      final ProcessEngineFactoryBean factoryBean = new ProcessEngineFactoryBean();
      factoryBean.setProcessEngineConfiguration(processEngineConfiguration);
      return factoryBean;
    }

    @Bean
    public SpringProcessEngineConfiguration processEngineConfiguration() {
      return new SpringProcessEngineConfiguration(){{
        this.dataSource = new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).build();
        DataSourceTransactionManager t = new DataSourceTransactionManager();
        t.setDataSource(this.dataSource);
        this.transactionManager = t;
        this.databaseSchemaUpdate = DB_SCHEMA_UPDATE_DROP_CREATE;
      }};
    }
    @Bean
    public JavaDelegate sendMessage() {
      return new JavaDelegate() {

        @Transactional
        @Override
        public void execute(DelegateExecution execution) throws Exception {
          try {
            execution.getProcessEngineServices().getRuntimeService().correlateMessage("foo");
          }  catch (Exception e) {
            logger.info("========================================== ignoring failed correlation {}", e.getMessage());
          }
        }
      };
    }
  }

  @Autowired
  private ProcessEngine processEngine;

  @Test
  public void name() throws Exception {
    processEngine.getRepositoryService().createDeployment().addClasspathResource("bpmn/CorrelateMessage.bpmn").deploy();

    final ProcessInstance instance = processEngine.getRuntimeService().startProcessInstanceByKey("Process_12");

    final Task task = processEngine.getTaskService().createTaskQuery().processInstanceId(instance.getId()).singleResult();
    processEngine.getTaskService().complete(task.getId());


  }
}
