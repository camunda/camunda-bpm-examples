package org.camunda.bpm.spring.boot.starter.example.cloud.simple;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SayHelloDelegate implements JavaDelegate {

  private final Logger logger = LoggerFactory.getLogger(this.getClass());


  @HystrixCommand
  @Override
  public void execute(DelegateExecution execution) throws Exception {
    logger.info("executed sayHelloDelegate: {}", execution);
  }

}
