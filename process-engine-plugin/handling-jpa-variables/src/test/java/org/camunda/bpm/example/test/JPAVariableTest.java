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
package org.camunda.bpm.example.test;

import static org.junit.Assert.assertEquals;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.example.jpa.entities.Customer;
import org.camunda.bpm.example.jpa.variables.serializer.EntityManagerSession;
import org.camunda.bpm.example.jpa.variables.serializer.EntityManagerSessionFactory;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class JPAVariableTest {

  @Rule
  public ProcessEngineRule engineRule = new ProcessEngineRule();

  protected ProcessEngine processEngine;
  protected ProcessEngineConfigurationImpl processEngineConfiguration;
  protected RuntimeService runtimeService;

  static EntityManagerFactory entityManagerFactory;

  protected Customer customerOne;
  protected Customer customerTwo;

  @Before
  public void setUp() {
    processEngine = engineRule.getProcessEngine();
    processEngineConfiguration = engineRule.getProcessEngineConfiguration();
    runtimeService = engineRule.getRuntimeService();

    EntityManagerSessionFactory entityManagerSessionFactory = (EntityManagerSessionFactory) processEngineConfiguration
        .getSessionFactories().get(EntityManagerSession.class);
    entityManagerFactory = entityManagerSessionFactory.getEntityManagerFactory();
  }

  @AfterClass
  public static void tearDown() throws Exception {
    if (entityManagerFactory != null) {
      entityManagerFactory.close();
      entityManagerFactory = null;
    }
  }

  @Test
  @Deployment(resources = { "process.bpmn" })
  public void shouldStoreJPAEntitiesAsVariables() {
    // given
    setupEntities();

    Map<String, Object> variables = new HashMap<String, Object>();
    variables.put("customerOne", customerOne);
    variables.put("customerTwo", customerTwo);

    // Start the process with the JPA-entities as variables. They will be stored in the DB.
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("process", variables);

    // when
    Object customerOneResult = runtimeService.getVariable(processInstance.getId(), "customerOne");
    Object customerTwoResult = runtimeService.getVariable(processInstance.getId(), "customerTwo");

    // then
    assertEquals(1L, ((Customer) customerOneResult).getId().longValue());
    assertEquals("Jane", ((Customer) customerOneResult).getFirstName());
    assertEquals(2L, ((Customer) customerTwoResult).getId().longValue());
    assertEquals("Mary", ((Customer) customerTwoResult).getFirstName());
  }

  protected void setupEntities() {
    EntityManager manager = entityManagerFactory.createEntityManager();
    manager.getTransaction().begin();

    customerOne = new Customer(1l, "Jane");
    manager.persist(customerOne);

    customerTwo = new Customer(2l, "Mary");
    manager.persist(customerTwo);

    manager.flush();
    manager.getTransaction().commit();
    manager.close();
  }

}
