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
package org.camunda.bpm.modeler.plugin.customtask.sample;

import org.camunda.bpm.modeler.core.features.api.container.IFeatureContainer;
import org.camunda.bpm.modeler.plugin.AbstractCustomTaskProvider;
import org.camunda.bpm.modeler.plugin.ICustomTaskProvider;
import org.camunda.bpm.modeler.plugin.customtask.sample.feature.SampleTaskFeatureContainer;
import org.camunda.bpm.modeler.plugin.customtask.sample.properties.SampleTaskTabSection;
import org.camunda.bpm.modeler.plugin.palette.IPaletteIntegration;
import org.camunda.bpm.modeler.plugin.palette.PaletteIntegration;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.ui.views.properties.tabbed.ISection;

public class SampleTaskProvider extends AbstractCustomTaskProvider {
	
	@Override
	public String getId() {
		return "sample.task";
	}

	@Override
	public String getTaskName() {
		return "Sample Task";
	}
	
	@Override
	public IFeatureContainer getFeatureContainer() {
		return new SampleTaskFeatureContainer();
	}

	@Override
	public IPaletteIntegration getPaletteIntegration() {
		return PaletteIntegration.intoCompartmentNamed("My Category");
	}
	
	@Override
	public ISection getTabSection() {
		return new SampleTaskTabSection();
	}

	@Override
	public boolean appliesTo(EObject eObject) {
		return PluginConstants.isMyService(eObject);
	}
}
