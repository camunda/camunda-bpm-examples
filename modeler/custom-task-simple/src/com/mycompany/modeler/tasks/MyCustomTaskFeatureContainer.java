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
