package org.camunda.bpm.spring.boot.example.twitter;

import org.camunda.bpm.spring.boot.starter.annotation.EnableProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableProcessApplication
public class TwitterServletProcessApplication {

  public static void main(String[] args) {
    SpringApplication.run(TwitterServletProcessApplication.class, args);
  }
}
