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

import org.camunda.bpm.modeler.core.features.activity.task.AbstractCreateTaskFeature;
import org.camunda.bpm.modeler.ui.Images;
import org.camunda.bpm.modeler.ui.features.activity.task.ServiceTaskFeatureContainer;
import org.eclipse.bpmn2.Bpmn2Package;
import org.eclipse.bpmn2.ServiceTask;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.graphiti.features.ICreateFeature;
import org.eclipse.graphiti.features.IFeatureProvider;
import org.eclipse.graphiti.features.context.ICreateContext;

public class MyCustomTaskFeatureContainer extends ServiceTaskFeatureContainer {

	@Override
	public boolean canApplyTo(Object o) {
		return o instanceof EObject && PluginConstants.isMyCustomTask((EObject) o);
	}

	@Override
	public ICreateFeature getCreateFeature(IFeatureProvider fp) {
		String taskName = PluginConstants.getMyCustomTaskName();
		String createDescription = "A task that talks to an endpoint";
		
		return new AbstractCreateTaskFeature<ServiceTask>(fp, taskName, createDescription) {

			@Override
			protected String getStencilImageId() {
				return Images.IMG_16_SERVICE_TASK;
			}
			
			@Override
			public ServiceTask createBusinessObject(ICreateContext context) {
				ServiceTask serviceTask = super.createBusinessObject(context);
				
				serviceTask.eSet(PluginConstants.CLASS_STRUCTURAL_FEATURE, PluginConstants.CLASS_VALUE);
				
				return serviceTask;
			}
			
			@Override
			public EClass getBusinessObjectClass() {
				return Bpmn2Package.eINSTANCE.getServiceTask();
			}
		};
	}
}
