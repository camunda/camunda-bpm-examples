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
package org.camunda.bpm.quickstart.ejb;

import java.util.logging.Logger;

import javax.ejb.Stateless;
import javax.inject.Named;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;

/**
 * This is an Ejb which is invoked form a Service task
 *
 */
@Named("exampleBean")
@Stateless
public class EjbJavaDelegate implements JavaDelegate {

  private final static Logger LOGGER = Logger.getLogger(EjbJavaDelegate.class.getName());

  public void execute(DelegateExecution execution) throws Exception {

    LOGGER.info("\n\n\n This is a @Stateless Ejb component invoked from a BPMN 2.0 process \n\n\n");

  }

}
