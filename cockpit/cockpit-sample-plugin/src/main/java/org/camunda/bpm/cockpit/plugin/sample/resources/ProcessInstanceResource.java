package org.camunda.bpm.cockpit.plugin.sample.resources;

import java.util.List;
import javax.ws.rs.GET;

import org.camunda.bpm.cockpit.db.QueryParameters;
import org.camunda.bpm.cockpit.plugin.resource.AbstractPluginResource;
import org.camunda.bpm.cockpit.plugin.sample.db.ProcessInstanceCountDto;

/**
 *
 * @author nico.rehwaldt
 */
public class ProcessInstanceResource extends AbstractPluginResource {

  public ProcessInstanceResource(String engineName) {
    super(engineName);
  }

  @GET
  public List<ProcessInstanceCountDto> getProcessInstanceCounts() {

    return getQueryService()
        .executeQuery(
          "cockpit.sample.selectProcessInstanceCountsByProcessDefinition",
          new QueryParameters<ProcessInstanceCountDto>());
  }
}
