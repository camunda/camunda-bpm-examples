package org.camunda.bpm.spring.boot.example.webapp.ee;

import org.camunda.bpm.spring.boot.starter.annotation.EnableProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableProcessApplication
public class EnterpriseWebappExampleApplication {

  public static void main(String... args) {
    SpringApplication.run(EnterpriseWebappExampleApplication.class, args);
  }

}
