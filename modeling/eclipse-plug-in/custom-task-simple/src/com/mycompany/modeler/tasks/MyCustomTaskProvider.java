package com.mycompany.modeler.tasks;

import org.camunda.bpm.modeler.core.features.api.container.IFeatureContainer;
import org.camunda.bpm.modeler.plugin.AbstractCustomTaskProvider;
import org.camunda.bpm.modeler.plugin.palette.IPaletteIntegration;
import org.camunda.bpm.modeler.plugin.palette.PaletteIntegration;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.ui.views.properties.tabbed.ISection;

public class MyCustomTaskProvider extends AbstractCustomTaskProvider {

	@Override
	public String getId() {
		return "mycompany.myCustomTask";
	}

	@Override
	public String getTaskName() {
		return PluginConstants.getMyCustomTaskName();
	}

	@Override
	public boolean appliesTo(EObject eObject) {
		return PluginConstants.isMyCustomTask(eObject);
	}
	
	@Override
	public ISection getTabSection() {
		return new MyCustomTaskTabSection();
	}
	
	@Override
	public IFeatureContainer getFeatureContainer() {
		return new MyCustomTaskFeatureContainer();
	}
	
	@Override
	public IPaletteIntegration getPaletteIntegration() {
		return PaletteIntegration.intoCompartmentNamed("My Company");
	}
}
