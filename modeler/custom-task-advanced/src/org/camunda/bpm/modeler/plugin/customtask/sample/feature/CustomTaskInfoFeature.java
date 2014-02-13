package org.camunda.bpm.modeler.plugin.customtask.sample.feature;

import org.camunda.bpm.modeler.core.features.api.container.IFeatureContainer;
import org.camunda.bpm.modeler.ui.Images;
import org.eclipse.graphiti.features.IFeatureProvider;
import org.eclipse.graphiti.features.context.ICustomContext;
import org.eclipse.graphiti.features.custom.AbstractCustomFeature;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.swt.widgets.Display;

/**
 * A custom task feature that displays messages to the user.
 * 
 * Must be returned via {@link IFeatureContainer#getCustomFeatures(IFeatureProvider)}.
 * 
 * @author nico.rehwaldt
 */
public class CustomTaskInfoFeature extends AbstractCustomFeature {

	public CustomTaskInfoFeature(IFeatureProvider fp) {
		super(fp);
	}

	@Override
	public String getName() {
		return "Show Information";
	}
	
	@Override
	public boolean canExecute(ICustomContext context) {
		return true;
	}
	
	@Override
	public String getImageId() {
		return Images.IMG_16_ACTION;
	}
	
	@Override
	public void execute(ICustomContext context) {
		MessageDialog.openInformation(Display.getDefault().getActiveShell(), "Task Info", "This informs you well. Not");
	}
}
