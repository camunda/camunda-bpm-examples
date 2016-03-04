package org.camunda.bpm.spring.boot.starter.example.simple;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.Timeout;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.junit.Assert.assertTrue;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = {SimpleApplication.class})
public class ShowcaseTest {

  @Autowired
  private Showcase showcase;

  @Rule
  public Timeout timeout = Timeout.seconds(10);

  @Test
  public void test() {
    showcase.show();
    assertTrue(showcase.finished);
  }
}
