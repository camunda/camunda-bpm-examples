define(['angular'], function(angular) {

  var ngModule = angular.module('cockpit.cats', []);

  ngModule.config(['ViewsProvider', function(ViewsProvider) {
    ViewsProvider.registerDefaultView('cockpit.dashboard', {
      id: 'cockpit.cats',
      priority: 9001,
      template: '<h1>Cats!</h1><img src="http://thecatapi.com/api/images/get?size=medium" width="400" />'
    });
  }]);

  return ngModule;
});
