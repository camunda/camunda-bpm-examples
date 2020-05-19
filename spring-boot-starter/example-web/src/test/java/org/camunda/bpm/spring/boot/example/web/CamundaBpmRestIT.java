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
package org.camunda.bpm.spring.boot.example.web;

import org.camunda.bpm.engine.rest.dto.repository.ProcessDefinitionDto;
import org.camunda.bpm.spring.boot.starter.property.CamundaBpmProperties;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.client.RestTemplate;
import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = { RestApplication.class, CamundaBpmRestIT.RestConfig.class}, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
public class CamundaBpmRestIT {

  @Autowired
  private RestTemplate restTemplate;

  @LocalServerPort
  private int port;

  @Autowired
  private CamundaBpmProperties camundaBpmProperties;

  @Test
  public void processDefinitionTest() {
    ResponseEntity<ProcessDefinitionDto[]> entity = restTemplate.getForEntity("http://localhost:" + this.port + "/engine-rest/engine/{engineName}/process-definition", ProcessDefinitionDto[].class,
      camundaBpmProperties.getProcessEngineName());
    assertEquals(HttpStatus.OK, entity.getStatusCode());
    assertEquals("Sample", entity.getBody()[0].getKey());
  }

  @TestConfiguration
  protected static class RestConfig {

    @Value("${spring.security.user.password}")
    private String password;

    @Bean
    public RestTemplate restTemplate() {
      return new RestTemplateBuilder().basicAuthentication("user", password).build();
    }

  }
}
