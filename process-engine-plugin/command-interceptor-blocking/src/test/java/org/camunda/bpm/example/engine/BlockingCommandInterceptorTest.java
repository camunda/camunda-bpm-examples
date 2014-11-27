/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example.engine;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration;
import org.camunda.bpm.example.engine.cmd.EndBlockingCmd;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 * @author Daniel Meyer
 *
 */
public class BlockingCommandInterceptorTest {

  protected static ProcessEngine processEngine;

  @BeforeClass
  public static void createProcessEngine() {
    StandaloneInMemProcessEngineConfiguration configuration = new StandaloneInMemProcessEngineConfiguration();
    configuration.getProcessEnginePlugins().add(new BlockingCommandInterceptorPlugin());
    processEngine = configuration.buildProcessEngine();
  }

  @Test
  public void testBlockingInterceptor() throws Exception {

    // initially the process engine blocks all commands
    try {
      processEngine.getRepositoryService().createDeploymentQuery().list();
      Assert.fail("Exception expected");
    }
    catch(BlockedCommandException e) {
      // expected
    }

    // stop blocking requests
    ((ProcessEngineConfigurationImpl)processEngine.getProcessEngineConfiguration()).getCommandExecutorTxRequired()
      .execute(new EndBlockingCmd());

    // now we can execute the query
    try {
      Assert.assertEquals(0, processEngine.getRepositoryService().createDeploymentQuery().count());
    }
    catch(BlockedCommandException e) {
      Assert.fail("Did not expect an exception");
    }
  }


}
