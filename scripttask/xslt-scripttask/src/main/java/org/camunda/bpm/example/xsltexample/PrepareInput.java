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
package org.camunda.bpm.example.xsltexample;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.commons.utils.IoUtil;

/**
 * @author Stefan Hentschel.
 */
public class PrepareInput implements JavaDelegate {

  @Override
  public void execute(DelegateExecution delegateExecution) throws Exception {

    // load xml file as string
    String xmlData = IoUtil.fileAsString("org/camunda/bpm/example/xsltexample/example.xml");

    // output for showing the input data
    System.out.println("##################################### INPUT - example.xml #####################################");
    System.out.println(xmlData);

    // empty lines for better readability on console
    System.out.println();
    System.out.println();

    // saving input in a variable
    delegateExecution.setVariable("customers", xmlData);
  }
}
