package org.camunda.bpm.spring.boot.starter.example.simple;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SimpleApplication implements CommandLineRunner {

  public static void main(final String... args) throws Exception {
    SpringApplication.run(SimpleApplication.class, args);
  }

  @Autowired
  private Showcase showcase;

  @Override
  public void run(final String... strings) throws Exception {
    showcase.show();
  }
}
