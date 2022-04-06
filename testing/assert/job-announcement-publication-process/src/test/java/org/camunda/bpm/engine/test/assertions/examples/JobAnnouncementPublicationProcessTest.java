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
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.*;

/**
 * @author Martin Schimak (martin.schimak@plexiti.com)
 */
public class JobAnnouncementPublicationProcessTest {

  @Rule public ProcessEngineRule processEngineRule = new ProcessEngineRule();

  @Mock public JobAnnouncementService jobAnnouncementService;
  @Mock public JobAnnouncement jobAnnouncement;

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
  @Deployment(resources = { "camunda-testing-job-announcement-publication.bpmn" })
  public void testPublishOnlyOnCompanyWebsite() {

    when(jobAnnouncement.getId()).thenReturn(1L);

    ProcessInstance processInstance = runtimeService().startProcessInstanceByKey(
      "camunda-testing-job-announcement-publication",
      withVariables(
        "jobAnnouncementId", jobAnnouncement.getId(),
        "twitter", false,
        "facebook", false
      )
    );

    verify(jobAnnouncementService).postToWebsite(jobAnnouncement.getId());
    verify(jobAnnouncementService, never()).postToTwitter(any(Long.class));
    verify(jobAnnouncementService, never()).postToFacebook(any(Long.class));

    assertThat(processInstance).hasPassed(
      findId("Publish announcement on website")
    );

    assertThat(processInstance).isEnded();

    verifyNoMoreInteractions(jobAnnouncementService);

  }

  @Test
  @Deployment(resources = { "camunda-testing-job-announcement-publication.bpmn" })
  public void testPublishAlsoOnTwitter() {

    ProcessInstance processInstance = runtimeService().startProcessInstanceByKey(
      "camunda-testing-job-announcement-publication",
      withVariables(
        "jobAnnouncementId", jobAnnouncement.getId(),
        "twitter", true,
        "facebook", false
      )
    );

    verify(jobAnnouncementService).postToWebsite(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToTwitter(jobAnnouncement.getId());
    verify(jobAnnouncementService, never()).postToFacebook(any(Long.class));

    assertThat(processInstance).hasPassed(
      findId("Publish announcement on website"),
      findId("Publish announcement on Twitter")
    );

    assertThat(processInstance).isEnded();

    verifyNoMoreInteractions(jobAnnouncementService);

  }

  @Test
  @Deployment(resources = { "camunda-testing-job-announcement-publication.bpmn" })
  public void testPublishAlsoOnFacebook() {

    ProcessInstance processInstance = runtimeService().startProcessInstanceByKey(
      "camunda-testing-job-announcement-publication",
      withVariables(
        "jobAnnouncementId", jobAnnouncement.getId(),
        "twitter", false,
        "facebook", true
      )
    );

    verify(jobAnnouncementService).postToWebsite(jobAnnouncement.getId());
    verify(jobAnnouncementService, never()).postToTwitter(any(Long.class));
    verify(jobAnnouncementService).postToFacebook(jobAnnouncement.getId());

    assertThat(processInstance).hasPassed(
      findId("Publish announcement on website"),
      findId("Publish announcement on Facebook")
    );

    assertThat(processInstance).isEnded();

    verifyNoMoreInteractions(jobAnnouncementService);

  }

  @Test
  @Deployment(resources = { "camunda-testing-job-announcement-publication.bpmn" })
  public void testPublishAlsoOnFacebookAndTwitter() {

    ProcessInstance processInstance = runtimeService().startProcessInstanceByKey(
      "camunda-testing-job-announcement-publication",
      withVariables(
        "jobAnnouncementId", jobAnnouncement.getId(),
        "twitter", true,
        "facebook", true
      )
    );

    verify(jobAnnouncementService).postToWebsite(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToTwitter(jobAnnouncement.getId());
    verify(jobAnnouncementService).postToFacebook(jobAnnouncement.getId());

    assertThat(processInstance).hasPassed(
      findId("Publish announcement on website"),
      findId("Publish announcement on Twitter"),
      findId("Publish announcement on Facebook")
    );

    assertThat(processInstance).isEnded();

    verifyNoMoreInteractions(jobAnnouncementService);

  }

}
