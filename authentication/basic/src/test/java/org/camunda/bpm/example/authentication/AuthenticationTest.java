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
package org.camunda.bpm.example.authentication;

import static com.jayway.restassured.RestAssured.given;
import static com.jayway.restassured.RestAssured.when;

import java.util.Base64;

import javax.ws.rs.core.HttpHeaders;

import org.apache.http.HttpStatus;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.jayway.restassured.RestAssured;

/**
 * @author Askar Akhmerov
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(
    classes = { CamundaSpringBootExampleApplication.class },
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
public class AuthenticationTest {
  @Value("${local.server.port}")
  int port;

  @Before
  public void setUp() {
    RestAssured.port = port;
  }

  @Test
  public void verifyCanAccessWithAuthentication() {
    String basicValue = Base64.getEncoder().encodeToString("demo:demo".getBytes());
    //then
    given().
        header(HttpHeaders.AUTHORIZATION,"Basic " + basicValue).
    when().
        get("/engine/default/user").
    then().
        statusCode(HttpStatus.SC_OK);
  }

  @Test
  public void verifyCantAccessWithoutAuthentication() {
    when().
        get("/engine/default/user").
    then().
        statusCode(HttpStatus.SC_UNAUTHORIZED);
  }
}
