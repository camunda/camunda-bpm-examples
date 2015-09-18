package org.camunda.bpm.spring.boot.starter.example.web;

import org.camunda.bpm.spring.boot.starter.CamundaBpmRestConfiguration;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

  public static void main(String args[]) throws Exception {
    SpringApplication.run(Application.class, args);
  }

  @Bean
  public ResourceConfig jerseyConfig() {
    return new CamundaBpmRestConfiguration.CamundaJerseyConfig();
  }

}
