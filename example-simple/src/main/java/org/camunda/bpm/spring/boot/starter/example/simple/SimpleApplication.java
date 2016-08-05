package org.camunda.bpm.spring.boot.starter.example.simple;

import org.apache.commons.lang.builder.ToStringBuilder;
import org.apache.commons.lang.builder.ToStringStyle;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.spring.boot.starter.CamundaBpmProperties;
import org.camunda.bpm.spring.boot.starter.SpringBootProcessApplication;
import org.camunda.bpm.spring.boot.starter.event.ProcessApplicationStoppedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@SpringBootApplication
@EnableScheduling
public class SimpleApplication implements CommandLineRunner {

  boolean processApplicationStopped;

  public static void main(final String... args) throws Exception {
    SpringApplication.run(SimpleApplication.class, args);
  }

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Autowired
  private HistoryService historyService;

  @Autowired
  private ConfigurableApplicationContext context;

  @Autowired
  private CamundaBpmProperties camundaBpmProperties;

  @Autowired
  private Showcase showcase;

  @Bean
  public SpringBootProcessApplication processApplication() {
    return new SpringBootProcessApplication();
  }

  @EventListener
  public void processApplicationStopped(ProcessApplicationStoppedEvent event) {
    logger.info("process application stopped!");
    processApplicationStopped = true;
  }

  @Scheduled(fixedDelay = 1500L)
  public void exitApplicationWhenProcessIsFinished() {
    String processInstanceId = showcase.getProcessInstanceId();

    if (processInstanceId == null) {
      logger.info("processInstance not yet started!");
      return;
    }

    if (isProcessInstanceFinished()) {
      logger.info("processinstance ended!");

      SpringApplication.exit(context, new ExitCodeGenerator() {

        @Override
        public int getExitCode() {
          return 0;
        }
      });
      return;
    }
    logger.info("processInstance not yet ended!");
  }

  public boolean isProcessInstanceFinished() {
    final HistoricProcessInstance historicProcessInstance = historyService.createHistoricProcessInstanceQuery()
        .processInstanceId(showcase.getProcessInstanceId()).singleResult();

    return historicProcessInstance != null && historicProcessInstance.getEndTime() != null;

  }

  @Override
  public void run(String... strings) throws Exception {
    logger.error(ToStringBuilder.reflectionToString(camundaBpmProperties.getApplication(), ToStringStyle.MULTI_LINE_STYLE));
  }
}
