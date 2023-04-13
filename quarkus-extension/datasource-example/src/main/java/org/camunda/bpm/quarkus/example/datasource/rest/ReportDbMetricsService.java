package org.camunda.bpm.quarkus.example.datasource.rest;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.ProcessEngineException;

@Path("/report-db-metrics")
public class ReportDbMetricsService {

  @Inject
  private ManagementService managementService;

  public ReportDbMetricsService(ManagementService managementService) {
    this.managementService = managementService;
  }

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("/now")
  public String reportDbMetricsNow() {
    try {
      managementService.reportDbMetricsNow();
      return "OK";
    } catch (ProcessEngineException ex) {
      return ex.getMessage();
    }
  }

}
