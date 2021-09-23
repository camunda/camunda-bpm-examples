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
package org.camunda.bpm.quickstart;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.mail.Email;
import org.apache.commons.mail.SimpleEmail;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.delegate.DelegateTask;
import org.camunda.bpm.engine.delegate.TaskListener;
import org.camunda.bpm.engine.identity.User;
import org.camunda.bpm.engine.impl.context.Context;

public class TaskAssignmentListener implements TaskListener {

  // TODO: Set Mail Server Properties
  protected static final String HOST = "mail.example.org";
  protected static final String USER = "admin@example.org";
  protected static final String PWD = "toomanysecrets";

  protected final static Logger LOGGER = Logger.getLogger(TaskAssignmentListener.class.getName());

  public void notify(DelegateTask delegateTask) {

    String assignee = delegateTask.getAssignee();
    String taskId = delegateTask.getId();

    if (assignee != null) {

      // Get User Profile from User Management
      IdentityService identityService = Context.getProcessEngineConfiguration().getIdentityService();
      User user = identityService.createUserQuery().userId(assignee).singleResult();

      if (user != null) {

        // Get Email Address from User Profile
        String recipient = user.getEmail();

        if (recipient != null && !recipient.isEmpty()) {

          Email email = new SimpleEmail();
          email.setCharset("utf-8");
          email.setHostName(HOST);
          email.setAuthentication(USER, PWD);

          try {
            email.setFrom("noreply@camunda.org");
            email.setSubject("Task assigned: " + delegateTask.getName());
            email.setMsg("Please complete: http://localhost:8080/camunda/app/tasklist/default/#/task=" + taskId);

            email.addTo(recipient);

            email.send();
            LOGGER.info(
                "Task Assignment Email successfully sent to user '" + assignee + "' with address '" + recipient + "'.");

          } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Could not send email to assignee", e);
          }

        } else {
          LOGGER.warning("Not sending email to user " + assignee + "', user has no email address.");
        }

      } else {
        LOGGER.warning("Not sending email to user " + assignee + "', user is not enrolled with identity service.");
      }

    }

  }

}
