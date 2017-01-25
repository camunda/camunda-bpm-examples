package org.camunda.bpm.example.authentication.rest;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.rest.spi.ProcessEngineProvider;

import java.util.Set;

public class RestProcessEngineProvider implements ProcessEngineProvider {

	public ProcessEngine getDefaultProcessEngine() {
		return ProcessEngines.getDefaultProcessEngine();
	}

	public ProcessEngine getProcessEngine(String name) {
		return ProcessEngines.getProcessEngine(name);
	}

	public Set<String> getProcessEngineNames() {
		return ProcessEngines.getProcessEngines().keySet();
	}

}
