package org.camunda.bpm.spring.boot.starter.example.cloud.simple;

import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.EnableHystrix;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import com.netflix.hystrix.contrib.javanica.aop.aspectj.HystrixCommandAspect;

@SpringBootApplication
@EnableScheduling
@EnableHystrix
public class SimpleApplication {

  boolean contextClosed;

  public static void main(final String... args) throws Exception {
    SpringApplication.run(SimpleApplication.class, args);
  }

  @Bean
  public HystrixCommandAspect hystrixAspect() {
    return new HystrixCommandAspect();
  }

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Autowired
  private HistoryService historyService;

  @Autowired
  private ConfigurableApplicationContext context;

  @Autowired
  private Showcase showcase;

  @Value("${org.camunda.bpm.spring.boot.starter.example.cloud.simple.SimpleApplication.exitWhenFinished:true}")
  private boolean exitWhenFinished;

  @EventListener
  public void contextClosed(ContextClosedEvent event) {
    logger.info("context closed!");
    contextClosed = true;
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

      if (exitWhenFinished) {
        SpringApplication.exit(context, () -> 0);
      }
      return;
    }
    logger.info("processInstance not yet ended!");
  }

  public boolean isProcessInstanceFinished() {
    final HistoricProcessInstance historicProcessInstance = historyService.createHistoricProcessInstanceQuery()
        .processInstanceId(showcase.getProcessInstanceId()).singleResult();

    return historicProcessInstance != null && historicProcessInstance.getEndTime() != null;

  }

}
