package org.camunda.bpm.example.loanapproval;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;

public class CalculateInterestService implements JavaDelegate {
	
	public void execute(DelegateExecution delegate) throws Exception {
		
		System.out.println("Spring Bean invoked.");
		
	}

}
