package org.camunda.bpm.example.parselistener;

import java.util.List;

import org.camunda.bpm.application.impl.event.ProcessApplicationEventParseListener;
import org.camunda.bpm.engine.delegate.ExecutionListener;
import org.camunda.bpm.engine.impl.bpmn.parser.AbstractBpmnParseListener;
import org.camunda.bpm.engine.impl.pvm.process.ActivityImpl;
import org.camunda.bpm.engine.impl.pvm.process.ScopeImpl;
import org.camunda.bpm.engine.impl.util.xml.Element;
import org.camunda.bpm.example.executionlistener.ProgressLoggingExecutionListener;

/**
 * BPMN Parse Listener to parse extension properties on service task
 *
 * @author kristin.polenz
 *
 */
public class ProgressLoggingSupportParseListener extends AbstractBpmnParseListener {

  @Override
  public void parseServiceTask(Element serviceTaskElement, ScopeImpl scope, ActivityImpl activity) {
    Element extensionElement = serviceTaskElement.element("extensionElements");
    if (extensionElement != null) {
      Element propertiesElement = extensionElement.element("properties");
      if (propertiesElement != null) {
        //  get list of <camunda:property ...> elements
        List<Element> propertyList = propertiesElement.elements("property");
        for (Element property : propertyList) {
          String name = property.attribute("name");
          String value = property.attribute("value");
          if("progress".equals(name)) {
            ProgressLoggingExecutionListener progressLoggingExecutionListener = new ProgressLoggingExecutionListener(value);
            activity.addListener(ExecutionListener.EVENTNAME_END, progressLoggingExecutionListener);
          }
        }
      }
    }
  }

}
