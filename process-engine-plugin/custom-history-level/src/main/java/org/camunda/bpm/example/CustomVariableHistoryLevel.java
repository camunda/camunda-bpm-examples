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

import java.util.ArrayList;
import java.util.List;

import org.camunda.bpm.engine.impl.history.HistoryLevel;
import org.camunda.bpm.engine.impl.history.event.HistoryEventType;
import org.camunda.bpm.engine.impl.history.event.HistoryEventTypes;
import org.camunda.bpm.engine.runtime.VariableInstance;

public class CustomVariableHistoryLevel implements HistoryLevel {

  public static final CustomVariableHistoryLevel INSTANCE = new CustomVariableHistoryLevel();

  protected static final List<HistoryEventType> VARIABLE_EVENT_TYPES = new ArrayList<HistoryEventType>();

  static {
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_CREATE);
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_UPDATE);
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_DELETE);
  }

  public static CustomVariableHistoryLevel getInstance() {
    return INSTANCE;
  }

  public int getId() {
    return 11;
  }

  public String getName() {
    return "custom-variable";
  }

  public boolean isHistoryEventProduced(HistoryEventType historyEventType, Object entity) {
    return !VARIABLE_EVENT_TYPES.contains(historyEventType)
      || isVariableEventProduced((VariableInstance) entity);
  }

  protected boolean isVariableEventProduced(VariableInstance variableInstance) {
    return variableInstance == null || variableInstance.getName().endsWith("-hist");
  }

}
