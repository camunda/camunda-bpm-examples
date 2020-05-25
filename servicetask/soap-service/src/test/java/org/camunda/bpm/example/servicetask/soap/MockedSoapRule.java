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
package org.camunda.bpm.example.servicetask.soap;

import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.junit.WireMockClassRule;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.containing;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.junit.Assert.fail;

public class MockedSoapRule extends WireMockClassRule {

  protected static final String MOCKED_HOST = "localhost";
  protected static final int MOCKED_PORT = 4545;
  protected static final String MOCKED_BASE_URL = "http://" + MOCKED_HOST + ":" + 4545;
  protected static final String MOCKED_SOAP_ACTION = MOCKED_BASE_URL + "/GetWeather";
  protected static final String MOCKED_SERVICE_PATH = "/globalweather";

  public MockedSoapRule(WireMockConfiguration options) {
    super(options);
  }

  protected void response(String responseFilename, String city) {
    String responseWrapperAsString = readFile("response_wrapper.xml");
    String responseAsString = readFile(responseFilename);

    if (responseWrapperAsString != null && responseAsString != null) {
      String response = responseWrapperAsString
          .replace("$NS_PLACEHOLDER", MOCKED_BASE_URL)
          .replace("$CONTENT_PLACEHOLDER", responseAsString);

      stubFor(post(urlEqualTo(MOCKED_SERVICE_PATH))
          .withHeader("Content-Type",
              equalTo("application/soap+xml;charset=UTF-8;action=\"" + MOCKED_SOAP_ACTION + "\""))
          .withRequestBody(containing("<web:CityName>" + city + "</web:CityName>"))
          .withRequestBody(containing("<web:CountryName>Germany</web:CountryName>"))
          .willReturn(aResponse()
              .withStatus(200)
              .withHeader("Content-Type", "application/soap+xml")
              .withBody(response)
          ));
    }
  }

  protected String readFile(String path) {
    byte[] responseWrapper = new byte[0];
    Path responsePath = Paths.get("src/test/resources/" + path);
    try {
      responseWrapper = Files.readAllBytes(responsePath);

    } catch (IOException e) {
      fail("Unexpected Exception!");

    }

    if (responseWrapper.length > 0) {
      return new String(responseWrapper, StandardCharsets.UTF_8);

    } else {
      return null;

    }
  }

}
