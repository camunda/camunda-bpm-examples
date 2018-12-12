define(['angular'], function(angular) {

  var searchBpViewController = ['$scope', '$timeout', function($scope, $timeout, Uri) {
    $scope.pressEnter = function(event) {
        if (event.keyCode === 13) {
	   $timeout(function() {
        	 document.querySelector('#searchBpGo').click();
		}, 0);
           };
        };
  }];

  var ngModule = angular.module('cockpit.searchBPbyID', []);

  ngModule.config(['ViewsProvider', function(ViewsProvider) {
    ViewsProvider.registerDefaultView('cockpit.processes.dashboard', {
      id: 'cockpit.searchBPbyID',
      priority: 9001,
      template: '<section class="processes-dashboard ng-scope">'
		+'<div class="inner"><h2>Search process by ID</h2>'
		+'<br/>Enter process ID: <input ng-keydown="pressEnter($event)" id="processId" ng-model="bpID" type="text" size="80"></input> '
		+'<a id="searchBpGo" href="/camunda/app/cockpit/default/#/process-instance/{{bpID}}"><button>Search</button></a>'
		+'</div></section>',
      controller: searchBpViewController
    });
  }]);

  return ngModule;
});
