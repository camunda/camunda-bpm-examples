ngDefine('cockpit.plugin.sample-plugin', function(module) {

  var DashboardController = function($scope, $http, Uri) {

    $http.get(Uri.appUri("plugin://sample-plugin/:engine/process-instance"))
      .success(function(data) {
        $scope.processInstanceCounts = data;
      });
  };

  DashboardController.$inject = ["$scope", "$http", "Uri"];


  var Configuration = function Configuration(ViewsProvider) {

    ViewsProvider.registerDefaultView('cockpit.dashboard', {
      id: 'process-definitions',
      label: 'Deployed Processes',
      url: 'plugin://sample-plugin/static/app/dashboard.html',
      controller: DashboardController,

      // make sure we have a higher priority than the default plugin
      priority: 12
    });
  };

  Configuration.$inject = ['ViewsProvider'];

  module.config(Configuration);

  return module;
});
