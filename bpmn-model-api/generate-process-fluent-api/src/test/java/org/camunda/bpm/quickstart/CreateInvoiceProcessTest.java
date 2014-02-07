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

import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelException;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.GatewayDirection;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

/**
 * @author Sebastian Menski
 */
public class CreateInvoiceProcessTest {

  @Test
  public void testCreateInvoiceProcess() throws Exception {
    BpmnModelInstance modelInstance = Bpmn.createProcess()
      .name("BPMN API Invoice Process")
      .executable()
      .startEvent()
        .name("Invoice received")
        .formKey("embedded:app:forms/start-form.html")
      .userTask()
        .name("Assign Approver")
        .formKey("embedded:app:forms/assign-approver.html")
        .assignee("demo")
      .userTask()
        .id("approveInvoice")
        .name("Approve Invoice")
        .formKey("embedded:app:forms/approve-invoice.html")
        .assignee("${approver}")
      .exclusiveGateway()
        .name("Invoice approved?")
        .gatewayDirection(GatewayDirection.Diverging)
      .condition("yes", "${approved}")
      .userTask()
        .name("Prepare Bank Transfer")
        .formKey("embedded:app:forms/prepare-bank-transfer.html")
        .candidateGroups("accounting")
      .serviceTask()
        .name("Archive Invoice")
        .className("org.camunda.bpm.example.invoice.service.ArchiveInvoiceService")
      .endEvent()
        .name("Invoice processed")
      .parallel()
      .condition("no", "${!approved}")
      .userTask()
        .name("Review Invoice")
        .formKey("embedded:app:forms/review-invoice.html" )
        .assignee("demo")
      .exclusiveGateway()
        .name("Review successful?")
        .gatewayDirection(GatewayDirection.Diverging)
      .condition("no", "${!clarified}")
      .endEvent()
        .name("Invoice not processed")
      .parallel()
      .condition("yes", "${clarified}")
      .connectTo("approveInvoice")
      .done();

    URL resourceUri = getClass().getClassLoader().getResource("invoice.bpmn");
    if (resourceUri != null) {
      File resourceFile = new File(resourceUri.toURI());
      Bpmn.writeModelToFile(resourceFile, modelInstance);
    }
    else {
      throw new BpmnModelException("Unable to get path for invoice.bpmn");
    }
  }
}
