/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

package org.camunda.bpm.example.drg;

import java.io.IOException;
import java.io.InputStream;

import org.camunda.bpm.dmn.engine.DmnDecision;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.dmn.engine.DmnEngine;
import org.camunda.bpm.dmn.engine.DmnEngineConfiguration;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;

public class DishDecider {

  public static void printUsage(String errorMessage, int exitCode) {
    System.err.println("Error: " + errorMessage);
    System.err.println("Usage: java -jar DishDecider.jar CURRENT_TEMPERATURE TYPE_OF_DAY\n\n\tTEMPERATURE: Current Temperature in number \n\tTYPE_OF_DAY: (Weekday, Holiday, Weekend)");
    System.exit(exitCode);
  }

  public static void main(String[] args) {

    validateInput(args);

    VariableMap variables = prepareVariableMap(args);

    // parse decision from resource input stream
    InputStream inputStream = DishDecider.class.getResourceAsStream("drg-dish-decision.dmn11.xml");
    parseAndEvaluateDecision(variables, inputStream);
    
  }

  protected static void validateInput(String[] args) {

    // parse arguments
    if (args.length != 2) {
      printUsage("Please specify the current temperature and type of day", 1);
    }

    try  {
     Integer.parseInt(args[0]);
    }
    catch (NumberFormatException e) {
      printUsage("Temperature must be a number", 2);
    }
    
    String typeOfDay = args[1];
    if(!((typeOfDay.equals("Weekday")) 
      || (typeOfDay.equals("Holiday"))  
      || (typeOfDay.equals("Weekend")))) {
      printUsage("Type of day must be of type - Weekday/Holiday/Weekend", 2);
    }

  }

  protected static VariableMap prepareVariableMap(String[] args) {

    int temperature = Integer.parseInt(args[0]);
    String typeOfDay = args[1];

    // prepare variables for decision evaluation
    VariableMap variables = Variables
      .putValue("temperature", temperature)
      .putValue("dayType", typeOfDay);

    return variables;
  }

  protected static void parseAndEvaluateDecision(VariableMap variables, InputStream inputStream) {

    // create a new default DMN engine
    DmnEngine dmnEngine = DmnEngineConfiguration.createDefaultDmnEngineConfiguration().buildEngine();

    try {
      DmnDecision decision = dmnEngine.parseDecision("Dish", inputStream);

      // evaluate decision
      DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

      // print result
      String desiredDish = result.getSingleResult().getSingleEntry();
      System.out.println("Dish Decision:\n\tI would recommend to serve: " + desiredDish);

    }
    finally {
      try {
        inputStream.close();
      }
      catch (IOException e) {
        System.err.println("Could not close stream: "+e.getMessage());
      }
    }
  }

  
}