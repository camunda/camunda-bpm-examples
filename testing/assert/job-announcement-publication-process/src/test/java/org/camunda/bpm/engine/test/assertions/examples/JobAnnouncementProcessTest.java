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
package org.camunda.bpm.engine.test.assertions.examples;

import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.camunda.bpm.engine.test.ProcessEngineRule;
import org.camunda.bpm.engine.test.mock.Mocks;
import org.camunda.bpm.engine.test.assertions.examples.jobannouncement.JobAnnouncement;
import org.camunda.bpm.engine.test.assertions.examples.jobannouncement.JobAnnouncementService;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.camunda.bpm.engine.test.assertions.bpmn.BpmnAwareTests.*;
import static org.mockito.Mockito.*;

public class JobAnnouncementProcessTest {

  @Rule
  public final ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Mock
  public JobAnnouncementService jobAnnouncementService;
  @Mock
  public JobAnnouncement jobAnnouncement;

  @Before
  public void setUp() {
    MockitoAnnotations.initMocks(this);
    Mocks.register("jobAnnouncementService", jobAnnouncementService);
    Mocks.register("jobAnnouncement", jobAnnouncement);
  }

  @After
  public void tearDown() {
    Mocks.reset();
  }

  @Test
  @Deployment(resources = {
    "camunda-testing-job-announcement.bpmn",
    "camunda-testing-job-announcement-publication.bpmn"
  })
  public void testHappyPath() {

    when(jobAnnouncement.getId()).thenReturn(1L);
    when(jobAnnouncementService.findRequester(1L)).thenReturn("gonzo");
    when(jobAnnouncementService.findEditor(1L)).thenReturn("fozzie");

    final ProcessInstance processInstance = startProcess();

    assertThat(processInstance).isStarted().isNotEnded()
      .task().hasDefinitionKey("edit").hasCandidateGroup("engineering").isNotAssigned();

    claim(task(), "fozzie");

    assertThat(task()).isAssignedTo("fozzie");
    // and just to show off more possibilities...
    assertThat(processInstance).task(taskQuery().taskAssignee("fozzie")).hasDefinitionKey("edit");
    assertThat(processInstance).task("edit").isAssignedTo("fozzie");

    complete(task());

    assertThat(processInstance).task().hasDefinitionKey("review").isAssignedTo("gonzo");

    complete(task(), withVariables("approved", true));

    assertThat(processInstance).task().hasDefinitionKey("publish").hasCandidateGroup("engineering").isNotAssigned();

    assertThat(processInstance).hasVariables();
    assertThat(processInstance).hasVariables("jobAnnouncementId", "approved");
    assertThat(processInstance).variables()
      .hasSize(2)
      .containsEntry("jobAnnouncementId", jobAnnouncement.getId())
      .containsEntry("approved", true);

    // claim and complete could be combined, too
    complete(claim(task(), "fozzie"), withVariables("twitter", true, "facebook", true));

    verify(jobAnnouncementService).findRequester(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToWebsite(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToTwitter(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToFacebook(jobAnnouncement.getId());
    verify(jobAnnouncementService).notifyAboutPostings(jobAnnouncement.getId());

    assertThat(processInstance).hasPassedInOrder(findId("Describe job role"),
        findId("Review job role description"),
        findId("Publish announcement"),
        findId("Execute announcement"),
        findId("Send confirmation"));

    assertThat(processInstance).isEnded();

    verifyNoMoreInteractions(jobAnnouncementService);

  }

  @Test
  @Deployment(resources = {
    "camunda-testing-job-announcement.bpmn",
    "camunda-testing-job-announcement-publication.bpmn"
  })
  public void testCandidateGroupAssociated() {

    when(jobAnnouncement.getId()).thenReturn(1L);
    when(jobAnnouncementService.findRequester(1L)).thenReturn("gonzo");
    when(jobAnnouncementService.findEditor(1L)).thenReturn("fozzie");

    final ProcessInstance processInstance = startProcess();

    assertThat(processInstance).task().hasCandidateGroupAssociated("engineering").isNotAssigned();
    claim(task(), "fozzie");
    assertThat(processInstance).task().hasCandidateGroupAssociated("engineering").isAssignedTo("fozzie");
  }

  @Test
  @Deployment(resources = { "camunda-testing-job-announcement.bpmn", "camunda-testing-job-announcement-publication.bpmn" })
  public void should_fail_if_processInstance_is_not_waiting_at_expected_task() {
    final ProcessInstance processInstance = startProcess();
    try {
      assertThat(processInstance).task(findId("Review job role description"));
    } catch (AssertionError e) {
      return;
    }
    throw new AssertionError("Expected AssertionError to be thrown, but did not see any such exception.");
  }

  @Test
  @Deployment(resources = { "camunda-testing-job-announcement.bpmn", "camunda-testing-job-announcement-publication.bpmn" })
  public void should_not_fail_if_processInstance_is_waiting_at_expected_task() {
    final ProcessInstance processInstance = startProcess();
    assertThat(processInstance).task(findId("Describe job role")).isNotAssigned();
  }

  private ProcessInstance startProcess() {
    return runtimeService().startProcessInstanceByKey(
      "camunda-testing-job-announcement",
      withVariables("jobAnnouncementId", jobAnnouncement.getId())
    );
  }

}
