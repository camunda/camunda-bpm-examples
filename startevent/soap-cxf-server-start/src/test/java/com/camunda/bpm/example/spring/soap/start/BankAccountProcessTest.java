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

package com.camunda.bpm.example.spring.soap.start;

import static org.hamcrest.Matchers.is;

import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.camunda.bpm.example.spring.soap.start.v1.BankAccountServicePortType;
import com.camunda.bpm.example.spring.soap.start.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.start.v1.InvalidValueException;
import com.camunda.bpm.example.spring.soap.start.v1.InvalidValueException_Exception;
import com.camunda.bpm.example.spring.soap.start.v1.SetAccountNameRequest;
import com.camunda.bpm.example.spring.soap.start.v1.SetAccountNameResponse;
import com.camunda.bpm.example.spring.soap.start.v1.StatusType;
/**
 * 
 * Test various SOAP calls
 * 
 */

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={ "classpath:/spring/engine-test.xml", "classpath:/spring/beans.xml", "classpath:/spring/beans-test.xml"})
public class BankAccountProcessTest {

  @Rule
  public ExpectedException exception = ExpectedException.none();

  @Value("${secret}")
  private String secret;

  @Autowired
  @Qualifier("bankAccountServiceClient")
  protected BankAccountServicePortType client;

  @Test
  public void callServiceReturnSuccess() throws Exception {
    SetAccountNameRequest request = new SetAccountNameRequest();
    request.setAccountNumber("1");
    request.setAccountName("myAccount");

    BankRequestHeader header = new BankRequestHeader();
    header.setSecret(secret);

    SetAccountNameResponse response = client.setAccountName(request, header);

    Assert.assertThat(response.getStatus(), is(StatusType.SUCCESS));
  }

  @Test
  public void callServiceWithInvalidAccountNumberReturnAccountNumberInvalidValueException() throws Exception {
    SetAccountNameRequest request = new SetAccountNameRequest();
    request.setAccountNumber("ABC");
    request.setAccountName("myAccount");

    BankRequestHeader header = new BankRequestHeader();
    header.setSecret(secret);

    try {
      client.setAccountName(request, header);

      Assert.fail();
    } catch(InvalidValueException_Exception e) {
      InvalidValueException faultInfo = e.getFaultInfo();

      Assert.assertThat(faultInfo.getName(), is("accountNumber"));
    }
  }
  
  @Test
  public void callServiceWithInvalidSecretReturnError() throws Exception {
    exception.expect(RuntimeException.class);
    SetAccountNameRequest request = new SetAccountNameRequest();
    request.setAccountNumber("1");
    request.setAccountName("myAccount");

    BankRequestHeader header = new BankRequestHeader();
    header.setSecret("noSecret");

    client.setAccountName(request, header);
  }	 
}
