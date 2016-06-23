package org.camunda.bpm.example.drd;

import static org.junit.Assert.assertEquals;

import java.io.InputStream;

import org.camunda.bpm.dmn.engine.DmnDecision;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.dmn.engine.DmnEngine;
import org.camunda.bpm.dmn.engine.test.DmnEngineRule;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class DrdDecisionDishTest {
  
  @Rule
  public DmnEngineRule dmnEngineRule = new DmnEngineRule();
  
  public DmnEngine dmnEngine;
  public DmnDecision decision;
  
  @Before
  public void parseDecision() {
    InputStream inputStream = DrdDecisionDishTest.class
      .getResourceAsStream("drd-dish-decision.dmn11.xml");
    dmnEngine = dmnEngineRule.getDmnEngine();
    decision = dmnEngine.parseDecision("Dish", inputStream);
  }
  
  @Test
  public void shouldServeGuestsOnAWeekEndWithTemperatureOfTwentyDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 20)
      .putValue("dayType", "Weekend");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Steak", result.getSingleResult().getSingleEntry());
  }
  
  @Test
  public void shouldServeGuestsOnAWeekDayWithTemperatureOfTenDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 8)
      .putValue("dayType", "Weekday");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Spareribs", result.getSingleResult().getSingleEntry());
  }
  
  @Test
  public void shouldServeGuestsOnAHolidayWithTemperatureOfThirtyDegree() {
    VariableMap variables = Variables
      .putValue("temperature", 35)
      .putValue("dayType", "Holiday");
    
    DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(decision, variables);
    assertEquals("Beans salad", result.getSingleResult().getSingleEntry());
  }
  
}