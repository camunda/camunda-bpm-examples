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
