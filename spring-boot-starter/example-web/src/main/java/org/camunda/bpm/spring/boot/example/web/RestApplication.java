package org.camunda.bpm.spring.boot.example.web;

import org.camunda.bpm.spring.boot.starter.annotation.EnableProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableProcessApplication
public class RestApplication {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(RestApplication.class, args);
  }

}
