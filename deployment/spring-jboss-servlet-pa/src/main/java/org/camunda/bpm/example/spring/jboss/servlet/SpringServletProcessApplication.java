package org.camunda.bpm.example.spring.jboss.servlet;

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.PreUndeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.ServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;

@ProcessApplication
public class SpringServletProcessApplication extends ServletProcessApplication {

  @PostDeploy
  public void startProcess(ProcessEngine processEngine) {
    System.out.println("Invoking @PostDeploy annotation in " + getClass().getName());
    System.out.println("Starting testResolveBean processdefinition");
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBean");
    System.out.println("Starting testResolveBeanFromJobExecutor processdefinition");
    processEngine.getRuntimeService().startProcessInstanceByKey("testResolveBeanFromJobExecutor");
  }

  @PreUndeploy
  public void remove() {
    System.out.println("Invoking @PreUndeploy annotation in " + getClass().getName());
    System.out.println("Undeploying SpringServletProcessApplication-Example");
  }

}
