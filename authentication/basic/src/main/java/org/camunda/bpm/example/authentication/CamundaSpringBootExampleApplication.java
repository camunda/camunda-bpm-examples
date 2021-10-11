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

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.identity.User;
import org.camunda.bpm.engine.rest.security.auth.ProcessEngineAuthenticationFilter;
import org.camunda.bpm.engine.rest.security.auth.impl.HttpBasicAuthenticationProvider;
import org.camunda.bpm.example.authentication.rest.RestProcessEngineDeployment;
import org.jboss.resteasy.plugins.server.servlet.FilterDispatcher;
import org.jboss.resteasy.plugins.server.servlet.HttpServletDispatcher;
import org.jboss.resteasy.plugins.server.servlet.ResteasyBootstrap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportResource;

import javax.annotation.PostConstruct;
import javax.servlet.ServletContextListener;

@SpringBootApplication
@Configuration
@ImportResource("classpath*:applicationContext.xml")
public class CamundaSpringBootExampleApplication extends SpringBootServletInitializer {

  protected static final String EMAIL = "demo@camunda.org";

  @Autowired
  protected IdentityService identityService;

  @PostConstruct
  public void initDemoUser() {
    User newUser = identityService.newUser("demo");
    newUser.setPassword("demo");
    newUser.setEmail(EMAIL);
    identityService.saveUser(newUser);
  }

  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
    return configureApplication(builder);
  }

  public static void main(String... args) {
    configureApplication(new SpringApplicationBuilder()).run(args);
  }

  protected static SpringApplicationBuilder configureApplication(SpringApplicationBuilder builder) {
    return builder.sources(CamundaSpringBootExampleApplication.class).bannerMode(Banner.Mode.OFF);
  }

  @Bean
  public FilterRegistrationBean<ProcessEngineAuthenticationFilter> authenticationFilter() {
    FilterRegistrationBean<ProcessEngineAuthenticationFilter> registration = new FilterRegistrationBean<>();
    ProcessEngineAuthenticationFilter myFilter = new ProcessEngineAuthenticationFilter();
    registration.setFilter(myFilter);
    registration.addUrlPatterns("/*");
    registration.addInitParameter("authentication-provider", HttpBasicAuthenticationProvider.class.getName());
    registration.setName("camunda-auth");
    registration.setOrder(1);
    return registration;
  }

  @Bean
  public ServletRegistrationBean<HttpServletDispatcher> restEasyServlet() {
    ServletRegistrationBean<HttpServletDispatcher> registrationBean = new ServletRegistrationBean<>();
    registrationBean.setServlet(new HttpServletDispatcher());
    registrationBean.setName("restEasy-servlet");
    registrationBean.addUrlMappings("/*");
    registrationBean.addInitParameter("javax.ws.rs.Application", RestProcessEngineDeployment.class.getName());
    return registrationBean;
  }

}
