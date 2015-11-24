package com.camunda.bpm.example.spring.soap;

import javax.jws.WebService;
import javax.jws.soap.SOAPBinding;
import javax.xml.bind.annotation.XmlSeeAlso;
import javax.xml.ws.Endpoint;
import javax.xml.ws.spi.Provider;

import org.apache.cxf.jaxws22.spi.ProviderImpl;
import org.springframework.context.annotation.Profile;

import com.camunda.bpm.example.spring.soap.v1.BankCustomerServicePortType;
import com.camunda.bpm.example.spring.soap.v1.BankException_Exception;
import com.camunda.bpm.example.spring.soap.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsRequest;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsResponse;
import com.camunda.bpm.example.spring.soap.v1.ObjectFactory;

/**
 * 
 * Adapter for mocking.  
 *
 */

@WebService(targetNamespace = "http://soap.spring.example.bpm.camunda.com/v1", name = "BankCustomerServicePortType")
@XmlSeeAlso({ObjectFactory.class})
@SOAPBinding(parameterStyle = SOAPBinding.ParameterStyle.BARE)
@Profile("webservice")
public class BankCustomerServiceStub implements BankCustomerServicePortType {

	private BankCustomerServicePortType adapter;
	private Endpoint endpoint;

	public BankCustomerServiceStub(String address) {
		Provider provider = new ProviderImpl();
		endpoint = provider.createAndPublishEndpoint(address, this);
	}

	public void setAdapter(BankCustomerServicePortType adapter) {
		this.adapter = adapter;
	}

	public void stop() {
		endpoint.stop();
	}

	@Override
	public GetAccountsResponse getAccounts(GetAccountsRequest parameters, BankRequestHeader bankHeader) throws BankException_Exception {
		return adapter.getAccounts(parameters, bankHeader);
	}
}
