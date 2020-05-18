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
    ExampleDto exampleDto = new ExampleDto("prop1", "shouldBeIgnored", "prop3");
    ObjectValue typedObjectValue = Variables.objectValue(exampleDto)
        .serializationDataFormat(Variables.SerializationDataFormats.JSON)
        .create();
    vars.put("variable", typedObjectValue);
    // start a new instance of our process with that variable
    processEngine.getRuntimeService().startProcessInstanceByKey("waitingProcess", vars);
  }

}
