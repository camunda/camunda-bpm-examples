package org.camunda.bpm.spring.boot.starter.test.helper;

import org.camunda.bpm.engine.ProcessEngineConfiguration;
import org.camunda.bpm.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.engine.test.mock.MockExpressionManager;
import org.junit.Rule;
import org.junit.runner.RunWith;

@RunWith(ProcessEngineRuleRunner.class)
public abstract class AbstractProcessEngineRuleTest {

  private final ProcessEngineConfiguration processEngineConfiguration = new StandaloneInMemProcessEngineConfiguration() {
    {
      jobExecutorActivate = false;
      expressionManager = new MockExpressionManager();
      databaseSchemaUpdate = DB_SCHEMA_UPDATE_DROP_CREATE;
    }
  };

  @Rule
  public final ProcessEngineRule processEngine = new ProcessEngineRule(processEngineConfiguration.buildProcessEngine());

}
