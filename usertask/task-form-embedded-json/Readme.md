# Json  Variables in Embedded Forms

This example demonstrates how to work with json variables in embedded forms.

## Creating a Json Variable in a Start Form

The process instance is started using a form. The form is a plain HTML form which is displayed
inside Camunda Tasklist (or inside a custom application using the camunda-bpm-sdk-js library).

```html
<form role="form" class="form-horizontal">

  <script cam-script type="text/form-script">

    var customer = $scope.customer = {};

    camForm.on('form-loaded', function() {

      // declare a 'json' variable 'customer' 
      camForm.variableManager.createVariable({
        name: 'customer',
        type: 'json',
        value: customer
      });
    });

  </script>

  <div class="control-group">
    <label class="control-label" for="firstName">First Name</label>
    <div class="controls">
      <input id="firstName" class="form-control" type="text" ng-model="customer.firstName" required />
    </div>
  </div>

  <!-- ... Additional fields ommitted -->

  </div>
</form>
```

The custom java script creates a Javascript Object and binds it to the angular `$scope` of the form
as a variable named `customer`. We then hook into the lifecycle of camunda SDK JS Form and
create a process variable named `customer` and provide as type information 'json' used for serialization.

The form itself is a plain angular js form (see `ng-model` binding of input field).

## Accessing an existing Json Variable in a Task Form

In a task form, an existing Json variable can be accessed using custom Javascript. The
pattern is to first fetch the value of the variable and then bind it to an angular scope variable:


```javascript
camForm.on('form-loaded', function() {
  // tell the form SDK to fetch the json variable named 'customer'
  camForm.variableManager.fetchVariable('customer');
});

camForm.on('variables-fetched', function() {
  // work with the variable (bind it to the current AngularJS $scope)
  $scope.customer = camForm.variableManager.variableValue('customer');
});
```

## Running the example

1. [Download a Camunda BPM Distribution](http://camunda.org/download)
2. Checkout this repository using Git
3. Build the example using `mvn clean package`
4. Deploy the `.war` file located in the `target/` folder to the server
5. Open Camunda Tasklist using the URL [http://localhost:8080/camunda/app/tasklist](http://localhost:8080/camunda/app/tasklist)
6. Start a new instance of the Process.
