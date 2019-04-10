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

import java.util.HashMap;
import java.util.Map;

import org.eclipse.graphiti.ui.platform.AbstractImageProvider;

/**
 * Returns the images provided by this plugin.
 * 
 * @author nico.rehwaldt
 */
public class Images extends AbstractImageProvider {

	public static final String IMG_16_SAMPLE_TASK = Images.class.getName() + "SampleTask.16";
	
	private static Map<String, String> IMAGE_MAP;
	
	static {
		IMAGE_MAP = new HashMap<String, String>();
		IMAGE_MAP.put(IMG_16_SAMPLE_TASK, "icons/16/sampleTask.png");
	}
	
	//// helpers /////////////////////
	
	@Override
	protected void addAvailableImages() {
		for (Map.Entry<String, String> entry : IMAGE_MAP.entrySet()) {
			addImageFilePath(entry.getKey(), entry.getValue());
		}
	}
}
