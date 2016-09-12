package org.camunda.bpm.spring.boot.starter.example.webapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;

@SpringBootApplication
public class WebappExampleApplication extends SpringBootServletInitializer {

  public static void main(String... args) {
    SpringApplication.run(WebappExampleApplication.class, args);
  }

  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
    return application.sources(WebappExampleApplication.class);
  }

}
