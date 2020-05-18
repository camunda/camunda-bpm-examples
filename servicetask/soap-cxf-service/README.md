SOAP CXF example
===============================================================
This example demonstrates how use a SOAP webservice-client generated using CXF in a Spring application.

> The process engine relies on camunda spin for working with JAXB-annotated classes. 

![Example Process][png]

The example BPMN 2.0 process looks up a list of account numbers using a customer number at a remote SOAP service. This is done using a single service task and two chained Spring service classes. 

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
 
The BPMN 2.0 process is started with two variables: 
 * `secret` - String value, and
 * `customerNumber` - the customer number to look up.

As the service task executes, it invokes `getAccounts(..)` on the `BankCustomerService` Spring service. The Spring service constructs two objects - the SOAP `GetAccountsRequest` body and `BankRequestHeader` header. 

The call is then forwarded to `getAccounts(..)` on the `BankCustomerClientService` service, which holds the actual webservice client port. In our first unit test, the mock webservice responds with a `GetAccountsResponse`, which is returned to the service task as a JAXB object and stored as `accounts` in the process.

## Error handling (SOAP Faults)
The `BankCustomerService` service translates webservice faults business errors, i.e.. 

```java
// exception caught
throw new BpmnError("serviceException");
```
In our second unit test, the mock webservice responds with a Fault, triggering the above code. The process proceeds to the 'end unsuccessful' end node - never storing any `GetAccountsResponse` object. 

## Tweaking the example
### Webservice clients
In this example, the domain objects are the same as the webservice objects. This reduces the `BankCustomerClientService` to a simple wrapper. These webservice clients should however be written as reusable, user-friendly modules, and so it is natural to put domain-to-webservice object converters, security-related functionality, guards and so on into such a service. 

### Fault vs business errors vs retry
In a proper implementation, you would like to make the distinction between different kinds of faults, some from which you can recover, and others from which you cannot. The built-in retry-mechanism should be allowed to kick in for certain problems like transient loss of connection and so. Whether or not running out of retries is a business error, is up to the nature of the process.

### JAXB objects
The example implementation relies on having the default serialization type set to XML when storing the `GetAccountsResponse` object. If not so, the JAXB object must be wrapped so that it still is stored as XML in the database. Camunda will automagically marshall/unmarshall your generated JAXB objects.

An alternative implementation could be to call the `BankCustomerClientService` directly - for example by constructing the `GetAccountsRequest` JAXB object using a groovy script in the service task input/output mappings.

# How to use it?

1. Checkout the project with Git
2. Read and run the [JUnit tests][unit tests]

[png]: src/main/resources/process.png
[bpmn]: src/main/resources/process.bpmn
[wsdl]: src/main/resources/wsdl/BankCustomerService.wsdl
[xsd]: src/main/resources/wsdl/BankCustomerService.xsd
[beans]: src/main/resources/spring/beans.xml
[engine]: src/main/resources/spring/engine.xml
[unit tests]: src/test/java/com/camunda/bpm/example/spring/soap/BankCustomerProcessTest.java
[service]: src/main/java/com/camunda/bpm/example/spring/soap/BankCustomerService.java
[clientService]: src/main/java/com/camunda/bpm/example/spring/soap/BankCustomerClientService.java
