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
import java.util.Arrays;
import java.util.List;

import org.camunda.bpm.dmn.engine.DmnDecision;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.dmn.engine.DmnEngine;
import org.camunda.bpm.dmn.engine.DmnEngineConfiguration;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;

public class BeveragesDecider {

  private static final List<String> SEASONS = Arrays.asList("Winter", "Spring", "Summer");

  public static void printUsage(String errorMessage, int exitCode) {
    System.err.println("Error: " + errorMessage);
    System.err.println("Usage: java -jar BeveragesDecider.jar Spring 10 false");
    System.exit(exitCode);
  }

  public static void main(String[] args) {

    validateInput(args);

    VariableMap variables = prepareVariableMap(args);

    // parse decision from resource input stream
    InputStream inputStream = BeveragesDecider.class.getResourceAsStream("dinnerDecisions.dmn");

    try {
      parseAndEvaluateDecision(variables, inputStream);

    } finally {
      try {
        inputStream.close();
      } catch (IOException e) {
      }
    }
  }

  protected static void validateInput(String[] args) {

    // parse arguments
    if (args.length != 3) {
      printUsage("Please specify the season, guest count and if guests have children", 1);
    }

    String season = args[0];
    if (!SEASONS.contains(season)) {
      printUsage("Season must be one of " + SEASONS, 2);
    }

    try  {
     Integer.parseInt(args[1]);
    }
    catch (NumberFormatException e) {
      printUsage("Guest count must be a number", 2);
    }
  }

  protected static VariableMap prepareVariableMap(String[] args) {

    String season = args[0];
    int guestCount = Integer.parseInt(args[1]);
    boolean guestsWithChildren = Boolean.parseBoolean(args[2]);

    // prepare variables for decision evaluation
    VariableMap variables = Variables
      .putValue("season", season)
      .putValue("guestCount", guestCount)
      .putValue("guestsWithChildren", guestsWithChildren);

    return variables;
  }

  protected static void parseAndEvaluateDecision(VariableMap variables, InputStream inputStream) {

    // create a new default DMN engine
    DmnEngine dmnEngine = DmnEngineConfiguration.createDefaultDmnEngineConfiguration().buildEngine();

    DmnDecision decision = dmnEngine.parseDecision("beverages", inputStream);

    // evaluate decision
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);

    // print result
    List<String> beverages = result.collectEntries("beverages");
    System.out.println("Beverages:\n\tI would recommend to serve: " + beverages);
  }


}