package org.camunda.examples;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * @author Christopher Zell <christopher.zell@camunda.com>
 */

public class ExampleDto {

  public String property1;
  /**
   * This property should be ignored on serialization.
   */
  @JsonIgnore
  public String property2;
  public String property3;

  public ExampleDto(String property1, String property2, String property3) {
    this.property1 = property1;
    this.property2 = property2;
    this.property3 = property3;
  }

  public ExampleDto() {
  }

}
