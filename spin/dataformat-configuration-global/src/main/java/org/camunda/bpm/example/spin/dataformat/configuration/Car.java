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
package org.camunda.bpm.example.spin.dataformat.configuration;

/**
 * We want objects of this class to serialize like
 *
 * {"price" : 1000}
 *
 * However, default Jackson serialization makes
 *
 * {"price" : {"amount" : 1000}}
 *
 * out of it.
 * That's why we register a Jackson module to change the (de-)serialization of {@link Money} objects.
 *
 * @author Thorben Lindhauer
 */
public class Car {

  protected Money price;

  public Money getPrice() {
    return price;
  }

  public void setPrice(Money price) {
    this.price = price;
  }
}
