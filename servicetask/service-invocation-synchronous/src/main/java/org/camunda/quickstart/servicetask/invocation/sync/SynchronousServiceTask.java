package org.camunda.quickstart.servicetask.invocation.sync;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;

/**
 * <p>This is a simple implementation of the {@link JavaDelegate} interface.</p> 
 * 
 * <p>The {@link #execute(DelegateExecution)} Method provided by this class will 
 * be executed synchronously and the process engine thread will be blocked until 
 * the method call returns.</p>
 * 
 * <p>The synchronous nature of the invocation allows to leverage Thread Context: 
 * the {@link JavaDelegate} implementation may participate in the same Transaction 
 * as the process engine, Security Context is propagated and so forth.</p>
 * 
 * <p>The synchronous nature of the invocation also allows for a very simple failure
 * handling strategy: if this delegate implementation throws an exception, it will be
 * caught by the blocked thread and handled using a transaction rollback: the process
 * engine will roll back to the last persistent state. In this example the last persistent
 * state is the usertask preceding the service task ("Wait State Before").</p>
 * 
 */
public class SynchronousServiceTask implements JavaDelegate {
	
	// some constants provided to the unit test 
	
	public static final String SHOULD_FAIL_VAR_NAME = "shouldFail";
	public static final String PRICE_VAR_NAME = "price";
	public static final float PRICE = 199.00f;

	public void execute(DelegateExecution execution) throws Exception {
		
		// Here you could either add the business logic of the service task 
		// or delegate to the actual business logic implementation provided 
		// by a different class. 
		
		// You could also invoke a Remote Service using REST, SOAP or EJB-Remote 
		// in a synchronous fashion.
		
		// In this example, we 
		//  - either throw an exception 
		//  - or add a variable to the execution so that we can check for it in the unit test:
		
		if(((Boolean)execution.getVariable(SHOULD_FAIL_VAR_NAME)) == true) {
			throw new RuntimeException("Service invocation failure!");
			
		} else {
			execution.setVariable(PRICE_VAR_NAME, PRICE);
			
		}
		
		
	}

}
