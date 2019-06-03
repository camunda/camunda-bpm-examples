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

define(['angular'], function(angular) {

  var FailedJobsController = [
           '$scope', '$http', 'Uri',
  function( $scope,   $http,   Uri) {

    $scope.jobRestUrl = Uri.appUri("engine://engine/:engine/job");

    var DEFAULT_PAGES = { size: 10, total: 0, current: 1 };

    var pages = $scope.pages = angular.copy(DEFAULT_PAGES);

    var queryParams = {
      withException : true
    };

    $scope.$watch('pages.current', function(newValue, oldValue) {
      updateView();
    });

    function updateView () {
      var page = pages.current,
          count = pages.size,
          firstResult = (page - 1) * count;

      var pagingParams = {
        firstResult: firstResult,
        maxResults: count
      };

      $http.get(Uri.appUri('engine://engine/:engine/job/count'), {
        params : queryParams
      }).then(function(res) {
        pages.total = res.data.count;
      });

      var params = angular.extend({}, pagingParams, queryParams);

      $http.get(Uri.appUri('engine://engine/:engine/job'), {
        params : params
      }).then(function(res) {
        $scope.failedJobs = res.data;
      });
    }

  }];

  var Configuration = ['ViewsProvider', function(ViewsProvider) {

    ViewsProvider.registerDefaultView('cockpit.dashboard', {
      id : 'failed-jobs',
      label : 'Failed Jobs',
      url: 'plugin://failed-jobs-plugin/static/app/failed-jobs-table.html',
      dashboardMenuLabel: 'Failed Jobs',
      controller : FailedJobsController,
      priority : 15
    });
  }];

  var ngModule = angular.module('cockpit.plugin.failed-jobs-plugin', []);

  ngModule.config(Configuration);

  return ngModule;
});
