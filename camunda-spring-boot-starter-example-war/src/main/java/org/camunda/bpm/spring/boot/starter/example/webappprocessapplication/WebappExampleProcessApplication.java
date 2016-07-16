package org.camunda.bpm.spring.boot.starter.example.webappprocessapplication;

import org.camunda.bpm.spring.boot.starter.SpringBootProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebappExampleProcessApplication extends SpringBootProcessApplication {

  public static void main(String[] args) {
    SpringApplication.run(WebappExampleProcessApplication.class, args);
  }

}
