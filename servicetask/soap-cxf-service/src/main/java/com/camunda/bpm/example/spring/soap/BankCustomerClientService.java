package com.camunda.bpm.example.spring.soap;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.camunda.bpm.example.spring.soap.v1.BankCustomerServicePortType;
import com.camunda.bpm.example.spring.soap.v1.BankException_Exception;
import com.camunda.bpm.example.spring.soap.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsRequest;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsResponse;

/**
 * 
 * Common service exposing web service. Add logic for throttling, service authentication and such here.
 * 
 */

@Service
public class BankCustomerClientService implements BankCustomerServicePortType {

	private BankCustomerServicePortType port;
	
	@Autowired
	public BankCustomerClientService(BankCustomerServicePortType port) {
		this.port = port;
	}

	@Override
	public GetAccountsResponse getAccounts(GetAccountsRequest parameters, BankRequestHeader bankHeader) throws BankException_Exception {
		return port.getAccounts(parameters, bankHeader);
	}
}

