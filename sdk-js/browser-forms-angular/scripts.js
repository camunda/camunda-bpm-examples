/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
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

(function (global){
'use strict';

var CamSDK = global.CamSDK;

var angular = global.angular;

var $ = angular.element;

var camClient = new CamSDK.Client({
  mock: false,
  apiUri: '/engine-rest'
});

var taskService = new camClient.resource('task');

var $formContainer = $('.column.right');

var app = angular.module('example.app', ['cam.embedded.forms']);


app.controller('appCtrl', ['$scope', function($scope) {
  $scope.camForm = null;



  function loadTasks() {
    taskService.list({}, function(err, results) {
      if (err) { throw err; }

      $scope.$apply(function() {
        $scope.tasks = results._embedded.task;
      });
    });
  }



  function addFormButton(err, camForm) {
    if (err) { throw err; }

    // create a button element
    var $submitBtn = $('<button type="submit">Complete</button>')
      // with a click handler to submit the form
      .click(function () {
        camForm.submit(function (err) {
          if (err) { throw err; }

          // clear the form
          $formContainer.html('');

          loadTasks();
        });
      });

    // and append it to the form
    camForm.formElement.append($submitBtn);
  }



  $scope.loadTaskForm = function($event) {
    var taskId = $($event.currentTarget).attr('data-task-id');

    // clear the form container content
    $formContainer.html('');

    // loads the task form using the task ID provided
    taskService.form(taskId, function(err, taskFormInfo) {
      var url = taskFormInfo.key.replace('embedded:app:', taskFormInfo.contextPath + '/');

      new CamSDK.Form({
        client: camClient,
        formUrl: url,
        taskId: taskId,
        containerElement: $formContainer,

        // continue the logic with the callback
        done: addFormButton
      });
    });
  };

  // load the tasks at start
  loadTasks();
}]);



angular.bootstrap(document, ['example.app']);

})(this);
