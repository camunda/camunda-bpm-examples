package org.camunda.bpm.example;

import javax.annotation.PostConstruct;

import org.camunda.bpm.engine.RuntimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CamundaSpringBootExampleApplication {

  @Autowired
  private RuntimeService runtimeService;

	public static void main(String[] args) {
		SpringApplication.run(CamundaSpringBootExampleApplication.class, args);
	}

	@PostConstruct
	public void startProcess() {
	  runtimeService.startProcessInstanceByKey("loanRequest");
	}

}
