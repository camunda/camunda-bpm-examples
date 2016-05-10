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
