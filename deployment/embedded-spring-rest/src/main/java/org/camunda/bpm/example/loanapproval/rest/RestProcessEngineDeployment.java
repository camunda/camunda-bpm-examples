package org.camunda.bpm.example.loanapproval.rest;

import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.core.Application;

import org.camunda.bpm.engine.rest.exception.ProcessEngineExceptionHandler;
import org.camunda.bpm.engine.rest.exception.RestExceptionHandler;
import org.camunda.bpm.engine.rest.impl.ProcessEngineRestServiceImpl;
import org.camunda.bpm.engine.rest.mapper.JacksonConfigurator;
import org.codehaus.jackson.jaxrs.JacksonJsonProvider;
import org.codehaus.jackson.jaxrs.JsonMappingExceptionMapper;
import org.codehaus.jackson.jaxrs.JsonParseExceptionMapper;

public class RestProcessEngineDeployment extends Application {

	@Override
	public Set<Class<?>> getClasses() {
		Set<Class<?>> classes = new HashSet<Class<?>>();
		classes.add(ProcessEngineRestServiceImpl.class);
	
		classes.add(JacksonConfigurator.class);
	
		classes.add(JacksonJsonProvider.class);
		classes.add(JsonMappingExceptionMapper.class);
		classes.add(JsonParseExceptionMapper.class);
	
		classes.add(ProcessEngineExceptionHandler.class);
		classes.add(RestExceptionHandler.class);
	
		return classes;
	}

}