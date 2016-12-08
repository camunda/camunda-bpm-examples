package org.camunda.bpm.spring.boot.example.dmn.rest;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.cfg.ProcessEnginePlugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DmnRestApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(DmnRestApplication.class, args);
  }

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Bean
  public ProcessEnginePlugin statusPlugin() {
    return new AbstractProcessEnginePlugin() {
      @Override
      public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
        logger.warn("post init");
      }

      @Override
      public void postProcessEngineBuild(ProcessEngine processEngine) {
        logger.warn("post build");
      }

      @Override
      public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
        logger.warn("pre init");
      }
    };
  }

}
