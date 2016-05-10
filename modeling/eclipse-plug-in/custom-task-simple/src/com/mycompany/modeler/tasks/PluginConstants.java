package com.mycompany.modeler.tasks;

import org.camunda.bpm.modeler.runtime.engine.model.ModelPackage;
import org.eclipse.bpmn2.ServiceTask;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EStructuralFeature;

/**
 * Constants for a the custom task "My Custom Task"
 * 
 * @author nico.rehwaldt
 */
public class PluginConstants {

	public static final EStructuralFeature CLASS_STRUCTURAL_FEATURE = ModelPackage.eINSTANCE.getDocumentRoot_Class();
	
	public static final String CLASS_VALUE = "com.mycompany.services.MyService";
	
	/**
	 * Returns true if we activate for the given {@link EObject}
	 * 
	 * @param eObject
	 * 
	 * @return
	 */
	public static boolean isMyCustomTask(EObject eObject) {
		return eObject instanceof ServiceTask && CLASS_VALUE.equals(eObject.eGet(CLASS_STRUCTURAL_FEATURE));
	}

	/**
	 * Return name of custom task
	 * 
	 * @return
	 */
	public static String getMyCustomTaskName() {
		return "My Custom Task";
	}
}
