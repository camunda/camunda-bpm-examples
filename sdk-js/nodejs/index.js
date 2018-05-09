'use strict';
/* jshint node:true */

/*************\
 * Utilities *
\*************/
var inquirer = require('inquirer');
var Table = require('cli-table');
var fs = require('fs');
var path = require('path');

var deployDir = __dirname + '/bpmn';

function notEmpty(input) {
  return !!input;
}

function byId(objs, id) {
  var keys = Object.keys(objs);
  for (var k in keys) {
    if (objs[keys[k]].id === id) {
      return objs[keys[k]];
    }
  }
}

function toArray(obj) {
  var arr = [];
  Object.keys(obj).forEach(function (key) {
    arr.push(obj[key]);
  });
  return arr;
}

function thr(err) {
  if (err) {
    throw err;
  }
}

// returns an array of functions reading the content of files.
// To be used in CamSDK.utils.series()
function readFiles(dirPath, filenames) {
  return filenames.map(function (filename) {
    return function (cb) {
      fs.readFile(path.join(dirPath, filename), function (err, content) {
        if (err) { return cb(err); }

        cb(null, {
          name:    filename,
          content: content.toString()
        });
      });
    };
  });
}





/*************************************\
 * camunda BPM SDK JS implementation *
\*************************************/
var CamSDK = require('camunda-bpm-sdk-js');

var camClient = new CamSDK.Client({
  mock: false,
  // the following URL does not need authentication,
  // but the tradeof is that some requests will fail
  // e.g.: some filters use the reference to the user performing the request
  apiUri: 'http://localhost:8080/engine-rest'
});

var processDefinitionService  = new camClient.resource('process-definition');
var processInstanceService    = new camClient.resource('process-instance');
var filterService             = new camClient.resource('filter');
var deploymentService         = new camClient.resource('deployment');




function deployProcesses(options) {
  // get the files of the choosed direcory
  fs.readdir(options.dirPath, function (err, dirFiles) {
    thr(err);

    // store the path to be used as default value next time it's used
    deployDir = options.dirPath;

    inquirer.prompt([
      {
        type: 'checkbox',
        name: 'files',
        message: 'Which files do you want to deploy?',
        choices: dirFiles,
        validate: function (input) {
          return !!input.length;
        }
      }
    ], function (answers) {
      // collect the content of the choosed files to be then uploaded
      CamSDK.utils.series(readFiles(options.dirPath, answers.files), function (err, files) {
        thr(err);

        console.info(Object.keys(files).length + ' files will be deployed');

        // create a deployment with...
        deploymentService.create({
          // ... the settings
          deploymentName:           options.deploymentName,
          enableDuplicateFiltering: options.enableDuplicateFiltering,
          deployChangedOnly:        options.deployChangedOnly,
          // ... and the files
          files:                    toArray(files)
        }, function (err, deployment) {
          thr(err);

          home('deployment "' + deployment.name + '" succeeded, ' + deployment.deploymentTime);
        });
      });
    });
  });
}



function startProcess() {
  // get the list of available process definitions
  processDefinitionService.list({}, function (err, results) {
    thr(err);

    // make the results suitable for inquirer choices
    var definitions = results.items.map(function (definition) {
      return {
        value: definition.id,
        name: definition.name || definition.key || definition.id
      };
    });

    // ask which process should be started
    inquirer.prompt([
      {
        type: 'list',
        name: 'processDefinitionId',
        message: 'Which process should be started?',
        choices: definitions
      }
    ], function (answers) {
      // start the choosed process definition
      processDefinitionService.submit({
        id: answers.processDefinitionId
      }, function (err) {
        thr(err);

        home('Process started');
      });
    });
  });
}



function listProcessInstances() {
  // get the list of process instances
  processInstanceService.list({}, function (err, instances) {
    thr(err);

    // collect the relevant process definitions in a array (suitable for CamSDK.utils.series())
    var processDefinitionRequests = {};
    instances.forEach(function (instance) {
      if (!processDefinitionRequests[instance.definitionId]) {
        processDefinitionRequests[instance.definitionId] = function (cb) {
          processDefinitionService.get(instance.definitionId, cb);
        };
      }
    });

    // perform the requests for the process definitions
    CamSDK.utils.series(processDefinitionRequests, function (err, definitions) {
      thr(err);

      var table = new Table({
        head: [
          'Instance ID',
          'Process name',
          'Version',
          'Description'
        ],
        colWidths: [
          38,
          38,
          10,
          40
        ]
      });

      instances.forEach(function (instance) {
        var definition = definitions[instance.definitionId];
        table.push([
          instance.id,
          definition.name || '',
          definition.version || '',
          definition.description || ''
        ]);
      });

      home(table.toString());
    });
  });
}



function listTasksByFilter() {
  // list the tasks filters
  filterService.list({
    resourceType: 'Task'
  }, function (err, filterResults) {
    thr(err);

    // format the results to suite the inquirer choices
    var filters = filterResults.map(function (filter) {
      return {
        value: filter.id,
        name: filter.name
      };
    });

    // ask for which filter the tasks should be listed
    inquirer.prompt([
      {
        type: 'list',
        name: 'filterId',
        message: 'For which filter do you want the tasks?',
        choices: filters
      }
    ], function (answers) {
      var selectedFilter = byId(filterResults, answers.filterId);

      // get the filtered results
      filterService.getTasks(selectedFilter.id, function (err, taskResults) {
        thr(err);

        var count = (taskResults._embedded && taskResults._embedded.task) ? taskResults._embedded.task.length : 0;

        if (!count) {
          return home('No task for filter  "' + selectedFilter.name + '"');
        }

        var table = new Table({
          head: [
            'Task ID',
            'Process name',
            'Task name'
          ],
          colWidths: [
            38,
            38,
            38
          ]
        });

        taskResults._embedded.task.forEach(function (task) {
          table.push([
            task.id || '',
            task._embedded.processDefinition && task._embedded.processDefinition[0].name || '',
            task.name || ''
          ]);
        });

        home(table.toString());
      });
    });
  });
}




/*************\
 * "Routing" *
\*************/
function home(splash) {
  // clear the terminal
  console.log('\u001B[2J\u001B[0;0f');

  if (splash) {
    console.log(splash);
  }

  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to perform?',
      choices: [
        {
          value: 'deploy',
          name: 'Deploy process'
        },
        {
          value: 'start-process',
          name: 'Start a process'
        },
        {
          value: 'list-process-instance',
          name: 'List process instances'
        },
        new inquirer.Separator(),
        {
          value: 'list-tasks-by-filter',
          name: 'List tasks by filter'
        },
        new inquirer.Separator(),
        {
          value: 'leave',
          name: 'Leave the interface'
        }
      ]
    },



    {
      when: function (answers) {
        return answers.action === 'deploy';
      },
      type: 'input',
      name: 'deploymentName',
      message: 'How should the deployment be named?',
      validate: notEmpty
    },
    {
      when: function (answers) {
        return answers.action === 'deploy';
      },
      type: 'confirm',
      name: 'enableDuplicateFiltering',
      message: 'Should the duplicates be filtered?',
      default: false
    },
    {
      when: function (answers) {
        return answers.action === 'deploy';
      },
      type: 'confirm',
      name: 'deployChangedOnly',
      message: 'Should only the changed processes be deployed?',
      default: false
    },
    {
      when: function (answers) {
        return answers.action === 'deploy';
      },
      type: 'input',
      name: 'dirPath',
      message: 'In which directory are the files to be deployed?',
      default: deployDir
    }
  ], function(answers) {
    switch (answers.action) {
      case 'deploy':
        deployProcesses(answers);
        break;

      case 'start-process':
        startProcess();
        break;

      case 'list-process-instance':
        listProcessInstances();
        break;

      case 'list-tasks-by-filter':
        listTasksByFilter();
        break;

      case 'leave':
        console.log('\u001B[2J\u001B[0;0f');
        return;

      default:
        home('that... should not happen');
    }
  });
}

home('Important note: Some actions might fail because they need authentication.');
