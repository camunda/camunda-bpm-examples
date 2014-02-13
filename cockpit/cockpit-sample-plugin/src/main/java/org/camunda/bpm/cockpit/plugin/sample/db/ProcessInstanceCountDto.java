package org.camunda.bpm.cockpit.plugin.sample.db;

/**
 *
 * @author nico.rehwaldt
 */
public class ProcessInstanceCountDto {

  private String key;

  private int instanceCount;

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public int getInstanceCount() {
    return instanceCount;
  }

  public void setInstanceCount(int instanceCount) {
    this.instanceCount = instanceCount;
  }
}
