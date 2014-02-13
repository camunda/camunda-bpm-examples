package org.camunda.bpm.cockpit.plugin.sample;

import java.util.List;

import org.camunda.bpm.cockpit.Cockpit;
import org.camunda.bpm.cockpit.db.QueryParameters;
import org.camunda.bpm.cockpit.db.QueryService;
import org.camunda.bpm.cockpit.plugin.sample.db.ProcessInstanceCountDto;
import org.camunda.bpm.cockpit.plugin.spi.CockpitPlugin;
import org.camunda.bpm.cockpit.plugin.test.AbstractCockpitPluginTest;
import org.junit.Assert;
import org.junit.Test;

/**
*
* @author nico.rehwaldt
*/
public class SamplePluginsTest extends AbstractCockpitPluginTest {

  @Test
  public void testPluginDiscovery() {
    CockpitPlugin samplePlugin = Cockpit.getRuntimeDelegate().getPluginRegistry().getPlugin("sample-plugin");

    Assert.assertNotNull(samplePlugin);
  }

  @Test
  public void testSampleQueryWorks() {

    QueryService queryService = getQueryService();

    List<ProcessInstanceCountDto> instanceCounts =
      queryService
        .executeQuery(
          "cockpit.sample.selectProcessInstanceCountsByProcessDefinition",
          new QueryParameters<ProcessInstanceCountDto>());

    Assert.assertEquals(0, instanceCounts.size());
  }

}
