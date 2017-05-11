/**
 * Copyright (C) 2011, 2012 camunda services GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example.spring.servlet.pa;

import java.io.File;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import org.camunda.bpm.BpmPlatform;
import org.camunda.bpm.ProcessEngineService;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngineException;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.impl.ProcessEngineImpl;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.jobexecutor.JobExecutor;
import org.camunda.bpm.engine.impl.util.ClockUtil;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.runtime.Job;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.jboss.shrinkwrap.api.spec.WebArchive;
import org.jboss.shrinkwrap.resolver.api.DependencyResolvers;
import org.jboss.shrinkwrap.resolver.api.maven.MavenDependencyResolver;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(Arquillian.class)
public class ArquillianTest {

  private ProcessEngineService processEngineService;
  private ProcessEngine processEngine;
  private ProcessEngineConfigurationImpl processEngineConfiguration;
  private HistoryService historyService;
  private ManagementService managementService;
  private RepositoryService repositoryService;
  private RuntimeService runtimeService;

  @Before
  public void setupBeforeTest() {
    processEngineService = BpmPlatform.getProcessEngineService();
    processEngine = processEngineService.getDefaultProcessEngine();
    processEngineConfiguration = ((ProcessEngineImpl) processEngine).getProcessEngineConfiguration();
    processEngineConfiguration.getJobExecutor().shutdown(); // make sure the job executor is down
    historyService = processEngine.getHistoryService();
    managementService = processEngine.getManagementService();
    repositoryService = processEngine.getRepositoryService();
    runtimeService = processEngine.getRuntimeService();
  }

  @Deployment
  public static WebArchive processArchive() {

    // deploy spring Process Application (does not include ejb-client nor cdi modules)
    return ShrinkWrap.create(WebArchive.class, "spring-servlet-pa.war")

        // add example bean to serve as JavaDelegate
        .addClass(ExampleBean.class)
        .addClass(ExampleDelegateBean.class)
            // add process definitions
        .addAsResource("SpringExpressionResolvingTest.testResolveBean.bpmn20.xml")
        .addAsResource("SpringExpressionResolvingTest.testResolveBeanFromJobExecutor.bpmn20.xml")

            // add custom servlet process application
        .addClass(SpringServletProcessApplication.class)
            // regular deployment descriptor
        .addAsResource("META-INF/processes.xml", "META-INF/processes.xml")

            // web xml that bootstraps spring
        .setWebXML(new File("src/main/webapp/WEB-INF/web.xml"))

            // spring application context & libs
        .addAsWebInfResource(new File("src/main/webapp/WEB-INF/applicationContext.xml"), "applicationContext.xml")
        .addAsLibraries(DependencyResolvers
            .use(MavenDependencyResolver.class)
            .goOffline()
            .loadMetadataFromPom("pom.xml")
            .artifacts("org.camunda.bpm:camunda-engine-spring", "org.springframework:spring-web")
            .exclusion("org.camunda.bpm:camunda-engine")
            .resolveAs(JavaArchive.class));
  }

  @Test
  public void testResolveBean() {
    // process instance was started from ProcessApplication @PostDeploy method
    Assert.assertEquals(0, runtimeService.createProcessInstanceQuery().processDefinitionKey("testResolveBean").count());
    // and process is already ended
    Assert.assertNotSame(0, historyService.createHistoricProcessInstanceQuery().processDefinitionKey("testResolveBean").count());
  }

  @Test
  public void testResolveBeanFromJobExecutor() {
    // process instance was started from ProcessApplication @PostDeploy method and is already ended
    //Assert.assertEquals(1, runtimeService.createProcessInstanceQuery().processDefinitionKey("testResolveBeanFromJobExecutor").count());

    waitForJobExecutorToProcessAllJobs(16000);

    Assert.assertEquals(0, runtimeService.createProcessInstanceQuery().processDefinitionKey("testResolveBeanFromJobExecutor").count());

    ProcessDefinition testResolveBeanFromJobExecutorPD = repositoryService.createProcessDefinitionQuery().processDefinitionKey("testResolveBeanFromJobExecutor").singleResult();
    Assert.assertNotSame(0, historyService.createHistoricProcessInstanceQuery().processDefinitionId(testResolveBeanFromJobExecutorPD.getId()).count());
  }

  public void waitForJobExecutorToProcessAllJobs(long maxMillisToWait) {
    JobExecutor jobExecutor = processEngineConfiguration.getJobExecutor();
    waitForJobExecutorToProcessAllJobs(jobExecutor, maxMillisToWait);
  }

  public void waitForJobExecutorToProcessAllJobs(JobExecutor jobExecutor, long maxMillisToWait) {

    int checkInterval = 1000;

    jobExecutor.start();

    try {
      Timer timer = new Timer();
      InteruptTask task = new InteruptTask(Thread.currentThread());
      timer.schedule(task, maxMillisToWait);
      boolean areJobsAvailable = true;
      try {
        while (areJobsAvailable && !task.isTimeLimitExceeded()) {
          Thread.sleep(checkInterval);
          areJobsAvailable = areJobsAvailable();
        }
      } catch (InterruptedException e) {
      } finally {
        timer.cancel();
      }
      if (areJobsAvailable) {
        throw new ProcessEngineException("time limit of " + maxMillisToWait + " was exceeded");
      }

    } finally {
      jobExecutor.shutdown();
    }
  }

  public boolean areJobsAvailable() {
    List<Job> list = managementService.createJobQuery().list();
    for (Job job : list) {
      if (job.getRetries() > 0 && (job.getDuedate() == null || ClockUtil.getCurrentTime().after(job.getDuedate()))) {
        return true;
      }
    }
    return false;
  }

  private static class InteruptTask extends TimerTask {

    protected boolean timeLimitExceeded = false;
    protected Thread thread;

    public InteruptTask(Thread thread) {
      this.thread = thread;
    }
    public boolean isTimeLimitExceeded() {
      return timeLimitExceeded;
    }
    public void run() {
      timeLimitExceeded = true;
      thread.interrupt();
    }
  }
}
