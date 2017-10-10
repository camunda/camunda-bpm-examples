package org.camunda.bpm.spring.boot.example.twitter;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Service;

/**
 * Rejection is just done via a sysout. You could, for example, implement sending mail to the author here.
 * Use your own Mail mechanisms for this or use your application server features.
 */
@Service("emailAdapter")
public class RejectionNotificationDelegate implements JavaDelegate {

  public void execute(DelegateExecution execution) throws Exception {
    String content = (String) execution.getVariable("content");
    String comments = (String) execution.getVariable("comments");

    System.out.println("Hi!\n\n"
           + "Unfortunately your tweet has been rejected.\n\n"
           + "Original content: " + content + "\n\n"
           + "Comment: " + comments + "\n\n"
           + "Sorry, please try with better content the next time :-)");
  }

}
