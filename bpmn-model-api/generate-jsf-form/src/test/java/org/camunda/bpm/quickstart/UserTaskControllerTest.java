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

import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineTestCase;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;

/**
 * @author Sebastian Menski
 */
public class UserTaskControllerTest extends ProcessEngineTestCase {

  private final static String TASK_ID = "UserTask_1";

  public void testExpressionExpression() {
    Matcher matcher = UserTaskController.EXPRESSION_PATTERN.matcher("${do == 'close'}");
    assertTrue(matcher.matches());
    assertEquals("do", matcher.group(1));
    assertEquals("close", matcher.group(2));
    matcher = UserTaskController.EXPRESSION_PATTERN.matcher("#{ do=='close' }");
    assertTrue(matcher.matches());
    assertEquals("do", matcher.group(1));
    assertEquals("close", matcher.group(2));
    matcher = UserTaskController.EXPRESSION_PATTERN.matcher("${do == 'escalate'}");
    assertTrue(matcher.matches());
    assertEquals("do", matcher.group(1));
    assertEquals("escalate", matcher.group(2));
    matcher = UserTaskController.EXPRESSION_PATTERN.matcher("${do == 'respond'}");
    assertTrue(matcher.matches());
    assertEquals("do", matcher.group(1));
    assertEquals("respond", matcher.group(2));
  }

  @Deployment(resources = "support.bpmn")
  public void testGatewayNameSupport() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    UserTaskController userTaskController = new UserTaskController();

    String gatewayName = userTaskController.getGatewayName(TASK_ID, modelInstance);
    assertEquals(gatewayName, "How To Handle Support Ticket?");
  }

  @Deployment(resources = "support.bpmn")
  public void testButtonsSupport() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    UserTaskController userTaskController = new UserTaskController();

    List<Map<String,String>> buttons = userTaskController.getButtons(TASK_ID, modelInstance);
    assertEquals(buttons.size(), 3);

    Map<String, String> button = buttons.get(0);
    assertEquals(button.get("conditionName"), "Close ticket");
    assertEquals(button.get("variableName"), "do");
    assertEquals(button.get("variableValue"), "close");

    button = buttons.get(1);
    assertEquals(button.get("conditionName"), "Escalate ticket");
    assertEquals(button.get("variableName"), "do");
    assertEquals(button.get("variableValue"), "escalate");

    button = buttons.get(2);
    assertEquals(button.get("conditionName"), "Respond to customer");
    assertEquals(button.get("variableName"), "do");
    assertEquals(button.get("variableValue"), "respond");
  }

  @Deployment(resources = "feature.bpmn")
  public void testGatewayNameFeature() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    UserTaskController userTaskController = new UserTaskController();

    String gatewayName = userTaskController.getGatewayName(TASK_ID, modelInstance);
    assertEquals(gatewayName, "Accept Feature Request?");
  }

  @Deployment(resources = "feature.bpmn")
  public void testButtonsFeature() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    UserTaskController userTaskController = new UserTaskController();

    List<Map<String,String>> buttons = userTaskController.getButtons(TASK_ID, modelInstance);
    assertEquals(buttons.size(), 2);

    Map<String, String> button = buttons.get(0);
    assertEquals(button.get("conditionName"), "Accept");
    assertEquals(button.get("variableName"), "action");
    assertEquals(button.get("variableValue"), "accept");

    button = buttons.get(1);
    assertEquals(button.get("conditionName"), "Reject");
    assertEquals(button.get("variableName"), "action");
    assertEquals(button.get("variableValue"), "reject");
  }
}
