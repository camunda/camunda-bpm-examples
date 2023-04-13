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

import java.time.Duration;
import java.time.Instant;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
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

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("/benchmark/{times}")
  public String performNTimesEvaluateAmount(@PathParam("times") int times) {
    try {
      var start = Instant.now();
      for (int i = 0; i < times; i++) {
        approvalServiceBean.evaluateForApproval(1);
      }
      var finish = Instant.now();
      var timeElapsed = Duration.between(start, finish).toMillis();
      return "Average time for performing evaluateAmount:" + ((double) timeElapsed / times) + " μs";
    } catch (IllegalArgumentException ex) {
      return "Please provide a positive integer value";
    }
  }

}