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

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Dummy bank service for setting account name.<br/><br/>
 * 
 * In a real-world scenario, this service would trigger an update to a database or so. The current implementation just 
 * performs a logging statement.
 * 
 * @author Thomas Skjolberg
 *
 */

@Service("bankService")
public class BankService {
  
  private Logger logger = LoggerFactory.getLogger(BankService.class.getName());

  public void setAccountName(DelegateExecution execution) {
    
    String accountName = (String) execution.getVariable("accountName");
    String accountNumber  = (String) execution.getVariable("accountNumber");
    
    logger.info("Set account name " + accountName + " for account number " + accountNumber);
  }
  
}
