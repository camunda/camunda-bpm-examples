package org.camunda.bpm.nonarquillian;

import org.camunda.bpm.engine.impl.util.LogUtil;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineTestCase;

/**
 * Test case starting an in-memory database-backed Process Engine.
 */
public class InMemoryH2Test extends ProcessEngineTestCase {

  // enable more detailed logging
  static {
    LogUtil.readJavaUtilLoggingConfigFromClasspath();
  }

  /**
   * Just tests if the process definition is deployable.
   */
  @Deployment(resources = "support.bpmn")
  public void testParsingAndDeploymentSupport() {
    // nothing is done here, as we just want to check for exceptions during deployment
  }

  @Deployment(resources = "feature.bpmn")
  public void testParsingAndDeploymentFeature() {
    // nothing is done here, as we just want to check for exceptions during deployment
  }

}
