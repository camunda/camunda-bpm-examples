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
package org.camunda.bpm.example;

import java.util.List;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngineException;
import org.camunda.bpm.engine.impl.bpmn.parser.DefaultFailedJobParseListener;
import org.camunda.bpm.engine.impl.bpmn.parser.FailedJobRetryConfiguration;
import org.camunda.bpm.engine.impl.pvm.process.ActivityImpl;
import org.camunda.bpm.engine.impl.pvm.process.ScopeImpl;
import org.camunda.bpm.engine.impl.util.ParseUtil;
import org.camunda.bpm.engine.impl.util.xml.Element;

public class FailedJobRetryProfileParseListener extends DefaultFailedJobParseListener {

  private Map<String, String> retryProfiles;

  public FailedJobRetryProfileParseListener(Map<String, String> retryProfiles) {
    super();
    this.retryProfiles = retryProfiles;
  }

  @Override
  public void parseServiceTask(Element serviceTaskElement, ScopeImpl scope, ActivityImpl activity) {
    // each service task is asynchronous
    activity.setAsyncBefore(true);
    parseActivity(serviceTaskElement, activity);
  }

  protected Element getProfileElement(Element element) {
    Element extensionElement = element.element("extensionElements");
    if (extensionElement != null) {
      Element propertiesElement = extensionElement.element("properties");
      if (propertiesElement != null) {
        // get list of <camunda:property ...> elements
        List<Element> propertyList = propertiesElement.elements("property");
        for (Element property : propertyList) {
          String name = property.attribute("name");
          if ("retryProfile".equals(name)) {
            return property;
          }
        }
      }
    }
    return null;
  }

  @Override
  protected void setFailedJobRetryTimeCycleValue(Element element, ActivityImpl activity) {
    Element profileElement = getProfileElement(element);
    if (profileElement != null) {
      String retryProfileExpression = null;
      if (retryProfiles != null) {
        String retryProfileName = profileElement.attribute("value");
        retryProfileExpression = retryProfiles.get(retryProfileName);
      } else {
        throw new ProcessEngineException("Something went wrong with the configuration.");
      }

      FailedJobRetryConfiguration configuration = ParseUtil.parseRetryIntervals(retryProfileExpression);
      activity.getProperties().set(FAILED_JOB_CONFIGURATION, configuration);
    } else {
      super.setFailedJobRetryTimeCycleValue(element, activity);
    }
  }
}
