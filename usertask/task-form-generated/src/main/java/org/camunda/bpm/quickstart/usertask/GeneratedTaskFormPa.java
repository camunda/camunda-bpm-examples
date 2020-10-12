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
package org.camunda.bpm.quickstart.usertask;

import javax.servlet.ServletContextListener;

import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.ServletProcessApplication;

/**
 * <p>This class transforms your regular java web application 
 * into a "Process Application". A process application is 
 * an application which interacts with the process engine,
 * provides BPMN deployment resources and delegate code.</p>
 * 
 * <p>See also:
 * <a href="https://docs.camunda.org/manual/7.14/user-guide/process-applications/the-process-application-class/#the-servletprocessapplication">User Guide on the Servlet Process Application</a>
 * </p>
 * 
 * <p>From a technical perspective, this a class is a 
 * {@link ServletContextListener} which is auto-activated 
 * using the {@link ProcessApplication} annotation. When the 
 * application is deployed, it will scan the classpath for
 * process definition resources (files ending in *.bpmn) and
 * deploy them to the process engine.</p>
 * 
 * <p>This class is accompanied by a META-INF/processes.xml
 * deployment descriptor.</p>
 * 
 */
@ProcessApplication
public class GeneratedTaskFormPa extends ServletProcessApplication {

}
