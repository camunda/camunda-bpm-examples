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
package org.camunda.bpm.plugin.activedirectory.cockpit;

import java.util.HashSet;
import java.util.Set;
import org.camunda.bpm.cockpit.plugin.spi.impl.AbstractCockpitPlugin;

public class ActiveDirectoryCockpitPlugin extends AbstractCockpitPlugin {

  public static final String ID = "active-directory-cockpit";

  public String getId() {
    return ID;
  }

  @Override
  public Set<Class<?>> getResourceClasses() {
    Set<Class<?>> classes = new HashSet<>();

    classes.add(ActiveDirectoryCockpitRootResource.class);

    return classes;
  }
}
