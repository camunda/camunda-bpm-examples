package com.camunda.bpm.example.spring.soap;

import java.util.logging.Logger;

import org.camunda.bpm.engine.delegate.BpmnError;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.impl.pvm.runtime.ExecutionImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.remoting.soap.SoapFaultException;
import org.springframework.stereotype.Service;

import com.camunda.bpm.example.spring.soap.v1.BankException;
import com.camunda.bpm.example.spring.soap.v1.BankException_Exception;
import com.camunda.bpm.example.spring.soap.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsRequest;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsResponse;

/**
 * 
 * Example wrapper for using complex XML objects as process variables to access a remote web service configured via Spring.
 * 
 */

@Service("bankCustomerService")
public class BankCustomerService {

  private static Logger log = Logger.getLogger(BankCustomerService.class.getName());

  private BankCustomerClientService service;

  @Autowired
  public BankCustomerService(BankCustomerClientService service) {
    this.service = service;
  }

  public GetAccountsResponse getAccounts(DelegateExecution execution) throws Exception {
    
    GetAccountsRequest request = new GetAccountsRequest();
    request.setCustomerNumber((String)execution.getVariable("customerNumber"));
    
    BankRequestHeader requestHeader = getSecurityHeader(execution);

    try {
      return service.getAccounts(request, requestHeader);
    } catch(BankException_Exception e) {
      
      BankException faultInfo = e.getFaultInfo();
      log.warning("Problem getting accounts: " + faultInfo.getCode() + ": " + faultInfo.getMessage());
      throw new BpmnError("serviceException");
    }
    
  }

  private BankRequestHeader getSecurityHeader(DelegateExecution execution) {
    BankRequestHeader requestHeader = new BankRequestHeader();
    requestHeader.setSecret(execution.getVariable("secret").toString());
    return requestHeader;
  }

}
