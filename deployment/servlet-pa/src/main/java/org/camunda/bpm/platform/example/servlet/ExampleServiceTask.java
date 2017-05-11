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
package org.camunda.bpm.platform.example.servlet;

import java.util.logging.Logger;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.model.bpmn.instance.FlowElement;

/**
 * This is an implementation of the {@link JavaDelegate} interface. Implementations of that class can
 * be directly invoked by the process engine while executing a BPMN process.
 *
 * @author Daniel Meyer
 *
 */
public class ExampleServiceTask implements JavaDelegate {

  public final static Logger LOGGER = Logger.getLogger(ExampleServiceTask.class.getName());

  /**
   * this method will be invoked by the process engine when the service task is executed.
   */
  public void execute(DelegateExecution execution) throws Exception {

    // use camunda model API to get current BPMN element
    FlowElement serviceTask = execution.getBpmnModelElementInstance();

    // log status
    LOGGER.info("\n\n\nService Task '"+serviceTask.getName() +"' is invoked!\n\n\n");

  }

}
