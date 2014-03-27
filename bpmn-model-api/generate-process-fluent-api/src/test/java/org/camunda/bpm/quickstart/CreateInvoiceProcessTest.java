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

import java.util.HashMap;
import java.util.Map;

import org.camunda.bpm.engine.task.TaskQuery;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.example.invoice.service.ArchiveInvoiceService;
import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.GatewayDirection;
import org.junit.Rule;
import org.junit.Test;

/**
 * @author Sebastian Menski
 */
public class CreateInvoiceProcessTest {

  @Rule
  public ProcessEngineRule processEngine = new ProcessEngineRule();

  @Test
  public void testCreateInvoiceProcess() throws Exception {
    BpmnModelInstance modelInstance = Bpmn.createExecutableProcess("invoice")
      .name("BPMN API Invoice Process")
      .startEvent()
        .name("Invoice received")
      .userTask()
        .name("Assign Approver")
        .camundaAssignee("demo")
      .userTask()
        .id("approveInvoice")
        .name("Approve Invoice")
      .exclusiveGateway()
        .name("Invoice approved?")
        .gatewayDirection(GatewayDirection.Diverging)
      .condition("yes", "${approved}")
      .userTask()
        .name("Prepare Bank Transfer")
        .camundaFormKey("embedded:app:forms/prepare-bank-transfer.html")
        .camundaCandidateGroups("accounting")
      .serviceTask()
        .name("Archive Invoice")
        .camundaClass("org.camunda.bpm.example.invoice.service.ArchiveInvoiceService")
      .endEvent()
        .name("Invoice processed")
      .moveToLastGateway()
      .condition("no", "${!approved}")
      .userTask()
        .name("Review Invoice")
        .camundaAssignee("demo")
      .exclusiveGateway()
        .name("Review successful?")
        .gatewayDirection(GatewayDirection.Diverging)
      .condition("no", "${!clarified}")
      .endEvent()
        .name("Invoice not processed")
      .moveToLastGateway()
      .condition("yes", "${clarified}")
      .connectTo("approveInvoice")
      .done();

      // deploy process model
      processEngine.getRepositoryService().createDeployment().addModelInstance("invoice.bpmn", modelInstance).deploy();

      // start process model
      processEngine.getRuntimeService().startProcessInstanceByKey("invoice");

      TaskQuery taskQuery = processEngine.getTaskService().createTaskQuery();
      // check and complete task "Assign Approver"
      org.junit.Assert.assertEquals(1, taskQuery.count());
      processEngine.getTaskService().complete(taskQuery.singleResult().getId());

      // check and complete task "Approve Invoice"
      Map<String, Object> variables = new HashMap<String, Object>();
      variables.put("approved", true);

      org.junit.Assert.assertEquals(1, taskQuery.count());
      processEngine.getTaskService().complete(taskQuery.singleResult().getId(), variables);

      // check and complete task "Prepare Bank Transfer"
      org.junit.Assert.assertEquals(1, taskQuery.count());
      processEngine.getTaskService().complete(taskQuery.singleResult().getId());

      // check if Delegate was executed
      org.junit.Assert.assertEquals(true, ArchiveInvoiceService.wasExecuted);

      // check if process instance is ended
      org.junit.Assert.assertEquals(0, processEngine.getRuntimeService().createProcessInstanceQuery().count());

      /**
       * to see the BPMN 2.0 process model XML on the console log
       * copy the following code line at the end of the test case
       *
       * Bpmn.writeModelToStream(System.out, modelInstance);
       */
  }
}
