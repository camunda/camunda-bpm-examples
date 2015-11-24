package org.camunda.bpm.cockpit.plugin.failedjobs.resources;

import javax.ws.rs.Path;
//import javax.ws.rs.PathParam;

import org.camunda.bpm.cockpit.plugin.failedjobs.FailedJobsPlugin;
import org.camunda.bpm.cockpit.plugin.resource.AbstractPluginRootResource;

@Path("plugin/" + FailedJobsPlugin.ID)
public class FailedJobsPluginRootResource extends AbstractPluginRootResource {

  public FailedJobsPluginRootResource() {
    super(FailedJobsPlugin.ID);
  }

}
