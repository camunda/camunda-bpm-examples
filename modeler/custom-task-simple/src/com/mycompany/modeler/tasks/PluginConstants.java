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
