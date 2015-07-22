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
package org.camunda.bpm.example.modelapi;

import org.camunda.bpm.model.cmmn.Cmmn;
import org.camunda.bpm.model.xml.ModelBuilder;

/**
 * @author Thorben Lindhauer
 *
 */
public class CustomCmmn extends Cmmn {

  public static final String CUSTOM_NAMESPACE = "http://camunda.org/cmmn/examples";

  @Override
  protected void doRegisterTypes(ModelBuilder modelBuilder) {
    super.doRegisterTypes(modelBuilder);

    // register the KPI element type so that XML elements are parsed to instances of KPIElement
    KPIElementImpl.registerType(modelBuilder);

  }
}
