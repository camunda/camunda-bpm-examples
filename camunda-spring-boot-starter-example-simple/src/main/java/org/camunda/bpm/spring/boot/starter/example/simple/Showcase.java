package org.camunda.bpm.spring.boot.starter.example.simple;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import javax.annotation.Nonnull;

@Component
public class Showcase implements ApplicationContextAware {

  private final Logger logger = LoggerFactory.getLogger(Showcase.class);

  @Autowired
  private RuntimeService runtimeService;

  @Autowired
  private TaskService taskService;

  private ApplicationContext context;

  protected boolean finished = false;

  public void show() {
    final ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("Sample");
    logger.info("started instance: {}", processInstance);
    Task task = taskService.createTaskQuery().processInstanceId(processInstance.getId()).singleResult();

    taskService.complete(task.getId());

    logger.info("completed task: {}", task);
    waitForProcessFinished(processInstance);
  }

  private void waitForProcessFinished(ProcessInstance processInstance) {
    while (findProcessInstance(processInstance) != null) {
      final ProcessInstance p = findProcessInstance(processInstance);

      logger.info("waiting at: {}", runtimeService.getActivityInstance(p.getId()).getActivityName());

      logger.info("active: {}", !findProcessInstance(processInstance).isEnded());
      try {
        logger.info("waiting for processInstance {} to complete", processInstance);
        Thread.sleep(500);
      } catch (InterruptedException e) {
        logger.error("", e);
      }
    }
    finished = true;
    SpringApplication.exit(context, new ExitCodeGenerator() {

      @Override
      public int getExitCode() {
        return 0;
      }
    });
  }

  @Nonnull
  private ProcessInstance findProcessInstance(ProcessInstance processInstance) {
    return runtimeService.createProcessInstanceQuery()
      .active()
      .processInstanceId(processInstance.getId())
      .singleResult();
  }

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    this.context = applicationContext;
  }

}
