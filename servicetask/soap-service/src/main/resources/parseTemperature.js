// this script parses the temperature from the response

// remove prologue which cannot be parsed: '<?xml version="1.0" encoding="utf-16"?>'
var rawForecast = execution.getVariable('forecast');
var forecast = rawForecast.substring(rawForecast.indexOf("\n"));

var parsedTemperature = S(forecast).childElement("Temperature").textContent();

// temperature looks like this: <Temperature> 68 F (20 C)</Temperature>
var regex = /\((-?\d+) C\)/;

// return only the temperature in C:
regex.exec(parsedTemperature)[1];
