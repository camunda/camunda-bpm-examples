package org.camunda.bpm.spring.boot.example.simple;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SayHelloDelegate implements JavaDelegate {

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Override
  public void execute(DelegateExecution execution) throws Exception {
    logger.info("executed sayHelloDelegate: {}", execution);
  }

}
