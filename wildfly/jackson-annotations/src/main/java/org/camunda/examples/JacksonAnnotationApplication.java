package org.camunda.examples;

import org.camunda.bpm.application.PostDeploy;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.ServletProcessApplication;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.ObjectValue;

import java.util.Map;

@ProcessApplication("Jackson Annotation App")
public class JacksonAnnotationApplication extends ServletProcessApplication {
  /*
  **
   * The {@literal @}PostDeploy method is invoked when the deployment of all BPMN 2.0 processes is complete.
   * The process engine can be injected.
   */
  @PostDeploy
  public void startProcessInstance(ProcessEngine processEngine) {
    //create typed variable with json as serialization format
    Map<String, Object> vars = Variables.createVariables();
    ExampleDto exampleDto = new ExampleDto("prop1", "shouldBeIgnored", "prop2");
    ObjectValue typedObjectValue = Variables.objectValue(exampleDto).serializationDataFormat(Variables.SerializationDataFormats.JSON).create();
    vars.put("variable", typedObjectValue);
    // start a new instance of our process with that variable
    processEngine.getRuntimeService().startProcessInstanceByKey("waitingProcess", vars);
  }

}
