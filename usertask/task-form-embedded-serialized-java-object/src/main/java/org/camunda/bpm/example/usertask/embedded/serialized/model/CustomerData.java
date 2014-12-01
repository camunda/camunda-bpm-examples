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
package org.camunda.bpm.example.usertask.embedded.serialized.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a complex data object modeling customer data.
 * The data is stored as JSON which is automatically mapped to this java
 * object by the process engine.
 *
 * @author Daniel Meyer
 *
 */
public class CustomerData {

  protected String firstname;
  protected String lastname;
  protected boolean isVip;
  protected float rating;
  protected List<Address> addresses = new ArrayList<Address>();

  public String getFirstname() {
    return firstname;
  }
  public void setFirstname(String firstname) {
    this.firstname = firstname;
  }
  public String getLastname() {
    return lastname;
  }
  public void setLastname(String lastname) {
    this.lastname = lastname;
  }
  public boolean isVip() {
    return isVip;
  }
  public void setVip(boolean isVip) {
    this.isVip = isVip;
  }
  public float getRating() {
    return rating;
  }
  public void setRating(float rating) {
    this.rating = rating;
  }
  public List<Address> getAddresses() {
    return addresses;
  }
  public void setAddresses(List<Address> addresses) {
    this.addresses = addresses;
  }

  public String toString() {
    return "CustomerData [firstname=" + firstname + ", lastname=" + lastname + ", isVip=" + isVip + ", rating=" + rating + ", addresses=" + addresses + "]";
  }

}
