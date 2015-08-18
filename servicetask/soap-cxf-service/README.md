SOAP CXF example
===============================================================
This example demonstrates how use a SOAP webservice-client generated using CXF in a Spring application.

> The process engine relies on camunda spin for working with JAXB-annotated classes. 

![Example Process][png]

The example includes a BPMN 2.0 process with a single, simple service task, invoking two Spring services. 

All marshall/unmarshalling is handled transparently by the engine.

# Overview

- [BPMN source code][bpmn]
- [WSDL][wsdl] / [XSD][xsd] webservice definition
- Spring context 
  - [BankCustomerService][service] and [BankCustomerClientService][clientService] services
  - [beans.xml][beans] and [engine.xml][engine]
- [JUnit tests][unit tests]

# How it works
The webservice bindings are generated using the maven plugin `cxf-codegen-plugin`. The Camunda engine is configured via Spring.

The webservice context is loaded from [beans.xml][beans], including two services:
 * `BankCustomerService` - camunda-specific wrapper
 * `BankCustomerClientService` - webservice client wrapper

The BPMN 2.0 process is first started with two variables: 
 * `singleSignonToken` - String value, and
 * `request` - a JAXB object corresponding to:

```xml
<getAccountsRequest xmlns="http://soap.spring.example.bpm.camunda.com/v1">
  <customerNumber>123456789</customerNumber>
</getAccountsRequest>
```

As the service task executes, it invokes `getAccounts(..)` on the `BankCustomerService` service:

```java
public GetAccountsResponse getAccounts(GetAccountsRequest request, DelegateExecution execution) throws Exception {
	BankRequestHeader requestHeader = getSecurityHeader(execution);
    
    // camunda-specific logic, i.e. extract security context from process
	BankRequestHeader requestHeader = new BankRequestHeader();
	requestHeader.setSingleSignonToken(execution.getVariable("singleSignonToken").toString());
	
	return service.getAccounts(request, requestHeader);
}
```

The call is then forwarded to `getAccounts(..)` on the `BankCustomerClientService` service

```java
private BankCustomerServicePortType port;
	
public GetAccountsResponse getAccounts(GetAccountsRequest parameters, BankRequestHeader bankHeader)  throws Exception {
	return port.getAccounts(parameters, bankHeader);
}
```

which holds the actual webservice client port. The mock webservice responds with

```xml
<getAccountsResponse xmlns="http://soap.spring.example.bpm.camunda.com/v1">
  <account>1234</account>
  <account>5678</account>
</getAccountsResponse>
```
which is returned to the service task as a JAXB object.

## Tweaking the example
The above automagic relies on having the XML and the correct XML object type set. This might not always be the case. Possible ways of tweaking the example would be

 - construct JAXB object using a groovy script in the service task input/output mappings
 - handle Strings in wrapper service, unmarshall using `JAXBContext`
 
# How to use it?

1. Checkout the project with Git
2. Read and run the [JUnit tests][unit tests]

[png]: src/main/resources/process.png
[bpmn]: src/main/resources/process.bpmn
[wsdl]: src/main/resources/wsdl/BankCustomerService.wsdl
[xsd]: src/main/resources/wsdl/BankCustomerService.xsd
[beans]: src/main/resources/spring/beans.xml
[engine]: src/main/resources/spring/engine.xml
[engine-test]: src/test/resources/spring/engine-test.xml
[unit tests]: src/test/java/com/camunda/bpm/example/spring/soap/BankCustomerProcessTest.java
[service]: src/main/java/com/camunda/bpm/example/spring/soap/BankCustomerService.java
[clientService]: src/main/java/com/camunda/bpm/example/spring/soap/BankCustomerClientService.java
