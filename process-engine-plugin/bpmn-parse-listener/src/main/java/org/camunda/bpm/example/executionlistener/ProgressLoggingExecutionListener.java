package org.camunda.bpm.example.executionlistener;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.ExecutionListener;

/**
 * Execution listener to log property extension value
 *
 * @author kristin.polenz
 *
 */
public class ProgressLoggingExecutionListener implements ExecutionListener {

  private final Logger LOGGER = Logger.getLogger(this.getClass().getName());

  public static List<String> progressValueList = new ArrayList<String>();

  private String propertyValue;

  public ProgressLoggingExecutionListener(String value) {
    this.propertyValue = value;
  }

  public void notify(DelegateExecution execution) throws Exception {
    progressValueList.add(propertyValue);
    LOGGER.info("value of service task extension property 'progress': " + propertyValue);
  }

}
