package org.camunda.bpm.tutorial.multitenancy;

import static org.camunda.spin.Spin.JSON;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.junit.Assert.assertThat;

import java.io.File;

import org.camunda.bpm.BpmPlatform;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.Job;
import org.camunda.bpm.engine.runtime.JobQuery;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.TaskQuery;
import org.camunda.connect.Connectors;
import org.camunda.connect.httpclient.HttpRequest;
import org.camunda.connect.httpclient.HttpResponse;
import org.camunda.connect.spi.Connector;
import org.camunda.connect.spi.ConnectorRequest;
import org.camunda.connect.spi.ConnectorResponse;
import org.camunda.spin.SpinList;
import org.camunda.spin.json.SpinJsonNode;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.asset.EmptyAsset;
import org.jboss.shrinkwrap.api.spec.WebArchive;
import org.jboss.shrinkwrap.resolver.api.maven.Maven;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(Arquillian.class)
public class ProcessIntegrationTest {

  private static final String PROCESS_DEFINITION_URL = "http://localhost:8080/multi-tenancy-tutorial/process-definition";

  @Deployment
  public static WebArchive createDeployment() {
    // resolve given dependencies from Maven POM
    File[] libs = Maven.resolver()
      .offline(false)
      .loadPomFromFile("pom.xml")
      .importCompileAndRuntimeDependencies().resolve().withoutTransitivity().asFile();

    return ShrinkWrap
      .create(WebArchive.class, "multi-tenancy-tutorial.war")
      // add needed dependencies
      .addAsLibraries(libs)
      // prepare as process application archive for Camunda BPM Platform
      .addAsResource("META-INF/processes.xml", "META-INF/processes.xml")
      // enable CDI
      .addAsWebInfResource(EmptyAsset.INSTANCE, "beans.xml")
      // add process application classes
      .addPackages(false, "org.camunda.bpm.tutorial.multitenancy")
      // add process definitions
      .addAsResource("processes/tenant1/tenant1_process.bpmn")
      .addAsResource("processes/tenant2/tenant2_process.bpmn");
  }

  private ProcessEngine processEngine;
  private RuntimeService runtimeService;
  private TaskService taskService;
  private ManagementService managementService;

  @Before
  public void setup() {
    processEngine = BpmPlatform.getProcessEngineService().getProcessEngine("tenant2");
    assertThat(processEngine, is(notNullValue()));

    runtimeService = processEngine.getRuntimeService();
    taskService = processEngine.getTaskService();
    managementService = processEngine.getManagementService();
  }

  @Test(timeout = 30000)
  public void asynchronousServiceTask() throws Exception {

    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("tenant2-process");

    Job job = managementService.createJobQuery().processInstanceId(processInstance.getId()).executable().singleResult();
    assertThat(job, is(notNullValue()));

    waitForExecutingJobs(processInstance.getId());

    TaskQuery taskQuery = taskService.createTaskQuery().processInstanceId(processInstance.getId());
    assertThat(taskQuery.count(), is(1L));
  }

  @Test
  public void getProcessDefinitionsOfTenantOne() {
    SpinJsonNode json = requestProcessDefinitionsForUser("kermit");

    SpinList<SpinJsonNode> definitions = json.elements();
    assertThat(definitions.size(), is(1));

    String processDefinitionKey = definitions.get(0).prop("key").stringValue();
    assertThat(processDefinitionKey, is("tenant1-process"));
  }

  @Test
  public void getProcessDefinitionsOfTenantTwo() {
    SpinJsonNode json = requestProcessDefinitionsForUser("gonzo");

    SpinList<SpinJsonNode> definitions = json.elements();
    assertThat(definitions.size(), is(1));

    String processDefinitionKey = definitions.get(0).prop("key").stringValue();
    assertThat(processDefinitionKey, is("tenant2-process"));
  }

  private void waitForExecutingJobs(String processInstanceId) {
    JobQuery jobQuery = managementService.createJobQuery().processInstanceId(processInstanceId).executable();

    while (jobQuery.count() > 0) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException e) {
      }
    }
  }

  private SpinJsonNode requestProcessDefinitionsForUser(String user) {
    Connector<? extends ConnectorRequest<?>> connector = Connectors.http();
    ConnectorRequest<?> request = connector.createRequest();
    request.setRequestParameter(HttpRequest.PARAM_NAME_REQUEST_URL, PROCESS_DEFINITION_URL + "?user=" + user);
    request.setRequestParameter(HttpRequest.PARAM_NAME_REQUEST_METHOD, "GET");

    ConnectorResponse response = request.execute();

    int statusCode = response.getResponseParameter(HttpResponse.PARAM_NAME_STATUS_CODE);
    assertThat(statusCode, is(200));

    String responseBody = response.getResponseParameter(HttpResponse.PARAM_NAME_RESPONSE);
    return JSON(responseBody);
  }

}
