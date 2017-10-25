angular.module('smuaq.opentok.controllers')
  .controller('VideoStream', function ($scope, $state, $stateParams, $timeout, $rootScope,
                                       $ionicPopup, $ionicPlatform, $cordovaStatusbar, $cordovaInsomnia,
                                       $cordovaDialogs, Idle) {

    var deRegister =  $ionicPlatform.registerBackButtonAction(function() {
      $scope.showConfirm_Back();
    }, 100);

    $scope.$on('$destroy', deRegister);
    $scope.$on('$destroy', function destroyed() {
      $("*").removeClass("video-stream");
    });

    window.addEventListener("orientationchange", function () {
      if (isConnected) {
        TB.updateViews();
      }
    });

    if(!!window.cordova)  {
      $ionicPlatform.ready(function () {
        $cordovaInsomnia.keepAwake();
        screen.unlockOrientation();
      });
    }

    // var apiKey = $rootScope.tbApi.apiKey;
    var apiKey = "";
    // var sessionId = $stateParams.sessionID;
    var sessionId = "";
    // var token = $stateParams.sessionToken;
    var token = ""

    var session = null;
    var publisher = null;
    var subscriber = null;

    // Session Methods
    var isConnected = false;

    $("*").addClass("video-stream");

    Idle.watch();
    $scope.showControlBar = true;

    $scope.sessionText = "Waiting for subscriber";
    $scope.disconnected = false;
    $scope.disconnectedUser = false;
    $scope.disconnectedRejoin = false;

    $scope.$on('IdleStart', function () {
      if(isConnected){
        $scope.showControlBar = false;
        $scope.$apply();
      }
    });

    $scope.$on('IdleEnd', function () {
      if(isConnected) {
        $scope.showControlBar = true;
        $scope.$apply();
      }
    });

    $scope.callEnd = false;
    $scope.callStart = true;

    $scope.videoFront = true;
    $scope.voiceOn = true;
    $scope.videoOn = true;

    $scope.connectVideoChat = function () {
      $scope.disconnected = false;
      $scope.disconnectedUser = false;
      $scope.disconnectedRejoin = false;
      $scope.showControlBar = true;
      $scope.sessionText = "Waiting for subscriber";
      $("#establishConnectionLoad").show();
      console.log("Connect clicked.");
      $scope.callEnd = false;
      $scope.callStart = true;
      isConnected = true;
      $("#div_me").append("<div id='div_me_feed'></div>");
      console.log("Initializing publisher.");
      publisher = TB.initPublisher(apiKey, 'div_me_feed', {height: $("#div_me").height(), width: $("#div_me").width()});
      console.log("Initializing session.");

      session = TB.initSession(apiKey, sessionId);
      session.on({
        'streamCreated': function (event) {
          console.log("New stream created, subscribing.");
          console.log(event);
          $scope.signalReciever = event.stream.connection;
          divId = 'stream' + event.stream.streamId;
          var div = $('<div>').attr('id', divId);
          $("#div_others").append(div);
          subscriber = session.subscribe(event.stream, divId, {
            height: $("#div_others").height(),
            width: $("#div_others").width(),
            subscribeToAudio: true
          });
          console.log("Subscribed to stream.");
          $scope.disconnected = false;
          $scope.disconnectedUser = false;
          $scope.disconnectedRejoin = false;
          $("#establishConnectionText").hide();
          $("#establishConnectionLoad").hide();
        }
      });

      session.on({
        'streamDestroyed': function(event){

          if(subscriber!=null){
            try {
              session.unsubscribe(subscriber);
            }
            catch (err) {
              console.error("Call session unsubscribe failed: " + err.message);
            }
          }
          subscriber = null;
          session.disconnect();

          $scope.sessionText = "Thank you for using smuaq's OpenTok sample.";
          $("#establishConnectionText").show();
          $("#establishConnectionLoad").hide();
          $scope.disconnected = true;
          $scope.disconnectedRejoin = true;
          $scope.disconnectedUser = false;
          isConnected = false;
          $scope.showControlBar = false;

          $scope.videoFront = true;
          $scope.voiceOn = true;
          $scope.videoOn = true;

          $scope.$apply();

          console.log("Stream Destroyed");
          console.log(event);

        }
      });

      session.on({
        'signalReceived':function(event){
          console.log("Signal Event:",event);
        }
      });

      session.on({
        'sessionDisconnected': function(event){
          console.log(event);
        }
      });

      console.log("Connecting to session.");
      session.connect(token, function () {
        console.log("Session connected, publishing my stream.");
        session.publish(publisher);
      });
    };

    if(!!window.cordova){
      $scope.connectVideoChat();
    }


    $scope.disconnectVideoChat = function () {
      if(subscriber!=null){
        try {
          session.unsubscribe(subscriber);
        }
        catch (err) {
          console.error("Call session unsubscribe failed: " + err.message);
        }
      }
      subscriber = null;

      if(publisher!=null){
        try {
          session.unpublish(publisher);
        }
        catch (err) {
          console.error("Call session unpublish failed: " + err.message);
        }
      }
      publisher = null;
      session.disconnect();
      session = null;

      $scope.sessionText = "Thank you for smuaq's Opentok smaple";
      $("#establishConnectionText").show();
      $("#establishConnectionLoad").hide();
      $scope.disconnected = false;
      $scope.disconnectedRejoin = true;
      $scope.disconnectedUser = true;
      isConnected = false;
      $scope.showControlBar = false;


      $scope.videoFront = true;
      $scope.voiceOn = true;
      $scope.videoOn = true;
    };

    $scope.toggleCamera = function () {
      if (isConnected) {
        if ($scope.videoFront) {
          publisher.setCameraPosition("back");
          $scope.videoFront = false;
        }
        else {
          publisher.setCameraPosition("front");
          $scope.videoFront = true;
        }
      }
    };

    $scope.streamAudio = function () {
      if (isConnected) {
        if ($scope.voiceOn) {
          publisher.publishMedia("publishAudio", "false");
          $scope.voiceOn = false;
        }
        else {
          publisher.publishMedia("publishAudio", "true");
          $scope.voiceOn = true;
        }
      }
    };

    $scope.streamVideo = function () {
      if (isConnected) {
        if ($scope.videoOn) {
          publisher.publishMedia("publishVideo", "false");
          $("#div_me").height(0);
          $("#div_me").width(0);
          $scope.videoOn = false;
        }
        else {
          publisher.publishMedia("publishVideo", "true");
          $("#div_me").height(115);
          $("#div_me").width(100);
          $scope.videoOn = true;
        }
        $timeout(function () {
          TB.updateViews();
        }, 500)
      }
    }

    $scope.showConfirm_Back = function () {
      if (!!window.cordova) {
        $cordovaDialogs.confirm('Are you sure you want to quit this session?', 'Quit Session', ['Cancel', 'OK'])
          .then(function (buttonIndex) {
            if (buttonIndex == 2) {
              $scope.disconnectVideo_Back();
            }
          });
      }
      else{
        var confirmPopup = $ionicPopup.confirm({
          title: 'Quit Session',
          template: 'Are you sure you want to quit this session?'
        });
        confirmPopup.then(function (res) {
          if (res) {
            $scope.disconnectVideo_Back();
          }
        });
      }
    };

    $scope.disconnectVideo_Back = function () {
      if(!!window.cordova) {
        $ionicPlatform.ready(function () {
          screen.lockOrientation('portrait-primary');
          $cordovaInsomnia.allowSleepAgain();
        });
      }
      $timeout(function(){
        if (isConnected) {
          $("*").removeClass("video-stream");
          $scope.disconnectVideoChat();
        }
        $state.go("dash")
      },500);
    };

    $scope.showConfirm_Disconnect = function () {
      if (isConnected) {
        if(!!window.cordova){
          $cordovaDialogs.confirm('Are you sure you want to disconnect this session?', 'Disconnect Session', ['Cancel','OK'])
            .then(function(buttonIndex) {
              if(buttonIndex==2){
                $scope.disconnectVideoChat();
              }
            });

        }
        else {
          var confirmPopup = $ionicPopup.confirm({
            title: 'Disconnect Session',
            template: 'Are you sure you want to disconnect this session?'
          });
          confirmPopup.then(function (res) {
            if (res) {
              $scope.disconnectVideoChat();
            }
          });
        }
      }
    };

  });
