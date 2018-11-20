SOAP CXF server start process example 
===============================================================
This example demonstrates how to start a process via a SOAP webservice-server generated using CXF in a Spring application. This example works with Tomcat distribution. Note: The example does not work with JDK 9+.

![Example Process][png]

The example BPMN 2.0 process is triggered by a SOAP call. The SOAP webservice-server starts the process by submitting a start form.

# Overview

- [BPMN source code][bpmn]
- [WSDL][wsdl] / [XSD][xsd] webservice definition
- Spring context 
  - [BankAccountService][bankAccountService] and [BankService][bankService] services
  - [beans.xml][beans] and [engine.xml][engine]
- [JUnit tests][unit tests]

# How it works
The webservice bindings are generated using the maven plugin `cxf-codegen-plugin`. The Camunda engine is configured via Spring.

The webservice context is loaded from [beans.xml][beans], including two services:
 * `BankAccountService` - SOAP endpoint server.
 * `BankService` - spring service, performing some logging. i.e. dummy service.
 
The `BankAccountService` endpoint is secured in two ways
 * [Basic Authentication][basicauth]
 * SOAP header containing secret value
 
The BPMN 2.0 process is started with two variables: 
 * `accountNumber` - account number targeted by the operation
 * `accountName` - name which is to be set on the account

A custom [validator] makes sure the `accountNumber` value consists only of digits.

The SOAP request consists of a `SetAccountNameRequest` body and `BankRequestHeader` header. It starts the process using `FormService.submitStartForm(..)`.

As the process service task executes, it invokes `setAccountName(..)` on the `BankService` Spring service, performing a logging statement.

## Form-validation exception handling via SOAP Faults
The `BankAccountService` service translates start node form-validation exceptions to SOAP faults. The SOAP fault contains information on which field failed to validate. 

# How to use it?

1. Checkout the project with Git
2. Read and run the [JUnit tests][unit tests]
3. Build with maven and deploy .war file on tomcat.
4. Access the [WDSL][wsdl-localhost] using credentials 'user'/'password' used for example SoapUI.


[png]: src/main/resources/setAccountName.png
[bpmn]: src/main/resources/setAccountName.bpmn
[wsdl]: src/main/resources/wsdl/BankAccountService.wsdl
[xsd]: src/main/resources/wsdl/BankAccountService.xsd
[beans]: src/main/resources/spring/beans.xml
[engine]: src/main/resources/spring/engine.xml
[unit tests]: src/test/java/com/camunda/bpm/example/spring/soap/start/BankAccountProcessTest.java
[bankAccountService]: src/main/java/com/camunda/bpm/example/spring/soap/start/BankAccountService.java
[bankService]: src/main/java/com/camunda/bpm/example/spring/soap/start/BankService.java
[wsdl-localhost]: http://localhost:8080/soap-cxf-server-start/services/bankAccount?wsdl
[validator]: src/main/java/com/camunda/bpm/example/spring/soap/start/validator/AccountNumberFormFieldValidator.java
[basicauth]: https://en.wikipedia.org/wiki/Basic_access_authentication
