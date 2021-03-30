/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.spring.boot.example.twitter;

import java.net.UnknownHostException;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;
import twitter4j.auth.AccessToken;

/**
 * Publish content on Twitter.
 */
public class TweetContentDelegate implements JavaDelegate {

  public void execute(DelegateExecution execution) throws Exception {
		String content = (String) execution.getVariable("content");

		// Force a network error
		if ("network error".equals(content)) {
			throw new UnknownHostException("demo twitter account");
		}

		String token = "YOUR TOKEN";
		String tokenSecret = "YOUR TOKEN SECRET";
		AccessToken accessToken = new AccessToken(token, tokenSecret);
		Twitter twitter = new TwitterFactory().getInstance();

		String consumerKey = "YOUR CONSUMER KEY";
		String consumerSecret = "YOUR CONSUMER SECRET";
		twitter.setOAuthConsumer(consumerKey, consumerSecret);
		twitter.setOAuthAccessToken(accessToken);

		twitter.updateStatus(content);
	}

}
