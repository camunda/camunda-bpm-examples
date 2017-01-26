package org.camunda.bpm.example.authentication;


import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.identity.User;
import org.camunda.bpm.engine.rest.filter.CacheControlFilter;
import org.camunda.bpm.engine.rest.security.auth.ProcessEngineAuthenticationFilter;
import org.jboss.resteasy.plugins.server.servlet.FilterDispatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportResource;

import javax.annotation.PostConstruct;
import javax.servlet.Filter;

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
	public FilterRegistrationBean authenticationFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		Filter myFilter = new ProcessEngineAuthenticationFilter();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("authentication-provider","org.camunda.bpm.engine.rest.security.auth.impl.HttpBasicAuthenticationProvider");
		registration.setName("camunda-auth");
		registration.setOrder(1);
		return registration;
	}

	@Bean
	public FilterRegistrationBean restEasyFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		Filter myFilter = new FilterDispatcher();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("javax.ws.rs.Application","org.camunda.bpm.example.authentication.rest.RestProcessEngineDeployment");
		registration.setName("Resteasy");
		registration.setOrder(10);
		return registration;
	}

}
