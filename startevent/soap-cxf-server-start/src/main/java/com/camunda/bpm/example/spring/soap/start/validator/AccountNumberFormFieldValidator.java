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
package com.camunda.bpm.example.spring.soap.start.validator;

import org.camunda.bpm.engine.impl.form.validator.FormFieldValidator;
import org.camunda.bpm.engine.impl.form.validator.FormFieldValidatorContext;

/**
 * Simple example custom {@linkplain FormFieldValidator} for account numbers. <br/><br/>
 * Enforces that account numbers may only consist of digits 0 through 9.
 * 
 * @author Thomas Skjolberg
 *
 */

public class AccountNumberFormFieldValidator implements FormFieldValidator {

  private static final String PATTERN = "[0-9]+";
  
  @Override
  public boolean validate(Object submittedValue, FormFieldValidatorContext validatorContext) {
    if(submittedValue instanceof String) {
      String string = (String)submittedValue;
      
      return string.matches(PATTERN);
    }
    
    return false;
  }

}
