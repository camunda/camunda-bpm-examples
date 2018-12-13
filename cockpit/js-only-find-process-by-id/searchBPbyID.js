define(['angular'], function(angular) {

  var searchBpViewController = ['$scope', '$timeout', 'localConf', function($scope, $timeout, localConf) {
    $scope.pressEnter = function(event) {
        if (event.keyCode === 13) {
	   $timeout(function() {
        	 document.querySelector('#searchBpGo').click();
		}, 0);
           };
        };
    
    $scope.activeSection = localConf.get('searchBpByIDActive', true);
    $scope.activeSection = true;

    $scope.toggleSection = function toggleSection() {
          $scope.activeSection = !$scope.activeSection;
          localConf.set('searchBpByIDActive', $scope.activeSection);
        };


  }];

  var ngModule = angular.module('cockpit.searchBPbyID', []);

  ngModule.config(['ViewsProvider', function(ViewsProvider) {
    ViewsProvider.registerDefaultView('cockpit.processes.dashboard', {
      id: 'cockpit.searchBPbyID',
      label: 'Search process by ID',
      priority: 9001,
      template: '<section class="processes-dashboard" ng-class="{\'section-collapsed\': !activeSection}">'
		+'<div class="inner">'
              	+'<button tooltip="Toggle this section" class="section-toggle btn btn-link btn-sm" ng-click="toggleSection()">'
                +'<span class="glyphicon glyphicon-menu-up" ng-class="{\'glyphicon-menu-down\': !activeSection, \'glyphicon-menu-up\': activeSection}"></span></button>'
		+'<h2>Search process by ID</h2>'
		+'<div ng-if="activeSection"><br/>Enter process IDs: <input ng-keydown="pressEnter($event)" id="processId" ng-model="bpID" type="text" size="80"></input> '
		+'<a id="searchBpGo" href="#/process-instance/{{bpID}}"><button>Search</button></a></div>'
		+'</div></section>',
      controller: searchBpViewController
    });
  }]);

  return ngModule;
});

