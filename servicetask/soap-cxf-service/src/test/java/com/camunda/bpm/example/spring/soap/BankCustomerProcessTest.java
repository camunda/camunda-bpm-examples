/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.camunda.bpm.example.spring.soap;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBElement;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.bind.PropertyException;
import javax.xml.namespace.QName;
import javax.xml.transform.dom.DOMResult;
import javax.xml.ws.Endpoint;

import org.apache.cxf.binding.soap.SoapFault;
import org.apache.cxf.jaxws.EndpointImpl;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.camunda.bpm.engine.variable.value.StringValue;
import org.camunda.bpm.engine.variable.value.TypedValue;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.w3c.dom.Element;

import com.camunda.bpm.example.spring.soap.v1.BankCustomerServicePortType;
import com.camunda.bpm.example.spring.soap.v1.BankException;
import com.camunda.bpm.example.spring.soap.v1.BankException_Exception;
import com.camunda.bpm.example.spring.soap.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsRequest;
import com.camunda.bpm.example.spring.soap.v1.GetAccountsResponse;

/**
 * 
 * This class tests three async processes. 
 * 
 */

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={ "classpath:/spring/engine.xml", "classpath:/spring/beans.xml"})
@ActiveProfiles("webservice")
public class BankCustomerProcessTest {
	
  @Rule
  public ExpectedException exception = ExpectedException.none();
  
	@Autowired
	private RuntimeService runtimeService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private HistoryService historyService;

	@Autowired
	private ProcessEngine processEngine;
	
	@Mock
	private BankCustomerServicePortType serviceMock;
	
	@Value("${bankcustomer.service}")
	private String bankCustomerServiceAddress;
	
	private EndpointImpl endpoint;

	@Before
	public void initMocks() throws Exception {
		MockitoAnnotations.initMocks(this);

		// wrap the evaluator mock in proxy
		BankCustomerServicePortType serviceInterface = ServiceProxy.newInstance(serviceMock);

		// publish the mock 
		endpoint = (EndpointImpl) Endpoint.create(serviceInterface);

		// we have to use the following CXF dependent code, to specify qname, so that it resource locator finds it 
		QName serviceName = new QName("http://soap.spring.example.bpm.camunda.com/v1", "BankCustomerServicePortType");
		endpoint.setServiceName(serviceName);
		endpoint.publish(bankCustomerServiceAddress);
		
	}
	
	@After
	public void closeMocks() {
		reset(serviceMock);

		if(endpoint != null) {
			endpoint.stop();
		}
	}
	
	@Test
	public void process_inputJaxbObjectInProcess_javaObjectPassedToService() throws Exception {
		
		// add mock response
		GetAccountsResponse mockResponse = new GetAccountsResponse();
		List<String> accountList = mockResponse.getAccount();
		accountList.add("1234");
		accountList.add("5678");
		
		when(serviceMock.getAccounts(any(GetAccountsRequest.class), any(BankRequestHeader.class))).thenReturn(mockResponse);

		String customerNumber = "123456789";
		String secret = "abc";
		
		// invoke process (async behaviour)
		Map<String, Object> variables = new HashMap<>();
		variables.put("customerNumber",  customerNumber);
		variables.put("secret", secret);		
				
		ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("process", variables);

		// wait until all jobs complete
		assertTrue(waitUntilNoActiveJobs(processEngine, 1000));

	    // validate that mock called
		verifyRequest(customerNumber, secret);
		
		// verify that all serialization types are application/xml (kind of important)
		verifySerializationFormat(processInstance, "application/xml");
		
		// verify that we got our response
		GetAccountsResponse response = (GetAccountsResponse)historyService.createHistoricVariableInstanceQuery().processInstanceId(processInstance.getProcessInstanceId()).variableName("accounts").singleResult().getValue();
		assertThat(response.getAccount().size(), is(2));

	  }
	
	 @Test
	  public void call_serviceWithSoapFault_soapFaultException() throws Exception {
	    
	    // add mock response
	    GetAccountsResponse mockResponse = new GetAccountsResponse();
	    List<String> accountList = mockResponse.getAccount();
	    accountList.add("1234");
	    accountList.add("5678");
	    
	    String errorCode = "myErrorCode";
	    String errorMessage = "myErrorMessage";
	    
	    SoapFault fault = createFault(errorCode, errorMessage);
      
	    when(serviceMock.getAccounts(any(GetAccountsRequest.class), any(BankRequestHeader.class))).thenThrow(fault);

	    String customerNumber = "123456789";
	    String secret = "abc";
	    
	    // invoke process (async behaviour)
	    Map<String, Object> variables = new HashMap<>();
	    variables.put("customerNumber",  customerNumber);
	    variables.put("secret", secret);    
	        
	    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("process", variables);

	    // wait until all jobs complete
	    assertTrue(waitUntilNoActiveJobs(processEngine, 1000));

	      // validate that mock called
	    verifyRequest(customerNumber, secret);
	    
	    Assert.assertNull(historyService.createHistoricVariableInstanceQuery().processInstanceId(processInstance.getProcessInstanceId()).variableName("accounts").singleResult());
	  }
	 
	 /** construct soap fault */
  private SoapFault createFault(String errorCode, String errorMessage) throws JAXBException, PropertyException {
    BankException exception = new BankException();
    exception.setCode(errorCode);
    exception.setMessage(errorMessage);
    
    QName qName = SoapFault.FAULT_CODE_SERVER;
    SoapFault fault = new SoapFault("message", qName);
   
    Element detail = fault.getOrCreateDetail();
   
    JAXBContext context = JAXBContext.newInstance(BankException.class);
    
    DOMResult result = new DOMResult();
    
    Marshaller marshaller = context.createMarshaller();
    marshaller.setProperty(Marshaller.JAXB_FRAGMENT, Boolean.TRUE);
    
    marshaller.marshal(new JAXBElement<BankException>(new QName("http://soap.spring.example.bpm.camunda.com/v1","bankException"), BankException.class, exception), result);
    
    detail.appendChild(detail.getOwnerDocument().importNode(result.getNode().getFirstChild(), true));
    return fault;
  }


	private void verifySerializationFormat(ProcessInstance processInstance, String format) {
		List<HistoricVariableInstance> list = historyService.createHistoricVariableInstanceQuery().processInstanceId(processInstance.getProcessInstanceId()).list();
		
		for(HistoricVariableInstance item : list) {
		  if(item.getName().equals("request") || item.getName().equals("accounts")) {
  			TypedValue typedValue = item.getTypedValue();
  			if(typedValue instanceof ObjectValue) {
  				ObjectValue objectValue = (ObjectValue)typedValue;
  				
  				assertThat(item.getName(), objectValue.getSerializationDataFormat(), is(format));
  			} else if(!(typedValue instanceof StringValue)) {
  				Assert.fail();
  			}
		  }
		}
	}

	private void verifyRequest(String customerNumber, String secret) throws Exception {
		ArgumentCaptor<GetAccountsRequest> argument1 = ArgumentCaptor.forClass(GetAccountsRequest.class);
		ArgumentCaptor<BankRequestHeader> argument2 = ArgumentCaptor.forClass(BankRequestHeader.class);
		verify(serviceMock, times(1)).getAccounts(argument1.capture(), argument2.capture());

		GetAccountsRequest request = argument1.getValue();
		assertThat(request.getCustomerNumber(), is(customerNumber));
		
		BankRequestHeader header = argument2.getValue();
		assertThat(header.getSecret(), is(secret));
	}	
	
	
	public boolean waitUntilNoActiveJobs(ProcessEngine processEngine, long wait) throws InterruptedException {
		long timeout = System.currentTimeMillis() + wait;
		while(System.currentTimeMillis() < timeout) {
			long jobs = processEngine.getManagementService().createJobQuery().active().count();
			if(jobs == 0) {
				return true;
			}
			System.out.println("Waiting for " + jobs + " jobs");
			Thread.sleep(50);
		}
		return false;
	}
	
	/**
	 * Utility class to wrap the webservice implementation in a mock.
	 */
	public static class ServiceProxy implements InvocationHandler {
		private Object obj;

		public static <T> T newInstance(T obj) {
			ServiceProxy proxy = new ServiceProxy(obj);
			Class<?> clazz = obj.getClass();
			T res = (T) Proxy.newProxyInstance(clazz.getClassLoader(), clazz.getInterfaces(), proxy);
			return res;
		}

		ServiceProxy(Object obj) {
			this.obj = obj;
		}

		@Override
		public Object invoke(Object proxy, Method m, Object[] args) throws Exception {
			try {
				return m.invoke(obj, args);
			} catch (Exception e) {
			  if(e.getCause() instanceof org.apache.cxf.binding.soap.SoapFault) {
          throw (Exception)e.getCause();
			  }
			  throw new RuntimeException(e.getMessage(), e);
			}
		}
	}
}
