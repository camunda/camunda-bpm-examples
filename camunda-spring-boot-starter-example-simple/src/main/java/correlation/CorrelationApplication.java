package correlation;

import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.spring.boot.starter.SpringBootProcessApplication;
import org.camunda.bpm.spring.boot.starter.event.ProcessApplicationStartedEvent;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Transactional;

import static org.slf4j.LoggerFactory.getLogger;

@SpringBootApplication
@ProcessApplication
public class CorrelationApplication extends SpringBootProcessApplication {

  public static void main(String[] args) {
    SpringApplication.run(CorrelationApplication.class, args);
  }

  private final Logger logger = getLogger(this.getClass());

  @Autowired
  private RuntimeService runtimeService;

  @Autowired
  private TaskService taskService;

  @Bean
  public JavaDelegate sendMessage() {
    return new JavaDelegate() {

      @Transactional
      @Override
      public void execute(DelegateExecution execution) throws Exception {
        try {
          execution.getProcessEngineServices().getRuntimeService().correlateMessage("foo");
        }  catch (Exception e) {
          logger.info("========================================== ignoring failed correlation {}", e.getMessage());
        }
      }
    };
  }

  @EventListener
  public void run(ProcessApplicationStartedEvent event) {
    final ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("Process_12");
    logger.info("===== started {}", processInstance);

    Task task = taskService.createTaskQuery().processInstanceId(processInstance.getId()).singleResult();

    taskService.complete(task.getId());


  }
}
