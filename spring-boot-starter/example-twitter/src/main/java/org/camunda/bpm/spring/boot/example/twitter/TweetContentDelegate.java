package org.camunda.bpm.spring.boot.example.twitter;

import java.net.UnknownHostException;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;
import twitter4j.auth.AccessToken;

/**
 * Publish content on Twitter. It really goes live! Watch out http://twitter.com/#!/camunda_demo for your postings.
 */
public class TweetContentDelegate implements JavaDelegate {

  public void execute(DelegateExecution execution) throws Exception {
	try {
	    String content = (String) execution.getVariable("content");

	    // For webex demos, force a network error
	    if ("network error".equals(content)) {
	      throw new UnknownHostException("demo twitter account");
	    }

	    AccessToken accessToken = new AccessToken("220324559-jet1dkzhSOeDWdaclI48z5txJRFLCnLOK45qStvo", "B28Ze8VDucBdiE38aVQqTxOyPc7eHunxBVv7XgGim4say");
	    Twitter twitter = new TwitterFactory().getInstance();
	    twitter.setOAuthConsumer("lRhS80iIXXQtm6LM03awjvrvk", "gabtxwW8lnSL9yQUNdzAfgBOgIMSRqh7MegQs79GlKVWF36qLS");
	    twitter.setOAuthAccessToken(accessToken);

	    twitter.updateStatus(content);
	} catch (TwitterException e) {
//		if (e.getErrorCode() == 187) {
//			throw new BpmnError("duplicateMessage");
//		}
		throw e;
	}

  }

}
