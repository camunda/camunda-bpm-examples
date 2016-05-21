package org.camunda.bpm.spring.boot.starter.example.simple;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.junit.rules.TestRule;
import org.junit.runner.notification.RunNotifier;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.junit.runners.model.InitializationError;

public class ProcessEngineRuleRunner extends BlockJUnit4ClassRunner {

  private final Collection<ProcessEngineRule> processEngineRules = new ArrayList<ProcessEngineRule>();

  public ProcessEngineRuleRunner(Class<?> klass) throws InitializationError {
    super(klass);
  }

  /*
   * (non-Javadoc)
   * 
   * @see
   * org.junit.runners.BlockJUnit4ClassRunner#getTestRules(java.lang.Object)
   */
  @Override
  protected List<TestRule> getTestRules(Object target) {
    List<TestRule> testRules = super.getTestRules(target);
    for (TestRule testRule : testRules) {
      if (testRule instanceof ProcessEngineRule) {
        processEngineRules.add((ProcessEngineRule) testRule);
      }
    }
    return testRules;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.junit.runners.ParentRunner#run(org.junit.runner.notification.
   * RunNotifier)
   */
  @Override
  public void run(RunNotifier notifier) {
    super.run(notifier);
    for (ProcessEngineRule processEngineRule : processEngineRules) {
      try {
        processEngineRule.getProcessEngine().close();
      } catch (Exception e) {
        // close quietly
      }
    }
  }

}
