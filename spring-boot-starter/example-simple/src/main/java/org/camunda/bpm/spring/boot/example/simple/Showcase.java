package org.camunda.bpm.spring.boot.example.simple;

import static org.slf4j.LoggerFactory.getLogger;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.spring.boot.starter.event.PostDeployEvent;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class Showcase {

  private final Logger logger = getLogger(this.getClass());

  @Autowired
  private RuntimeService runtimeService;

  @Autowired
  private TaskService taskService;

  private String processInstanceId;

  @EventListener
  public void notify(final PostDeployEvent unused) {

    final User user = new User("Noah", 25);
    logger.info("User object created: " + user);

    processInstanceId = runtimeService.startProcessInstanceByKey("Sample", Variables.putValue("user", user))
      .getProcessInstanceId();
    logger.info("started instance: {}", processInstanceId);

    logger.info("User variable instance value: " + runtimeService.createVariableInstanceQuery().variableName("user").singleResult().getValue());

    Task task = taskService.createTaskQuery().processInstanceId(processInstanceId).singleResult();
    taskService.complete(task.getId());
    logger.info("completed task: {}", task);

    // now jobExecutor should execute the async job
  }

  public String getProcessInstanceId() {
    return processInstanceId;
  }
}
