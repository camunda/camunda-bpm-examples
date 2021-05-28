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
package org.camunda.bpm.example.spring.servlet.pa;

import java.util.logging.Level;
import java.util.logging.Logger;

public class ExampleBean {

  public static final Logger LOG = Logger.getLogger(ExampleBean.class.getName());

  protected boolean invoked;

  public void invoke() {
    this.invoked = true;
    LOG.log(Level.INFO, "{0} is currently invoked.", getClass().getName());
  }

  public boolean isInvoked() {
    LOG.log(Level.INFO, "{0} is invoked.", getClass().getName());
    return invoked;
  }

  public void setInvoked(boolean invoked) {
    this.invoked = invoked;
    LOG.log(Level.INFO, "{0} set invoked={1}", new Object[] { getClass().getName(), invoked });
  }

}
