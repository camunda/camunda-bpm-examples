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
package org.camunda.quickstart.servicetask.invocation;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * <p>This class is supposed to mock the queuing infrastructure between the process engine 
 * and the service implementation. In a real life scenario, we would use reliable queuing 
 * middleware such as a transactional messaging system (typically JMS).</p>
 *
 */
public class MockMessageQueue {
  
  /** a Message with payload */
  public static class Message {
    
    protected Map<String, Object> payload;

    public Message(Map<String, Object> payload) {
      this.payload = payload;
    }
    
    public Map<String, Object> getPayload() {
      return payload;
    }
     
  }
  
  protected List<Message> queue = new LinkedList<>();
  
  public final static MockMessageQueue INSTANCE = new MockMessageQueue();
  
  public void send(Message m) {
    queue.add(m);
  }
  
  public Message getNextMessage() {
    return queue.remove(0);
  }

}