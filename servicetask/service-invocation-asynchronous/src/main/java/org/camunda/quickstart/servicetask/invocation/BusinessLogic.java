package org.camunda.quickstart.servicetask.invocation;

import java.util.Collections;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.quickstart.servicetask.invocation.MockMessageQueue.Message;

/**
 * This class represents the actual business logic invoked by the service task.
 * 
 */
public class BusinessLogic {
  
  public static final String SHOULD_FAIL_VAR_NAME = "shouldFail";
  public static final String PRICE_VAR_NAME = "price";
  public static final float PRICE = 199.00f;
  
  public static BusinessLogic INSTANCE = new BusinessLogic();
    
  public void invoke(Message message, ProcessEngine processEngine) {    
    
    // Process the message and send a callback.
    
    // Extract values from payload:     
    Map<String, Object> requestPayload = message.getPayload();
    // the execution id is used as correlation identifier 
    String executionId = (String) requestPayload.get(AsynchronousServiceTask.EXECUTION_ID);    
    Boolean shouldFail = (Boolean) requestPayload.get(SHOULD_FAIL_VAR_NAME);
    
    if(shouldFail) {
      throw new RuntimeException("Service invocation failure!");
      
    } else {
      // Send the callback to the process engine. In this example we send 
      // a synchronous callback. We could also send an asynchronous callback 
      // using a message queue.
      Map<String, Object> callbackPayload = Collections.<String,Object>singletonMap(PRICE_VAR_NAME, PRICE);
      processEngine.getRuntimeService().signal(executionId, callbackPayload);
      
    }
  }

}
