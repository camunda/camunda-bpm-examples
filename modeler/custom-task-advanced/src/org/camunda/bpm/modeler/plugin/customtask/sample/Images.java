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
