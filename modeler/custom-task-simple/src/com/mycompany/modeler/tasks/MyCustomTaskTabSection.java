/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.mycompany.modeler.tasks;

import org.camunda.bpm.modeler.core.property.AbstractTabSection;
import org.camunda.bpm.modeler.ui.property.tabs.AbstractTabCompositeFactory;
import org.camunda.bpm.modeler.ui.property.tabs.util.FieldInjectionUtil;
import org.camunda.bpm.modeler.ui.property.tabs.util.PropertyUtil;
import org.eclipse.bpmn2.BaseElement;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.graphiti.ui.platform.GFPropertySection;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Text;

public class MyCustomTaskTabSection extends AbstractTabSection {

	@Override
	protected Composite createCompositeForObject(Composite parent, EObject businessObject) {
		return new MyCustomTaskTabSectionFactory(this, parent).createCompositeForBusinessObject((BaseElement) businessObject);
	}
	
	private static class MyCustomTaskTabSectionFactory extends AbstractTabCompositeFactory<BaseElement> {

		public MyCustomTaskTabSectionFactory(GFPropertySection section, Composite parent) {
			super(section, parent);
		}
		
		@Override
		public Composite createCompositeForBusinessObject(BaseElement baseElement) {

			Text endpointText = FieldInjectionUtil.createLongStringText(
				section, parent, "Endpoint", "endpoint", baseElement);

			PropertyUtil.attachNoteWithLink(section, endpointText, 
				"For more information search <a href=\"http://google.com\">google</a>");

			return parent;
		}
	}
}
