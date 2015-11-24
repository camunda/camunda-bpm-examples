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

/**
 * @author Sebastian Menski
 */
public class StartEventControllerTest extends ProcessEngineTestCase {

  @Deployment(resources = "support.bpmn")
  public void testStartEventNameSupport() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    StartEventController startEventController = new StartEventController();

    String startEventName = startEventController.getStartEventName(modelInstance);
    assertEquals(startEventName, "Select Support Ticket");
  }

  @Deployment(resources = "support.bpmn")
  public void testUserTaskNameSupport() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    StartEventController startEventController = new StartEventController();
    String userTaskName = startEventController.getUserTaskName(modelInstance);
    assertEquals(userTaskName, "Handle Support Ticket");
  }

  @Deployment(resources = "feature.bpmn")
  public void testStartEventNameFeature() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    StartEventController startEventController = new StartEventController();

    String startEventName = startEventController.getStartEventName(modelInstance);
    assertEquals(startEventName, "Create Feature Request");
  }

  @Deployment(resources = "feature.bpmn")
  public void testUserTaskNameFeature() {
    String processId = repositoryService.createProcessDefinitionQuery().singleResult().getId();
    BpmnModelInstance modelInstance = repositoryService.getBpmnModelInstance(processId);

    StartEventController startEventController = new StartEventController();

    String userTaskName = startEventController.getUserTaskName(modelInstance);
    assertEquals(userTaskName, "Handle Feature Request");
  }
}
