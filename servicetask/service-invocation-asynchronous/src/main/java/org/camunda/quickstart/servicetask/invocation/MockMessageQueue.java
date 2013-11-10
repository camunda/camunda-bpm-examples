package org.camunda.quickstart.servicetask.invocation;

import java.util.HashMap;
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
    
    protected Map<String, Object> payload = new HashMap<String, Object>();

    public Message(Map<String, Object> payload) {
      this.payload = payload;
    }
    
    public Map<String, Object> getPayload() {
      return payload;
    }
     
  }
  
  protected List<Message> queue = new LinkedList<MockMessageQueue.Message>();
  
  public final static MockMessageQueue INSTANCE = new MockMessageQueue();
  
  public void send(Message m) {
    queue.add(m);
  }
  
  public Message getNextMessage() {
    return queue.remove(0);
  }

}