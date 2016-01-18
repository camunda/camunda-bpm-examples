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
package org.camunda.bpm.example.spin.dataformat.servlet;

import java.io.IOException;

import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.example.spin.dataformat.configuration.Car;
import org.camunda.bpm.example.spin.dataformat.configuration.Money;

/**
 * @author Thorben Lindhauer
 *
 */
public class StartProcessServlet extends HttpServlet {

  private static final long serialVersionUID = 1L;

  @Inject
  protected ProcessInstanceStarterBean starterBean;

  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    Car car = new Car();
    car.setPrice(new Money(1000));

    ProcessInstance processInstance = starterBean.startProcess(car);

    response.getWriter().write(processInstance.getId());
  }

  public ProcessInstanceStarterBean getStarterBean() {
    return starterBean;
  }

  public void setStarterBean(ProcessInstanceStarterBean starterBean) {
    this.starterBean = starterBean;
  }

}
