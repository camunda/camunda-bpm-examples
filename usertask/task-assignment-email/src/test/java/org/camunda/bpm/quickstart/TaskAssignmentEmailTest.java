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
package org.camunda.bpm.quickstart;

import org.camunda.bpm.engine.identity.User;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineTestCase;

public class TaskAssignmentEmailTest extends ProcessEngineTestCase {

  // TODO: Set the Demo User Email Address 
	private static final String EMAIL = "demo@example.org";


  @Deployment (resources="taskAssignmentEmail.bpmn")
	public void testSimpleProcess() {

		// Create the user that will be informed on assignment
	  User newUser = identityService.newUser("demo");
		newUser.setEmail(EMAIL);
		identityService.saveUser(newUser);
		
		runtimeService.startProcessInstanceByKey("TaskAssignmentEmail");

	  Task task = taskService.createTaskQuery().singleResult();

	  taskService.complete(task.getId());

	}
	
}
