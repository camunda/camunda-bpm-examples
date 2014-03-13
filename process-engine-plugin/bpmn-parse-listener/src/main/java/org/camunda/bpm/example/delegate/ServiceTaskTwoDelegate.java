package org.camunda.bpm.example.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;

public class ServiceTaskTwoDelegate implements JavaDelegate {

  public static boolean wasExecuted = false;

  public void execute(DelegateExecution execution) throws Exception {
    wasExecuted = true;
  }

}
