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
package com.camunda.bpm.example.spring.soap.start;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.jws.WebService;

import org.camunda.bpm.engine.FormService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.form.validator.FormFieldValidatorException;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.camunda.bpm.example.spring.soap.start.v1.BankAccountServicePortType;
import com.camunda.bpm.example.spring.soap.start.v1.BankRequestHeader;
import com.camunda.bpm.example.spring.soap.start.v1.InvalidValueException;
import com.camunda.bpm.example.spring.soap.start.v1.InvalidValueException_Exception;
import com.camunda.bpm.example.spring.soap.start.v1.SetAccountNameRequest;
import com.camunda.bpm.example.spring.soap.start.v1.SetAccountNameResponse;
import com.camunda.bpm.example.spring.soap.start.v1.StatusType;
import org.springframework.stereotype.Service;

/**
 * 
 * Webservice for starting a process via a start node form. <br/><br/>
 * 
 * The service has a single method <b>setAccountName</b> for setting an account name.
 * 
 * @author Thomas Skjolberg 
 */

@Service
@WebService(endpointInterface = "com.camunda.bpm.example.spring.soap.start.v1.BankAccountServicePortType")
public class BankAccountService implements BankAccountServicePortType {

  protected Logger logger = LoggerFactory.getLogger(BankAccountService.class.getName());

  @Autowired
  protected ProcessEngine processEngine;

  protected FormService formService;
  
  @PostConstruct
  protected void init() {
    formService = processEngine.getFormService();
  }
  
  @Override
  public SetAccountNameResponse setAccountName(SetAccountNameRequest request, BankRequestHeader header) throws InvalidValueException_Exception {
    logger.info("Set account " + request.getAccountNumber() + " name " + request.getAccountName());
    
    Map<String, Object> properties = new HashMap<>();
    properties.put("accountNumber", request.getAccountNumber());
    properties.put("accountName", request.getAccountName());
    
    ProcessDefinition lastestProcessDefinition = getLastestProcessDefinition("setAccountNameProcess");
    SetAccountNameResponse response = new SetAccountNameResponse();

    if(lastestProcessDefinition != null) {
      try {
        formService.submitStartForm(lastestProcessDefinition.getId(), properties);
        
        response.setStatus(StatusType.SUCCESS);
        
        logger.info("Successfully set account name");
      } catch(FormFieldValidatorException e) {
        logger.warn("Invalid value for field " + e.getId(), e);
        
        InvalidValueException exception = new InvalidValueException();
        exception.setName(e.getId());
        
        throw new InvalidValueException_Exception("Invalid value for field " + e.getId(), exception);
      } catch(Exception e) {
        logger.warn("Unable to start process", e);
        
        response.setStatus(StatusType.FAILURE);
      }
    } else {
      response.setStatus(StatusType.FAILURE);
    }
    
    return response;
  }

  
  protected ProcessDefinition getLastestProcessDefinition(String processDefinitionKey) {
    Set<String> registeredDeployments = processEngine.getManagementService().getRegisteredDeployments();
    
    ProcessDefinition latestProcessDefintion = null;
    for(String deploymentId : registeredDeployments) {
      List<ProcessDefinition> list = processEngine.getRepositoryService()
          .createProcessDefinitionQuery()
          .deploymentId(deploymentId)
          .processDefinitionKey(processDefinitionKey)
          .list();

      for(ProcessDefinition processDefinition : list) {
        if(latestProcessDefintion == null || latestProcessDefintion.getVersion() < processDefinition.getVersion()) {
          latestProcessDefintion = processDefinition;
        }
      }
    }
    return latestProcessDefintion;
  }

  
}

