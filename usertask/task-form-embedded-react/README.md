This example works with Chrome and Firefox.

# Using React Forms with Tasklist
React is a popular library to build user interfaces. If you want to use react to build custom Tasklist forms, you can use this example as a starting point. We adapted the [React Multiple Inputs Example](https://reactjs.org/docs/forms.html#handling-multiple-inputs) and integrated it into a process.

## Overview
### How can I add React to my Tasklist?
  1. Download [React](https://unpkg.com/react@16.8.6/umd/react.development.js) and [reactDOM](https://unpkg.com/react-dom@16.8.6/umd/react-dom.development.js) into the `app/tasklist/scripts/react` of your webapp.
  2. Add [loadReact.js](config/react/loadReact.js) to the same folder. This will add React and ReactDOM to the global scope. If you use the production build of react, adjust the imports accordingly. 
  3. Add the loader as a custom script in `app/tasklist/scripts/config.js`. 
  ```javascript
    customScripts: [
      'scripts/react/loadReact.js'
    ]
  ```
That's it, you can now use react in your custom forms.

### How can I get access to process variables?
All process variables will be managed with the `camForm.variableManager`. You need to load existing and create new variables. How this is done is described in detail in the [Embedded Forms Reference](https://docs.camunda.org/manual/7.14/reference/embedded-forms/javascript/lifecycle/).

Keep in mind that you also have to update the variables this way if they change. You can do this in the `componentDidUpdate()` method of you form component. 

```javascript
componentDidUpdate() {
    $scope.$$camForm.$dirty = true;
    camForm.variableManager.variableValue('isGoing', this.state.isGoing);
    camForm.variableManager.variableValue('numberOfGuests', this.state.numberOfGuests);
}
```

### Can I use JSX?
Yes you can. Just use any JSX preprocessor as you would with any other React project.

## How to use this example
1. Checkout the project with Git
2. Build the project with maven
3. Deploy the WAR file to the Camunda Workflow Engine
4. Add React to Camunda Tasklist as described above
5. Open Camunda Tasklist and start a process instance for the process named "React Example"
