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
package org.camunda.bpm.example.usertask.embedded.serialized.delegate;

import java.util.logging.Logger;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.example.usertask.embedded.serialized.model.CustomerData;

/**
 * @author Daniel Meyer
 *
 */
public class ProcessRating implements JavaDelegate {

  private final static Logger LOG = Logger.getLogger(ProcessRating.class.getName());

  public void execute(DelegateExecution execution) throws Exception {

    CustomerData customerData = (CustomerData) execution.getVariable("customerData");

    LOG.info("\n\n\n    processing rating for customer "+customerData+"\n\n\n");

  }

}
