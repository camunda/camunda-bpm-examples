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
      }).success(function(data) {
        pages.total = data.count;
      });

      var params = angular.extend({}, pagingParams, queryParams);

      $http.get(Uri.appUri('engine://engine/:engine/job'), {
        params : params
      }).success(function(data) {
        $scope.failedJobs = data;
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
