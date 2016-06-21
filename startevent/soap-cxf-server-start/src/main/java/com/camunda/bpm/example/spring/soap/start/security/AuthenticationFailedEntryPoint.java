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

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

/**
 * 
 * Handles failed authentication.
 * 
 */

public class AuthenticationFailedEntryPoint implements AuthenticationEntryPoint {

  private String realmName;

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); 
    response.addHeader("WWW-Authenticate", "Basic realm=\"" + realmName + "\"");
  }

  public String getRealmName() {
    return realmName;
  }

  public void setRealmName(String realmName) {
    this.realmName = realmName;
  }	
}