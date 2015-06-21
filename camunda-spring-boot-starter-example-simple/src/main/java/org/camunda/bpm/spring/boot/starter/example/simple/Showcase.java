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

@Component
public class Showcase implements ApplicationContextAware {

  private static final Logger LOGGER = LoggerFactory.getLogger(Showcase.class);

  @Autowired
  private RuntimeService runtimeService;

  @Autowired
  private TaskService taskService;

  private ApplicationContext context;

  protected boolean finished = false;

  public void show() {
    ProcessInstance processInstance = runtimeService
      .startProcessInstanceByKey("Sample");
    LOGGER.info("started {}", processInstance);
    Task task = taskService.createTaskQuery()
      .processInstanceId(processInstance.getId()).singleResult();
    runtimeService.signal(task.getExecutionId());
    LOGGER.info("signaled {}", task);
    waitForProcessFinished(processInstance);
  }

  private void waitForProcessFinished(ProcessInstance processInstance) {
    while (runtimeService.createProcessInstanceQuery()
      .processInstanceId(processInstance.getId()).singleResult() != null) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException e) {
        LOGGER.error("", e);
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

  @Override
  public void setApplicationContext(ApplicationContext applicationContext)
    throws BeansException {
    this.context = applicationContext;
  }
}
