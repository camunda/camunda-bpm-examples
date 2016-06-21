/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.camunda.bpm.example.spring.soap.start.security;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import javax.xml.namespace.QName;

import org.apache.cxf.binding.soap.SoapMessage;
import org.apache.cxf.binding.soap.interceptor.AbstractSoapInterceptor;
import org.apache.cxf.headers.Header;
import org.apache.cxf.interceptor.Fault;
import org.apache.cxf.phase.Phase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Node;

import com.camunda.bpm.example.spring.soap.start.v1.BankRequestHeader;

/**
 * Simple CXF-interceptor for validating the {@linkplain BankRequestHeader} in incoming SOAP requests. <br/><br/>
 * The header must contain a secret value, if not then an HTTP 401 status is 
 * propagated back to the caller.
 * 
 * @author Thomas Skjolberg
 */

public class BankHeaderInterceptor extends AbstractSoapInterceptor {
  
  private static final QName HEADER_TYPE = new QName("http://start.soap.spring.example.bpm.camunda.com/v1", "bankRequestHeader");

  private Logger logger = LoggerFactory.getLogger(BankHeaderInterceptor.class.getName());
  
  private String secret;

  private JAXBContext jaxbContext;
  
  public BankHeaderInterceptor() throws JAXBException {
      super(Phase.PRE_PROTOCOL);
      
      jaxbContext = JAXBContext.newInstance(BankRequestHeader.class);
  }

  @Override
  public void handleMessage(SoapMessage soapMessage) throws Fault {
    
    String headerSecret = parseSecret(soapMessage);
    if(headerSecret == null || !headerSecret.equals(secret)) {
      logger.info("Unable to verify header secret " + headerSecret + ", expected " + secret);
      
      Fault fault = new Fault(new SecurityException("Unable to verify header"));
      fault.setStatusCode(401); // access denied
      throw fault;
    }
    
  }
  
  public String parseSecret(SoapMessage soapMessage) {
    Header header = soapMessage.getHeader(HEADER_TYPE);

    if(header != null) {
      // parse header. consider iterating through w3c DOM tree directly as an optimalization
      try {
        Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
        
        BankRequestHeader bankRequestHeader = (BankRequestHeader) unmarshaller.unmarshal((Node)header.getObject());
        
        return bankRequestHeader.getSecret();
      } catch (JAXBException e) {
        logger.warn("Unable to unmarshall header", e);
      }
      
    }
    return null;
    
  }
  
  public void setSecret(String secret) {
    this.secret = secret;
  }
  
  public String getSecret() {
    return secret;
  }
}
 