ngDefine('cockpit.plugin.failed-jobs-plugin', function(module) {

  var DashboardController = function($scope, $http, Uri) {

    $scope.jobRestUrl = Uri.appUri("engine://engine/default/job");
    $scope.totalPages = 0;
    $scope.pageNumber = 1;
    $scope.failedJobsCount = 0;

    $scope.loadingCount = true;
    $scope.loading = true;
    $scope.failedJobs = [];

    $scope.filterCriteria = {
      firstResult : 0,
      maxResults : 10,
      withException : true
    };

    var loadPage = function loadPage() {
      $scope.loading = true;
      $scope.filterCriteria.firstResult = ($scope.pageNumber - 1) * 10;
      $http.get($scope.jobRestUrl, {
        params : $scope.filterCriteria
      }).success(function(data) {
        $scope.loading = false;
        $scope.failedJobs = data;
      });
    };

    $scope.$watch('pageNumber', function(newValue, oldValue) {
      if (newValue == oldValue) {
        return;
      }
      loadPage();
    });

    ($scope.loadCount = function loadCount() {
      $scope.loadingCount = true;
      $http.get($scope.jobRestUrl + "/count", {
        params : {
          withException : true
        }
      }).success(function(data) {
        $scope.loadingCount = false;

        if ($scope.failedJobsCount == data.count) {
          return;
        }

        $scope.failedJobsCount = data.count;
        var pg = parseInt(data.count / 10);
        $scope.totalPages = (data.count % 10) ? (pg + 1) : pg;
        
        if(!data.count){
          $scope.failedJobs = [];
        }
        else if($scope.failedJobs.length == 0){
          loadPage();
        }
      });
    })();
  };

  DashboardController.$inject = [ "$scope", "$http", "Uri" ];

  var Configuration = function Configuration(ViewsProvider) {

    ViewsProvider.registerDefaultView('cockpit.dashboard', {
      id : 'failed-jobs',
      label : 'Failed Jobs',
      url : 'plugin://failed-jobs-plugin/static/app/dashboard.html',
      controller : DashboardController,
      priority : 15
    });
  };

  Configuration.$inject = [ 'ViewsProvider' ];

  module.config(Configuration);

  return module;
});