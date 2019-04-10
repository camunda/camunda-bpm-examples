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
package org.camunda.bpm.spring.boot.example.twitter;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Service;

/**
 * Rejection is just done via a sysout. You could, for example, implement sending mail to the author here.
 * Use your own Mail mechanisms for this or use your application server features.
 */
@Service("emailAdapter")
public class RejectionNotificationDelegate implements JavaDelegate {

  public void execute(DelegateExecution execution) throws Exception {
    String content = (String) execution.getVariable("content");
    String comments = (String) execution.getVariable("comments");

    System.out.println("Hi!\n\n"
           + "Unfortunately your tweet has been rejected.\n\n"
           + "Original content: " + content + "\n\n"
           + "Comment: " + comments + "\n\n"
           + "Sorry, please try with better content the next time :-)");
  }

}
