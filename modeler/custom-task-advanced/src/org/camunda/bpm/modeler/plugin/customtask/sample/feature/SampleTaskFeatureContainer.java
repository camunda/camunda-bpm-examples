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
package org.camunda.bpm.modeler.plugin.customtask.sample.feature;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.camunda.bpm.modeler.core.features.activity.task.AbstractCreateTaskFeature;
import org.camunda.bpm.modeler.core.features.api.IDecorateFeature;
import org.camunda.bpm.modeler.core.preferences.ShapeStyle;
import org.camunda.bpm.modeler.core.utils.StyleUtil;
import org.camunda.bpm.modeler.plugin.customtask.sample.Images;
import org.camunda.bpm.modeler.plugin.customtask.sample.PluginConstants;
import org.camunda.bpm.modeler.ui.features.activity.task.AbstractTaskDecorateFeature;
import org.camunda.bpm.modeler.ui.features.activity.task.ServiceTaskFeatureContainer;
import org.eclipse.bpmn2.Bpmn2Package;
import org.eclipse.bpmn2.ServiceTask;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.graphiti.features.ICreateFeature;
import org.eclipse.graphiti.features.IFeatureProvider;
import org.eclipse.graphiti.features.context.ICreateContext;
import org.eclipse.graphiti.features.custom.ICustomFeature;
import org.eclipse.graphiti.mm.algorithms.RoundedRectangle;
import org.eclipse.graphiti.util.IColorConstant;

/**
 * The {@link FeatureProvider} that provides the features for our sample task.
 * 
 * @author nico.rehwaldt
 */
public class SampleTaskFeatureContainer extends ServiceTaskFeatureContainer {
	
	private static final String TASK_ICON = Images.IMG_16_SAMPLE_TASK;

	@Override
	public boolean canApplyTo(Object o) {
		return PluginConstants.isMyService((EObject) o);
	}
	
	@Override
	public ICreateFeature getCreateFeature(IFeatureProvider fp) {
		
		return new AbstractCreateTaskFeature<ServiceTask>(fp, "Sample Task", "Some Sample Task") {
			
			@Override
			protected String getStencilImageId() {
				return TASK_ICON;
			}

			@Override
			public EClass getBusinessObjectClass() {
				return Bpmn2Package.eINSTANCE.getServiceTask();
			}
			
			@Override
			public ServiceTask createBusinessObject(ICreateContext context) {
				ServiceTask serviceTask = super.createBusinessObject(context);
				serviceTask.eSet(PluginConstants.CLASS_STRUCTURAL_FEATURE, PluginConstants.CLASS_VALUE);
				return serviceTask;
			}
		};
	}
	
	@Override
	public IDecorateFeature getDecorateFeature(IFeatureProvider fp) {
		return new AbstractTaskDecorateFeature(fp) {
			
			@Override
			protected void decorate(RoundedRectangle decorateContainer) {
				super.decorate(decorateContainer);
				
				// apply custom color style
				StyleUtil.applyStyle(decorateContainer, "ServiceTask.custom.style", new ShapeStyle(IColorConstant.LIGHT_GREEN), false);
			}

			@Override
			protected String getIconId() {
				return TASK_ICON;
			}
		};
	}
	
	@Override
	public ICustomFeature[] getCustomFeatures(IFeatureProvider fp) {

		List<ICustomFeature> features = new ArrayList<ICustomFeature>(Arrays.asList(super.getCustomFeatures(fp)));
		
		features.add(new CustomTaskInfoFeature(fp));
		
		return features.toArray(new ICustomFeature[0]);
	}
}