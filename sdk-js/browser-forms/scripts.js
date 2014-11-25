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
