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
package org.camunda.bpm.example.tasklistener;

import org.camunda.bpm.engine.delegate.DelegateTask;
import org.camunda.bpm.engine.delegate.TaskListener;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * Task listener to be executed when a user task is entered
 */
public class InformAssigneeTaskListener implements TaskListener {

  private final Logger LOGGER = Logger.getLogger(this.getClass().getName());
  public static List<String> assigneeList = new ArrayList<String>();

  private static InformAssigneeTaskListener instance = null;

  protected InformAssigneeTaskListener() { }

  public static InformAssigneeTaskListener getInstance() {
    if(instance == null) {
      instance = new InformAssigneeTaskListener();
    }
    return instance;
  }

  public void notify(DelegateTask delegateTask) {
    String assignee = delegateTask.getAssignee();
    assigneeList.add(assignee);
    LOGGER.info("Hello " + assignee + "! Please start to work on your task " + delegateTask.getName());
  }

}
