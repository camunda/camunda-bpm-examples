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
