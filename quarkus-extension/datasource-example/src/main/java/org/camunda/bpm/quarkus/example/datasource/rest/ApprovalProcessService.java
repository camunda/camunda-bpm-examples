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
package org.camunda.bpm.quarkus.example.datasource.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import org.camunda.bpm.quarkus.example.datasource.ApprovalServiceBean;

@Path("/approval-process")
public class ApprovalProcessService {

  @Inject
  protected ApprovalServiceBean approvalServiceBean;

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("/{amount}")
  public String evaluateAmount(@PathParam("amount") int amount) {
    try {
      return approvalServiceBean.evaluateForApproval(amount);
    } catch (IllegalArgumentException ex) {
      return "Please provide a positive integer value";
    }
  }

}