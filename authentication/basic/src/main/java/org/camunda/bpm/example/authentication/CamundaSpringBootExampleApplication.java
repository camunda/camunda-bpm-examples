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
import org.jboss.resteasy.plugins.server.servlet.FilterDispatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportResource;

import javax.annotation.PostConstruct;

@SpringBootApplication
@Configuration
@ImportResource("classpath*:applicationContext.xml")
public class CamundaSpringBootExampleApplication extends SpringBootServletInitializer {
	private static final String EMAIL = "demo@camunda.org";

	@Autowired
	private IdentityService identityService;

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

	public static void main(String[] args) {
		configureApplication(new SpringApplicationBuilder()).run(args);
	}

	private static SpringApplicationBuilder configureApplication(SpringApplicationBuilder builder) {
		return builder.sources(CamundaSpringBootExampleApplication.class).bannerMode(Banner.Mode.OFF);
	}

	@Bean
	public FilterRegistrationBean<ProcessEngineAuthenticationFilter> authenticationFilter() {
		FilterRegistrationBean<ProcessEngineAuthenticationFilter> registration =
				new FilterRegistrationBean<>();
		ProcessEngineAuthenticationFilter myFilter = new ProcessEngineAuthenticationFilter();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("authentication-provider",
				"org.camunda.bpm.engine.rest.security.auth.impl.HttpBasicAuthenticationProvider");
		registration.setName("camunda-auth");
		registration.setOrder(1);
		return registration;
	}

	@Bean
	public FilterRegistrationBean<FilterDispatcher> restEasyFilter() {
		FilterRegistrationBean<FilterDispatcher> registration = new FilterRegistrationBean<>();
		FilterDispatcher myFilter = new FilterDispatcher();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("javax.ws.rs.Application",
				"org.camunda.bpm.example.authentication.rest.RestProcessEngineDeployment");
		registration.setName("Resteasy");
		registration.setOrder(10);
		return registration;
	}

}
