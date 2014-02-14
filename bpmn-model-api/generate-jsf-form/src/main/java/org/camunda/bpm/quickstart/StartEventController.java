/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

package org.camunda.bpm.quickstart;

import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.StartEvent;
import org.camunda.bpm.model.bpmn.instance.UserTask;
import org.camunda.bpm.model.xml.type.ModelElementType;

import javax.inject.Inject;
import javax.inject.Named;

/**
 * @author Sebastian Menski
 */
@Named
public class StartEventController {

  @Inject
  RepositoryService repositoryService;

  /**
   * Returns the name of the start event.
   *
   * @param processDefinitionKey  the process definition key of the running process
   * @return the name attribute value of the start event
   */
  public String getStartEventName(String processDefinitionKey) {
    BpmnModelInstance modelInstance = getModelInstance(processDefinitionKey);
    return getStartEventName(modelInstance);
  }

  /**
   * Returns the name of the start event.
   *
   * @param modelInstance  the BPMN model instance
   * @return the name attribute value of the start event
   */
  protected String getStartEventName(BpmnModelInstance modelInstance) {
    StartEvent startEvent = getStartEvent(modelInstance);
    return stripLineBreaks(startEvent.getName());
  }

  /**
   * Returns the name of the user task after the start event.
   *
   * @param processDefinitionKey  the process definition key of the running process
   * @return the name attribute value of the user task
   */
  public String getUserTaskName(String processDefinitionKey) {
    BpmnModelInstance modelInstance = getModelInstance(processDefinitionKey);
    return getUserTaskName(modelInstance);
  }

  /**
   * Returns the name of the user task after the start event.
   *
   * @param modelInstance  the BPMN model instance
   * @return the name attribute value of the user task
   */
  protected String getUserTaskName(BpmnModelInstance modelInstance) {
    StartEvent startEvent = getStartEvent(modelInstance);
    UserTask userTask = (UserTask) startEvent.getSucceedingNodes().singleResult();
    return stripLineBreaks(userTask.getName());
  }


  /**
   * Gets the BPMN model instance for a process definition key.
   *
   * @param processDefinitionKey  the process definition key of the running process
   * @return the BPMN model instance
   */
  private BpmnModelInstance getModelInstance(String processDefinitionKey) {
    String processId = repositoryService.createProcessDefinitionQuery().processDefinitionKey(processDefinitionKey).latestVersion().singleResult().getId();
    return repositoryService.getBpmnModelInstance(processId);
  }

  /**
   * Gets the start event of the process.
   *
   * @param modelInstance  the process model as stream
   * @return the start event of the process
   */
  private StartEvent getStartEvent(BpmnModelInstance modelInstance) {
    ModelElementType startEventType = modelInstance.getModel().getType(StartEvent.class);
    return (StartEvent) modelInstance.getModelElementsByType(startEventType).iterator().next();
  }

  /**
   * Removes line breaks inside the string.
   *
   * @param text  the text to remove line breaks from
   * @return the stripped text
   */
  private String stripLineBreaks(String text) {
    return text.trim().replaceAll("\n", " ");
  }
}
