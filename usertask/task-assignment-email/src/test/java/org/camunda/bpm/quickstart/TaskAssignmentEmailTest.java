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
