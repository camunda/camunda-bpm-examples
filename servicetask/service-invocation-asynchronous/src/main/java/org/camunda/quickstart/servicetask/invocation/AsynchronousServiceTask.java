package org.camunda.quickstart.servicetask.invocation;

import java.util.HashMap;
import java.util.Map;

import org.camunda.bpm.engine.impl.bpmn.behavior.AbstractBpmnActivityBehavior;
import org.camunda.bpm.engine.impl.pvm.delegate.ActivityExecution;
import org.camunda.bpm.engine.impl.pvm.delegate.SignallableActivityBehavior;
import org.camunda.quickstart.servicetask.invocation.MockMessageQueue.Message;

/**
 * <p>This is a simple implementation of the {@link SignallableActivityBehavior}
 * interface.</p> 
 * 
 * <p>The {@link SignallableActivityBehavior} provides two methods:
 * <ul>
 * 
 *   <li>The {@link #execute(ActivityExecution)}-Method is invoked when the service 
 *   task is entered. It is typically used for sending an asynchronous message to the
 *   actual service. When the method returns, the process engine will NOT continue
 *   execution. The {@link SignallableActivityBehavior} acts as a wait state.</li>
 *   
 *   <li>The {@link #signal(ActivityExecution, String, Object)} method is invoked as 
 *   the process engine is being triggered by the callback. The signal-Method is 
 *   responsible for leaving the service task activity.</li>
 * </ul>
 * </p>
 *    
 * <p>The asynchronous nature of the invocation decouples the process engine from
 * the service implementation. The process engine does not propagate any thread context
 * to the service implementation. Most prominently, the service implementation is not 
 * invoked in the context of the process engine transaction. On the contrary, from the 
 * point of view of the process engine, the {@link SignallableActivityBehavior} is a 
 * wait state: after the execute()-Method returns, the process engine will stop execution,
 * flush out the sate of the execution to the database and wait for the callback to 
 * occur.</p>
 * 
 * <p>If a failure occurs in the service implementation, the failure will not cause the 
 * process engine to roll back. The reason is that the service implementation is not 
 * directly invoked by the process engine and does not participate in the process 
 * engine transaction.</p>
 *  
 */
public class AsynchronousServiceTask extends AbstractBpmnActivityBehavior {

  public static final String EXECUTION_ID = "executionId";
  
	public void execute(final ActivityExecution execution) throws Exception {
	  
	  // Build the payload for the message: 
	  Map<String, Object> payload = new HashMap<String, Object>(execution.getVariables());
	  // Add the execution id to the payload:
	  payload.put(EXECUTION_ID, execution.getId());
	  
	  // Publish a message to the outbound message queue. This method returns after the message has 
	  // been put into the queue. The actual service implementation (Business Logic) will not yet 
	  // be invoked:
	  MockMessageQueue.INSTANCE.send(new Message(payload));
	  
	}
			
	public void signal(ActivityExecution execution, String signalName, Object signalData) throws Exception {
	  
	  // leave the service task activity:
	  leave(execution);
	}

}
