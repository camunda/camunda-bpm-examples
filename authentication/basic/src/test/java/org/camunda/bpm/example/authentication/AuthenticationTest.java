package org.camunda.bpm.example.authentication;

import com.jayway.restassured.RestAssured;
import org.apache.http.HttpStatus;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.WebIntegrationTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.ws.rs.core.HttpHeaders;
import java.util.Base64;

import static com.jayway.restassured.RestAssured.given;
import static com.jayway.restassured.RestAssured.when;

/**
 * @author Askar Akhmerov
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = CamundaSpringBootExampleApplication.class)
@WebIntegrationTest("server.port:0")
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
