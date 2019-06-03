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

var $ = global.jQuery;

var $formContainer = $('.column.right');

var camClient = new CamSDK.Client({
  mock: false,
  apiUri: '/engine-rest'
});

var taskService = new camClient.resource('task');



function loadTasks() {
  // fetch the list of available tasks
  taskService.list({
    // filter?
  }, function (err, results) {
    if (err) {
      throw err;
    }
    showTasks(results);
  });
}



function showTasks(results) {
  // generate the HTML for the list of tasks
  var items = [];
  $.each(results._embedded.task, function (t, task) {
    items = items.concat([
      '<li data-task-id="', task.id, '">',
      '<h4>', task.name || task.id, '</h4>',
      task.description ? '<div class="description">' : '',
      task.description,
      task.description ? '</div>' : '',
      '</li>'
    ]);
  });

  $('#tasks')
    // add the HTML to the list
    .html(items.join(''))

    // attach click events to the task list items
    .find('> li').click(function () {

      // load the the task form (getting the task ID from the tag attribute)
      loadTaskForm($(this).attr('data-task-id'), function(err, camForm) {
        if (err) {
          throw err;
        }

        var $submitBtn = $('<button type="submit">Complete</button>').click(function () {
          camForm.submit(function (err) {
            if (err) {
              throw err;
            }

            // clear the form
            $formContainer.html('');

            loadTasks();
          });
        });

        camForm.containerElement.append($submitBtn);
      });
    });
}



function loadTaskForm(taskId, callback) {
  // loads the task form using the task ID provided
  taskService.form(taskId, function(err, taskFormInfo) {
    var url = taskFormInfo.key.replace('embedded:app:', taskFormInfo.contextPath + '/');

    new CamSDK.Form({
      client: camClient,
      formUrl: url,
      taskId: taskId,
      containerElement: $formContainer,

      // continue the logic with the callback
      done: callback
    });
  });
}

// load the tasks at start
loadTasks();

})(this);
