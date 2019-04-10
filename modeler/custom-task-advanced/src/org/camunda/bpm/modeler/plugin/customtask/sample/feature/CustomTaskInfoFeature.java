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
