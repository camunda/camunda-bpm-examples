/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.tutorial.multitenancy;


import java.util.ArrayList;
import java.util.List;

import org.camunda.bpm.engine.repository.ProcessDefinition;

/**
 * @author Thorben Lindhauer
 *
 */
public class ProcessDefinitionDto {

  protected String id;
  protected String key;
  protected int version;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }

  public static ProcessDefinitionDto fromProcessDefinition(ProcessDefinition definition) {
    ProcessDefinitionDto dto = new ProcessDefinitionDto();
    dto.id = definition.getId();
    dto.key = definition.getKey();
    dto.version = definition.getVersion();

    return dto;
  }

  public static List<ProcessDefinitionDto> fromProcessDefinitions(List<ProcessDefinition> definitions) {
    List<ProcessDefinitionDto> dtos = new ArrayList<ProcessDefinitionDto>();

    for (ProcessDefinition definition : definitions) {
      dtos.add(fromProcessDefinition(definition));
    }

    return dtos;
  }
}
