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

import org.camunda.bpm.model.xml.ModelBuilder;
import org.camunda.bpm.model.xml.impl.instance.ModelElementInstanceImpl;
import org.camunda.bpm.model.xml.impl.instance.ModelTypeInstanceContext;
import org.camunda.bpm.model.xml.type.ModelElementTypeBuilder;
import org.camunda.bpm.model.xml.type.ModelElementTypeBuilder.ModelTypeInstanceProvider;
import org.camunda.bpm.model.xml.type.attribute.Attribute;

/**
 * @author Thorben Lindhauer
 *
 */
public class KPIElementImpl extends ModelElementInstanceImpl implements KPIElement {

  public static final String ELEMENT_KPI = "kpi";
  public static final String ATTRIBUTE_DESCRIPTION = "description";

  protected static Attribute<String> descriptionAttribute;

  public KPIElementImpl(ModelTypeInstanceContext instanceContext) {
    super(instanceContext);
  }

  @Override
  public String getDescription() {
    return descriptionAttribute.getValue(this);
  }

  public static void registerType(ModelBuilder modelBuilder) {
    // declare a new element type
    ModelElementTypeBuilder typeBuilder =
      modelBuilder
        .defineType(KPIElement.class, ELEMENT_KPI)
        .namespaceUri(CustomCmmn.CUSTOM_NAMESPACE)
        .instanceProvider(new ModelTypeInstanceProvider<KPIElement>() {
          // factory for creating instances of KPIElement
          public KPIElement newInstance(ModelTypeInstanceContext instanceContext) {
            return new KPIElementImpl(instanceContext);
          }
        });

    // declare a "description" attribute for this element
    descriptionAttribute = typeBuilder.stringAttribute(ATTRIBUTE_DESCRIPTION)
      .namespace(CustomCmmn.CUSTOM_NAMESPACE)
      .build();

    typeBuilder.build();
  }


}
