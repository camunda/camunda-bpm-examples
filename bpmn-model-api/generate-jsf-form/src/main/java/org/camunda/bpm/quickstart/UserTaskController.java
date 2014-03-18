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
import org.camunda.bpm.engine.cdi.BusinessProcess;
import org.camunda.bpm.engine.cdi.jsf.TaskForm;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.ExclusiveGateway;
import org.camunda.bpm.model.bpmn.instance.SequenceFlow;
import org.camunda.bpm.model.bpmn.instance.UserTask;

import javax.inject.Inject;
import javax.inject.Named;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Sebastian Menski
 */
@Named
public class UserTaskController {

  @Inject
  RepositoryService repositoryService;

  @Inject
  BusinessProcess businessProcess;

  @Inject
  @Named("camundaTaskForm")
  TaskForm taskForm;

  protected static Pattern EXPRESSION_PATTERN = Pattern.compile("[\\$#]\\{\\s*(\\w+)\\s*==\\s*'([^']+)'\\s*}");

  /**
   * Gets the name of the exclusive gateway.
   *
   * @return the name attribute value of the exclusive gateway
   */
  public String getQuestion() {
    String taskId = getTaskId();
    BpmnModelInstance modelInstance = getModelInstance();
    return getGatewayName(taskId, modelInstance);
  }

  /**
   * Returns the name of the following exclusive gateway.
   *
   * @param taskId  the ID of the current task
   * @param modelInstance  the BPMN model instance
   * @return the name attribute value of the following exclusive gateway
   */
  protected String getGatewayName(String taskId, BpmnModelInstance modelInstance) {
    ExclusiveGateway gateway = getExclusiveGateway(taskId, modelInstance);
    return stripLineBreaks(gateway.getName());
  }

  /**
   * Returns a list of button values for every outgoing conditional sequence flows.
   *
   * @return a list of button values as a map
   */
  public List<Map<String, String>> getButtons() {
    String taskId = getTaskId();
    BpmnModelInstance modelInstance = getModelInstance();
    return getButtons(taskId, modelInstance);
  }

  /**
   * Returns a list of values for each button to generate.
   *
   * @param taskId  the ID of the current task
   * @param modelInstance the BPMN model instance
   * @return the list of button values
   */
  protected List<Map<String, String>> getButtons(String taskId, BpmnModelInstance modelInstance) {
    ExclusiveGateway gateway = getExclusiveGateway(taskId, modelInstance);

    List<Map<String, String>> buttonValues = new ArrayList<Map<String, String>>();
    for (SequenceFlow sequenceFlow : gateway.getOutgoing()) {
      buttonValues.add(getConditionValues(sequenceFlow));
    }

    return buttonValues;
  }

  /**
   * Gets the condition name, variable name and value for a sequence flow.
   *
   * @param sequenceFlow  the sequence flow with the condition
   * @return the value map for this condition
   */
  private Map<String, String> getConditionValues(SequenceFlow sequenceFlow) {
    Map<String, String> values = new HashMap<String, String>();

    values.put("conditionName", stripLineBreaks(sequenceFlow.getName()));

    String condition = sequenceFlow.getConditionExpression().getTextContent();
    Matcher matcher = EXPRESSION_PATTERN.matcher(condition);
    if (matcher.matches()) {
      values.put("variableName", stripLineBreaks(matcher.group(1)));
      values.put("variableValue", stripLineBreaks(matcher.group(2)));
    }

    return values;
  }

  /**
   * Completes the user task and sets value of the variable with <code>variableName</code> to <code>variableValue</code>.
   *
   * @param variableName  the name of the variable to set
   * @param variableValue  the value to set the variable to
   * @throws IOException if the task completion fails
   */
  public void completeTask(String variableName, String variableValue) throws IOException {
    businessProcess.setVariable(variableName, variableValue);
    taskForm.completeTask();
  }


  /**
   * Gets the current BPMN model instance.
   *
   * @return the BPMN model instance
   */
  private BpmnModelInstance getModelInstance() {
    String processDefinitionId = businessProcess.getTask().getProcessDefinitionId();
    return repositoryService.getBpmnModelInstance(processDefinitionId);
  }

  /**
   * Gets the ID of the current task.
   *
   * @return the task ID
   */
  private String getTaskId() {
    return businessProcess.getTask().getTaskDefinitionKey();
  }

  /**
   * Gets the succeeding exclusive gateway of the current task.
   *
   * @param taskId  the ID of the current task
   * @param modelInstance  the BPMN model instance
   * @return the succeeding exclusive gateway element
   */
  private ExclusiveGateway getExclusiveGateway(String taskId, BpmnModelInstance modelInstance) {
    UserTask userTask = (UserTask) modelInstance.getModelElementById(taskId);
    return (ExclusiveGateway) userTask.getSucceedingNodes().singleResult();
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
