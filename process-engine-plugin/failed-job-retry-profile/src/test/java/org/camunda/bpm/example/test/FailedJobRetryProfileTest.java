package org.camunda.bpm.example.test;


import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.commons.lang.time.DateUtils;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.impl.persistence.entity.JobEntity;
import org.camunda.bpm.engine.impl.util.ClockUtil;
import org.camunda.bpm.engine.runtime.Job;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.example.delegate.ServiceTaskOneDelegate;
import org.camunda.bpm.example.delegate.ServiceTaskTwoDelegate;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class FailedJobRetryProfileTest {

  private static final int DEFAULT_RETRIES = 3;

  @Rule
  public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  private ManagementService managementService;
  private RuntimeService runtimeService;

  private Date currentTime;

  @Before
  public void setUp() throws ParseException {
    currentTime = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse("2017-01-01T10:00:00");

    managementService = processEngineRule.getManagementService();
    runtimeService = processEngineRule.getRuntimeService();
  }

  @Test
  @Deployment(resources = { "retry-example.bpmn" })
  public void testProfileParseListener() throws IOException, ParseException {
    // start the process instance
    ClockUtil.setCurrentTime(currentTime);
    ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("process");
    String processInstanceId = processInstance.getProcessInstanceId();

    int jobRetries = 0;

    // execution the first service task results with failed job
    jobRetries = executeJob(processInstanceId);
    assertEquals(4, jobRetries);
    // 10 minutes offset as the retry conf. is "R5/PT10M"
    assertLockExpirationTime(10);
    ServiceTaskOneDelegate.firstAttempt = false;

    // successful execution of the first service task
    jobRetries = executeJob(processInstanceId);
    assertEquals(DEFAULT_RETRIES, jobRetries);

    // successful execution of the second service task
    jobRetries = executeJob(processInstanceId);
    assertEquals(DEFAULT_RETRIES, jobRetries);

    // execution the third service task results with failed job
    jobRetries = executeJob(processInstanceId);
    assertEquals(6, jobRetries);
    // 5 minutes offset as the retry conf. is "R7/PT5M"
    assertLockExpirationTime(5);
    ServiceTaskTwoDelegate.firstAttempt = false;

    // successful execution of the third service task
    jobRetries = executeJob(processInstanceId);
    assertEquals(DEFAULT_RETRIES, jobRetries);
  }

  private int executeJob(String processInstanceId) {
    Job job = managementService.createJobQuery().processInstanceId(processInstanceId).singleResult();

    try {
      managementService.executeJob(job.getId());
    } catch (Exception e) {
      // ignore
    }

    job = managementService.createJobQuery().processInstanceId(processInstanceId).singleResult();

    return job.getRetries();
  }

  private void assertLockExpirationTime(int minutesOffset) throws ParseException {
    currentTime = DateUtils.addMinutes(currentTime, minutesOffset);
    Date lockExpirationTime = ((JobEntity) managementService.createJobQuery().singleResult()).getLockExpirationTime();
    assertEquals(currentTime, lockExpirationTime);
    ClockUtil.setCurrentTime(currentTime);
  }
}
