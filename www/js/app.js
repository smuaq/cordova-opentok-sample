angular.module('smuaq.opentok', ['ionic','ngCordova','ngIdle','smuaq.opentok.controllers'])

.run(function($ionicPlatform, $state) {
  $ionicPlatform.ready(function() {

    $state.go("dash");


    if (!!window.cordova) {
      screen.lockOrientation('portrait');
    }

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, IdleProvider) {

  IdleProvider.idle(5);
  IdleProvider.timeout(259200000);

  $stateProvider
    .state('dash', {
      url: '/dash',
      templateUrl: 'dash.html',
      controller: 'Dash'
    })
    .state('video-stream', {
      url: '/videoStream',
      templateUrl: 'video-stream.html',
      controller: 'VideoStream'
    });
});


