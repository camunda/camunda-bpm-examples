// fetch execution variables
var response = connector.getVariable("response");
var date = connector.getVariable("date");

// parse response variable with camunda-spin
var holidays = S(response);

var query = "$..[?(@.datum=='" + date + "')]";

// use camunda-spin jsonPath to test if date is a holiday
!holidays.jsonPath(query).elementList().isEmpty();
