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
package org.camunda.bpm.quarkus.example.rest;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.camunda.commons.utils.IoUtil;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.io.InputStream;

@Path("/store-order-items")
@Produces("application/json")
public class StartProcessRestResource {

  @Inject
  public RuntimeService runtimeService;

  @POST
  @Consumes("application/json")
  public void startProcess(InputStream payload) {
    String orderItemsAsString = IoUtil.inputStreamAsString(payload);

    ObjectValue orderItems = Variables.serializedObjectValue(orderItemsAsString)
        .objectTypeName("java.util.ArrayList<org.camunda.bpm.quarkus.example.dto.OrderItem>")
        .serializationDataFormat(Variables.SerializationDataFormats.JSON)
        .create();

    runtimeService.startProcessInstanceByKey("order-item-process",
        Variables.putValueTyped("orderItems", orderItems));
  }

}