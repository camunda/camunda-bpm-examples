package com.camunda.bpm.example.spring.soap;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

  private BankCustomerClientService service;

  @Autowired
  public BankCustomerService(BankCustomerClientService service) {
    this.service = service;
  }

  public GetAccountsResponse getAccounts(GetAccountsRequest request, DelegateExecution execution) throws Exception {
    BankRequestHeader requestHeader = getSecurityHeader(execution);

    return service.getAccounts(request, requestHeader);
  }

  private BankRequestHeader getSecurityHeader(DelegateExecution execution) {
    BankRequestHeader requestHeader = new BankRequestHeader();
    requestHeader.setSingleSignonToken(execution.getVariable("singleSignonToken").toString());
    return requestHeader;
  }

}
