package org.camunda.bpm.spring.boot.starter.example.simple;

import org.junit.Assert;
import org.junit.Ignore;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.Timeout;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = {SimpleApplication.class})
public class SimpleApplicationTest {

  @Rule
  public Timeout timeout = Timeout.seconds(5);

  @Autowired
  private SimpleApplication application;
  private boolean contextClosed;

  @Test
  public void would_fail_if_process_not_completed_after_5_seconds() throws InterruptedException {
    while (!application.contextClosed && !application.isProcessInstanceFinished()) {
      Thread.sleep(500L);
    }
  }
}
