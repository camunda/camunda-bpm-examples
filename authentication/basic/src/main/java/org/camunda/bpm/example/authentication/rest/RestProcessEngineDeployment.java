package org.camunda.bpm.example.authentication.rest;

import org.camunda.bpm.engine.rest.impl.CamundaRestResources;

import javax.ws.rs.core.Application;
import java.util.HashSet;
import java.util.Set;

public class RestProcessEngineDeployment extends Application {

  @Override
  public Set<Class<?>> getClasses() {
    Set<Class<?>> classes = new HashSet<Class<?>>();

    classes.addAll(CamundaRestResources.getResourceClasses());
    classes.addAll(CamundaRestResources.getConfigurationClasses());

    return classes;
  }

}