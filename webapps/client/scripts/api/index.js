'use strict';
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['angular', 'camunda-bpm-sdk', 'camunda-bpm-sdk-mock'],
function(angular,   CamSDK,            MockClient) {
  var apiModule = angular.module('cam.tasklist.client', []);

  apiModule.value('HttpClient', CamSDK);

  apiModule.value('MockHttpClient', MockClient);

  apiModule.factory('camAPIHttpClient', [
          'MockHttpClient', '$rootScope',
  function(MockHttpClient,   $rootScope) {

    function AngularClient(config) {
      var Client = (config.mock === true ? MockHttpClient : CamSDK.HttpClient);
      this._wrapped = new Client(config);
    }

    angular.forEach(['post', 'get', 'put', 'del'], function(name) {
      AngularClient.prototype[name] = function(path, options) {
        if (!options.done) {
          return;
        }

        var original = options.done;

        options.done = function(err, result) {
          $rootScope.$apply(function() {
            original(err, result);
          });
        };

        this._wrapped[name](path, options);
      };
    });

    angular.forEach(['on', 'once', 'off', 'trigger'], function(name) {
      AngularClient.prototype[name] = function() {
        this._wrapped[name].apply(this, arguments);
      };
    });

    return AngularClient;
  }]);


  apiModule.factory('camAPI', [
          'camAPIHttpClient',
  function(camAPIHttpClient) {
    var conf = {
      apiUri:     'engine-rest/engine',
      HttpClient: camAPIHttpClient
    };

    if (window.tasklistConf) {
      for (var c in window.tasklistConf) {
        conf[c] = window.tasklistConf[c];
      }
    }

    return new CamSDK(conf);
  }]);


  return apiModule;
});
