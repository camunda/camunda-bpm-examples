(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CamSDK = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
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
'use strict'; // exposify: CamSDK.Form

var CamundaForm = require('./../../forms/camunda-form');

var angular = typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null;
var $ = CamundaForm.$;

var constants = require('./../../forms/constants');

var CamundaFormAngular = CamundaForm.extend({
  renderForm: function renderForm() {
    var self = this;
    this.formElement = angular.element(this.formElement); // first add the form to the DOM:

    CamundaForm.prototype.renderForm.apply(this, arguments); // next perform auto-scope binding for all fields which do not have custom bindings

    function autoBind(key, el) {
      var element = $(el);

      if (!element.attr('ng-model')) {
        var camVarName = element.attr(constants.DIRECTIVE_CAM_VARIABLE_NAME);

        if (camVarName) {
          element.attr('ng-model', camVarName);
        }
      }
    }

    for (var i = 0; i < this.formFieldHandlers.length; i++) {
      var handler = this.formFieldHandlers[i];
      var selector = handler.selector;
      $(selector, self.formElement).each(autoBind);
    }

    this.formElement = angular.element(this.formElement); // finally compile the form with angular and linked to the current scope

    var injector = self.formElement.injector();

    if (!injector) {
      return;
    }

    var scope = self.formElement.scope();
    injector.invoke(['$compile', function ($compile) {
      $compile(self.formElement)(scope);
    }]);
    scope.camForm = this;
  },
  executeFormScript: function executeFormScript(script) {
    // overrides executeFormScript to make sure the following variables / functions are available to script implementations:
    // * $scope
    // * inject
    this.formElement = angular.element(this.formElement);

    var moment = require('moment');

    var injector = this.formElement.injector();
    var scope = this.formElement.scope();
    /*eslint-disable */

    (function (camForm, $scope, moment) {
      // hook to create the service with injection
      var inject = function inject(extensions) {
        // if result is an array or function we expect
        // an injectable service
        if (angular.isFunction(extensions) || angular.isArray(extensions)) {
          injector.instantiate(extensions, {
            $scope: scope
          });
        } else {
          throw new Error('Must call inject(array|fn)');
        }
      };
      /* jshint evil: true */


      eval(script);
      /* jshint evil: false */
    })(this, scope, moment);
    /*eslint-enable */

  },
  fireEvent: function fireEvent() {
    // overrides fireEvent to make sure event listener is invoked in an apply phase
    this.formElement = angular.element(this.formElement);
    var self = this;
    var args = arguments;
    var scope = this.formElement.scope();

    var doFireEvent = function doFireEvent() {
      CamundaForm.prototype.fireEvent.apply(self, args);
    };

    var injector = self.formElement.injector();

    if (!injector) {
      return;
    }

    injector.invoke(['$rootScope', function ($rootScope) {
      var phase = $rootScope.$$phase; // only apply if not already in digest / apply

      if (phase !== '$apply' && phase !== '$digest') {
        scope.$apply(function () {
          doFireEvent();
        });
      } else {
        doFireEvent();
      }
    }]);
  }
});
module.exports = CamundaFormAngular;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./../../forms/camunda-form":39,"./../../forms/constants":40,"moment":52}],2:[function(require,module,exports){
(function (global){
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
'use strict';

var angular = typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null,
    CamundaFormAngular = require('./camunda-form-angular'),
    isType = require('./../../forms/type-util').isType; // define embedded forms angular module


var ngModule = angular.module('cam.embedded.forms', []);
/**
 * Exposes 'cam-variable-name' as angular directive making sure
 * that updates to a HTML Control made through the camunda form
 * infrastructure are propagated over ngModel bindings.
 */

ngModule.directive('camVariableName', ['$rootScope', function ($rootScope) {
  return {
    require: 'ngModel',
    link: function link(scope, elm, attrs, ctrl) {
      elm.on('camFormVariableApplied', function (evt, value) {
        var phase = $rootScope.$$phase; // only apply if not already in digest / apply

        if (phase !== '$apply' && phase !== '$digest') {
          scope.$apply(function () {
            ctrl.$setViewValue(value);
          });
        } else {
          ctrl.$setViewValue(value);
        }
      });
    }
  };
}]);
ngModule.directive('camVariableType', [function () {
  return {
    require: 'ngModel',
    link: function link($scope, $element, $attrs, ctrl) {
      var validate = function validate(viewValue) {
        var type = $attrs.camVariableType;
        ctrl.$setValidity('camVariableType', true);

        if (viewValue || viewValue === false || type === 'Bytes') {
          if (ctrl.$pristine) {
            ctrl.$pristine = false;
            ctrl.$dirty = true;
            $element.addClass('ng-dirty');
            $element.removeClass('ng-pristine');
          }

          if (['Boolean', 'String', 'Bytes'].indexOf(type) === -1 && !isType(viewValue, type)) {
            ctrl.$setValidity('camVariableType', false);
          }

          if ($attrs.type === 'file' && type === 'Bytes' && $element[0].files && $element[0].files[0] && $element[0].files[0].size > ($attrs.camMaxFilesize || 5000000)) {
            ctrl.$setValidity('camVariableType', false);
          }
        }

        return viewValue;
      };

      ctrl.$parsers.unshift(validate);
      ctrl.$formatters.push(validate);
      $attrs.$observe('camVariableType', function () {
        return validate(ctrl.$viewValue);
      });
      $element.bind('change', function () {
        validate(ctrl.$viewValue);
        $scope.$apply();
      });
    }
  };
}]);
module.exports = CamundaFormAngular;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./../../forms/type-util":48,"./camunda-form-angular":1}],3:[function(require,module,exports){
"use strict";

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

/** @namespace CamSDK */
module.exports = {
  Client: require('./../api-client'),
  Form: require('./forms'),
  utils: require('./../utils')
};

},{"./../api-client":7,"./../utils":50,"./forms":2}],4:[function(require,module,exports){
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
'use strict'; // var HttpClient = require('./http-client');

var Q = require('q');

var Events = require('./../events');

var BaseClass = require('./../base-class');
/**
 * No-Op callback
 */


function noop() {}
/**
 * Abstract class for resources
 *
 * @class
 * @augments {CamSDK.BaseClass}
 * @memberof CamSDK.client
 *
 * @borrows CamSDK.Events.on                        as on
 * @borrows CamSDK.Events.once                      as once
 * @borrows CamSDK.Events.off                       as off
 * @borrows CamSDK.Events.trigger                   as trigger
 *
 * @borrows CamSDK.Events.on                        as prototype.on
 * @borrows CamSDK.Events.once                      as prototype.once
 * @borrows CamSDK.Events.off                       as prototype.off
 * @borrows CamSDK.Events.trigger                   as prototype.trigger
 *
 *
 * @example
 *
 * // create a resource Model
 * var Model = AbstractClientResource.extend({
 *   apiUri: 'path-to-the-endpoint'
 *   doSomethingOnInstance: function() {
 *     //
 *   }
 * }, {
 *   somethingStatic: {}
 * });
 *
 * // use the generated Model statically
 * // with events
 * Model.on('eventname', function(results) {
 *   // You probably have something like
 *   var total = results.count;
 *   var instances = results.items;
 * });
 * Model.list({ nameLike: '%call%' });
 *
 * // or alternatively by using a callback
 * Model.list({ nameLike: '%call%' }, function(err, results) {
 *   if (err) {
 *     throw err;
 *   }
 *
 *   var total = results.count;
 *   var instances = results.items;
 * });
 *
 * var instance = new Model();
 * instance.claim(function(err, result) {
 *
 * });
 */


var AbstractClientResource = BaseClass.extend(
/** @lends AbstractClientResource.prototype */
{
  /**
   * Initializes a AbstractClientResource instance
   *
   * This method is aimed to be overriden by other implementations
   * of the AbstractClientResource.
   *
   * @method initialize
   */
  initialize: function initialize() {
    // do something to initialize the instance
    // like copying the Model http property to the "this" (instanciated)
    this.http = this.constructor.http;
  }
},
/** @lends AbstractClientResource */
{
  /**
   * Path used by the resource to perform HTTP queries
   *
   * @abstract
   * @memberOf CamSDK.client.AbstractClientResource
   */
  path: '',

  /**
   * Object hosting the methods for HTTP queries.
   *
   * @abstract
   * @memberof CamSDK.client.AbstractClientResource
   */
  http: {},

  /**
   * Create an instance on the backend
   *
   * @abstract
   * @memberOf CamSDK.client.AbstractClientResource
   *
   * @param  {!Object|Object[]}  attributes
   * @param  {requestCallback} [done]
   */
  create: function create() {},

  /**
   * Fetch a list of instances
   *
   * @memberof CamSDK.client.AbstractClientResource
   *
   * @fires CamSDK.AbstractClientResource#error
   * @fires CamSDK.AbstractClientResource#loaded
   *
   * @param  {?Object.<String, String>} params
   * @param  {requestCallback} [done]
   */
  list: function list(params, _done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      _done = params;
      params = {};
    }

    params = params || {};
    _done = _done || noop; // var likeExp = /Like$/;

    var self = this;
    var results = {
      count: 0,
      items: []
    };
    var combinedPromise = Q.defer();
    var countFinished = false;
    var listFinished = false;

    var checkCompletion = function checkCompletion() {
      if (listFinished && countFinished) {
        self.trigger('loaded', results);
        combinedPromise.resolve(results);

        _done(null, results);
      }
    }; // until a new webservice is made available,
    // we need to perform 2 requests.
    // Since they are independent requests, make them asynchronously


    self.count(params, function (err, count) {
      if (err) {
        self.trigger('error', err);
        combinedPromise.reject(err);

        _done(err);
      } else {
        results.count = count;
        countFinished = true;
        checkCompletion();
      }
    });
    self.http.get(self.path, {
      data: params,
      done: function done(err, itemsRes) {
        if (err) {
          self.trigger('error', err);
          combinedPromise.reject(err);

          _done(err);
        } else {
          results.items = itemsRes; // QUESTION: should we return that too?

          results.firstResult = parseInt(params.firstResult || 0, 10);
          results.maxResults = results.firstResult + parseInt(params.maxResults || 10, 10);
          listFinished = true;
          checkCompletion();
        }
      }
    });
    return combinedPromise.promise;
  },

  /**
   * Fetch a count of instances
   *
   * @memberof CamSDK.client.AbstractClientResource
   *
   * @fires CamSDK.AbstractClientResource#error
   * @fires CamSDK.AbstractClientResource#loaded
   *
   * @param  {?Object.<String, String>} params
   * @param  {requestCallback} [done]
   */
  count: function count(params, _done2) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      _done2 = params;
      params = {};
    }

    params = params || {};
    _done2 = _done2 || noop;
    var self = this;
    var deferred = Q.defer();
    this.http.get(this.path + '/count', {
      data: params,
      done: function done(err, result) {
        if (err) {
          /**
           * @event CamSDK.AbstractClientResource#error
           * @type {Error}
           */
          self.trigger('error', err);
          deferred.reject(err);

          _done2(err);
        } else {
          deferred.resolve(result.count);

          _done2(null, result.count);
        }
      }
    });
    return deferred.promise;
  },

  /**
   * Update one or more instances
   *
   * @abstract
   * @memberof CamSDK.AbstractClientResource
   *
   * @param  {!String|String[]}     ids
   * @param  {Object.<String, *>}   attributes
   * @param  {requestCallback} [done]
   */
  update: function update() {},

  /**
   * Delete one or more instances
   *
   * @abstract
   * @memberof CamSDK.AbstractClientResource
   *
   * @param  {!String|String[]}  ids
   * @param  {requestCallback} [done]
   */
  "delete": function _delete() {}
});
Events.attach(AbstractClientResource);
module.exports = AbstractClientResource;

},{"./../base-class":37,"./../events":38,"q":53}],5:[function(require,module,exports){
"use strict";

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
exports.createSimpleGetQueryFunction = function (urlSuffix) {
  return function (params, done) {
    var url = this.path + urlSuffix;

    if (typeof params === 'function') {
      done = params;
      params = {};
    }

    return this.http.get(url, {
      data: params,
      done: done
    });
  };
};

},{}],6:[function(require,module,exports){
(function (Buffer){
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
'use strict';

var request = require('superagent');

var Q = require('q');

var Events = require('./../events');

var utils = require('./../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * HttpClient
 *
 * A HTTP request abstraction layer to be used in node.js / browsers environments.
 *
 * @class
 * @memberof CamSDK.client
 */


var HttpClient = function HttpClient(config) {
  config = config || {};
  config.headers = config.headers || {};

  if (!config.headers.Accept) {
    config.headers.Accept = 'application/hal+json, application/json; q=0.5';
  }

  if (!config.baseUrl) {
    throw new Error('HttpClient needs a `baseUrl` configuration property.');
  }

  Events.attach(this);
  this.config = config;
};

function end(self, done, deferred) {
  done = done || noop;
  return function (err, response) {
    // TODO: investigate the possible problems related to response without content
    if (err || !response.ok && !response.noContent) {
      err = err || response.error || new Error('The ' + response.req.method + ' request on ' + response.req.url + ' failed');

      if (response && response.body) {
        if (response.body.message) {
          err.message = response.body.message;
        }
      }

      self.trigger('error', err);

      if (deferred) {
        deferred.reject(err);
      }

      return done(err);
    } // superagent puts the parsed data into a property named "body"
    // and the "raw" content in property named "text"
    // and.. it does not parse the response if it does not have
    // the "application/json" type.


    if (response.type === 'application/hal+json') {
      if (!response.body || Object.keys(response.body).length === 0) {
        response.body = JSON.parse(response.text);
      } // and process embedded resources


      response.body = utils.solveHALEmbedded(response.body);
    }

    if (deferred) {
      deferred.resolve(response.body ? response.body : response.text ? response.text : '');
    }

    done(null, response.body ? response.body : response.text ? response.text : '');
  };
}
/**
 * Performs a POST HTTP request
 */


HttpClient.prototype.post = function (path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/' + path : '');
  var req = request.post(url);
  var headers = options.headers || this.config.headers;
  headers.Accept = headers.Accept || this.config.headers.Accept;
  var isFieldOrAttach = false; // Buffer object is only available in node.js environement

  if (typeof Buffer !== 'undefined') {
    Object.keys(options.fields || {}).forEach(function (field) {
      req.field(field, options.fields[field]);
      isFieldOrAttach = true;
    });
    (options.attachments || []).forEach(function (file, idx) {
      req.attach('data_' + idx, new Buffer(file.content), file.name);
      isFieldOrAttach = true;
    });
  } else if (!!options.fields || !!options.attachments) {
    var err = new Error('Multipart request is only supported in node.js environement.');
    done(err);
    return deferred.reject(err);
  }

  if (!isFieldOrAttach) {
    req.send(options.data || {});
  }

  req.set(headers).query(options.query || {});
  req.end(end(self, done, deferred));
  return deferred.promise;
};
/**
 * Performs a GET HTTP request
 */


HttpClient.prototype.get = function (path, options) {
  var url = this.config.baseUrl + (path ? '/' + path : '');
  return this.load(url, options);
};
/**
 * Loads a resource using http GET
 */


HttpClient.prototype.load = function (url, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var headers = options.headers || this.config.headers;
  var accept = options.accept || headers.Accept || this.config.headers.Accept;
  var req = request.get(url).set(headers).set('Accept', accept).query(options.data || {});
  req.end(end(self, done, deferred));
  return deferred.promise;
};
/**
 * Performs a PUT HTTP request
 */


HttpClient.prototype.put = function (path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/' + path : '');
  var headers = options.headers || this.config.headers;
  headers.Accept = headers.Accept || this.config.headers.Accept;
  var req = request.put(url).set(headers).send(options.data || {});
  req.end(end(self, done, deferred));
  return deferred.promise;
};
/**
 * Performs a DELETE HTTP request
 */


HttpClient.prototype.del = function (path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/' + path : '');
  var headers = options.headers || this.config.headers;
  headers.Accept = headers.Accept || this.config.headers.Accept;
  var req = request.del(url).set(headers).send(options.data || {});
  req.end(end(self, done, deferred));
  return deferred.promise;
};
/**
 * Performs a OPTIONS HTTP request
 */


HttpClient.prototype.options = function (path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/' + path : '');
  var headers = options.headers || this.config.headers;
  headers.Accept = headers.Accept || this.config.headers.Accept;
  var req = request('OPTIONS', url).set(headers);
  req.end(end(self, done, deferred));
  return deferred.promise;
};

module.exports = HttpClient;

}).call(this,require("buffer").Buffer)
},{"./../events":38,"./../utils":50,"buffer":61,"q":53,"superagent":55}],7:[function(require,module,exports){
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
'use strict';

var Events = require('./../events');
/**
 * For all API client related
 * @namespace CamSDK.client
 */

/**
 * For the resources implementations
 * @namespace CamSDK.client.resource
 */

/**
 * Entry point of the module
 *
 * @class CamundaClient
 * @memberof CamSDK.client
 *
 * @param  {Object} config                  used to provide necessary configuration
 * @param  {String} [config.engine=default] false to define absolute apiUri
 * @param  {String} config.apiUri
 * @param  {String} [config.headers]        Headers that should be used for all Http requests.
 */


function CamundaClient(config) {
  if (!config) {
    throw new Error('Needs configuration');
  }

  if (!config.apiUri) {
    throw new Error('An apiUri is required');
  }

  Events.attach(this); // use 'default' engine

  config.engine = typeof config.engine !== 'undefined' ? config.engine : 'default'; // mock by default.. for now

  config.mock = typeof config.mock !== 'undefined' ? config.mock : true;
  config.resources = config.resources || {};
  this.HttpClient = config.HttpClient || CamundaClient.HttpClient;
  this.baseUrl = config.apiUri;

  if (config.engine) {
    this.baseUrl += this.baseUrl.slice(-1) !== '/' ? '/' : '';
    this.baseUrl += 'engine/' + config.engine;
  }

  this.config = config;
  this.initialize();
}
/**
 * [HttpClient description]
 * @memberof CamSDK.client.CamundaClient
 * @name HttpClient
 * @type {CamSDK.client.HttpClient}
 */


CamundaClient.HttpClient = require('./http-client'); // provide an isolated scope

(function (proto) {
  /**
   * configuration storage
   * @memberof CamSDK.client.CamundaClient.prototype
   * @name  config
   * @type {Object}
   */
  proto.config = {};
  var _resources = {};
  /**
   * @memberof CamSDK.client.CamundaClient.prototype
   * @name initialize
   */

  proto.initialize = function () {
    /* jshint sub: true */
    _resources['authorization'] = require('./resources/authorization');
    _resources['batch'] = require('./resources/batch');
    _resources['deployment'] = require('./resources/deployment');
    _resources['external-task'] = require('./resources/external-task');
    _resources['filter'] = require('./resources/filter');
    _resources['history'] = require('./resources/history');
    _resources['process-definition'] = require('./resources/process-definition');
    _resources['process-instance'] = require('./resources/process-instance');
    _resources['task'] = require('./resources/task');
    _resources['task-report'] = require('./resources/task-report');
    _resources['telemetry'] = require('./resources/telemetry');
    _resources['variable'] = require('./resources/variable');
    _resources['case-execution'] = require('./resources/case-execution');
    _resources['case-instance'] = require('./resources/case-instance');
    _resources['case-definition'] = require('./resources/case-definition');
    _resources['user'] = require('./resources/user');
    _resources['group'] = require('./resources/group');
    _resources['tenant'] = require('./resources/tenant');
    _resources['incident'] = require('./resources/incident');
    _resources['job-definition'] = require('./resources/job-definition');
    _resources['job'] = require('./resources/job');
    _resources['metrics'] = require('./resources/metrics');
    _resources['decision-definition'] = require('./resources/decision-definition');
    _resources['execution'] = require('./resources/execution');
    _resources['migration'] = require('./resources/migration');
    _resources['drd'] = require('./resources/drd');
    _resources['modification'] = require('./resources/modification');
    _resources['message'] = require('./resources/message');
    _resources['password-policy'] = require('./resources/password-policy');
    /* jshint sub: false */

    var self = this;

    function forwardError(err) {
      self.trigger('error', err);
    } // create global HttpClient instance


    this.http = new this.HttpClient({
      baseUrl: this.baseUrl,
      headers: this.config.headers
    }); // configure the client for each resources separately,

    var name, conf, resConf, c;

    for (name in _resources) {
      conf = {
        name: name,
        // use the SDK config for some default values
        mock: this.config.mock,
        baseUrl: this.baseUrl,
        headers: this.config.headers
      };
      resConf = this.config.resources[name] || {};

      for (c in resConf) {
        conf[c] = resConf[c];
      } // instanciate a HTTP client for the resource


      _resources[name].http = new this.HttpClient(conf); // forward request errors

      _resources[name].http.on('error', forwardError);
    }
  };
  /**
   * Allows to get a resource from SDK by its name
   * @memberof CamSDK.client.CamundaClient.prototype
   * @name resource
   *
   * @param  {String} name
   * @return {CamSDK.client.AbstractClientResource}
   */


  proto.resource = function (name) {
    return _resources[name];
  };
})(CamundaClient.prototype);

module.exports = CamundaClient;
/**
 * A [universally unique identifier]{@link en.wikipedia.org/wiki/Universally_unique_identifier}
 * @typedef {String} uuid
 */

/**
 * This callback is displayed as part of the Requester class.
 * @callback requestCallback
 * @param {?Object} error
 * @param {CamSDK.AbstractClientResource|CamSDK.AbstractClientResource[]} [results]
 */

/**
 * Function who does not perform anything
 * @callback noopCallback
 */

},{"./../events":38,"./http-client":6,"./resources/authorization":8,"./resources/batch":9,"./resources/case-definition":10,"./resources/case-execution":11,"./resources/case-instance":12,"./resources/decision-definition":13,"./resources/deployment":14,"./resources/drd":15,"./resources/execution":16,"./resources/external-task":17,"./resources/filter":18,"./resources/group":19,"./resources/history":20,"./resources/incident":21,"./resources/job":23,"./resources/job-definition":22,"./resources/message":24,"./resources/metrics":25,"./resources/migration":26,"./resources/modification":27,"./resources/password-policy":28,"./resources/process-definition":29,"./resources/process-instance":30,"./resources/task":32,"./resources/task-report":31,"./resources/telemetry":33,"./resources/tenant":34,"./resources/user":35,"./resources/variable":36}],8:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Authorization Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Authorization = AbstractClientResource.extend();
/**
 * API path for the process definition resource
 * @type {String}
 */

Authorization.path = 'authorization';
/**
 * Fetch a list of authorizations
 *
 * @param {Object} params
 * @param {Object} [params.id]            Authorization by the id of the authorization.
 * @param {Object} [params.type]          Authorization by the type of the authorization.
 * @param {Object} [params.userIdIn]      Authorization by a comma-separated list of userIds
 * @param {Object} [params.groupIdIn]     Authorization by a comma-separated list of groupIds
 * @param {Object} [params.resourceType]  Authorization by resource type
 * @param {Object} [params.resourceId]    Authorization by resource id.
 * @param {Object} [params.sortBy]        Sort the results lexicographically by a given criterion.
 *                                        Valid values are resourceType and resourceId.
 *                                        Must be used with the sortOrder parameter.
 * @param {Object} [params.sortOrder]     Sort the results in a given order.
 *                                        Values may be "asc" or "desc".
 *                                        Must be used in conjunction with the sortBy parameter.
 * @param {Object} [params.firstResult]   Pagination of results.
 *                                        Specifies the index of the first result to return.
 * @param {Object} [params.maxResults]    Pagination of results.
 *                                        Specifies the maximum number of results to return.
 * @param {Function} done
 */

Authorization.list = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};
/**
 * Retrieve a single authorization
 *
 * @param  {uuid}     authorizationId     of the authorization to be requested
 * @param  {Function} done
 */


Authorization.get = function (authorizationId, done) {
  return this.http.get(this.path + '/' + authorizationId, {
    done: done
  });
};
/**
 * Creates an authorization
 *
 * @param  {Object}   authorization       is an object representation of an authorization
 * @param  {Function} done
 */


Authorization.create = function (authorization, done) {
  return this.http.post(this.path + '/create', {
    data: authorization,
    done: done
  });
};
/**
 * Update an authorization
 *
 * @param  {Object}   authorization       is an object representation of an authorization
 * @param  {Function} done
 */


Authorization.update = function (authorization, done) {
  return this.http.put(this.path + '/' + authorization.id, {
    data: authorization,
    done: done
  });
};
/**
 * Save an authorization
 *
 * @see Authorization.create
 * @see Authorization.update
 *
 * @param  {Object}   authorization   is an object representation of an authorization,
 *                                    if it has an id property, the authorization will be updated,
 *                                    otherwise created
 * @param  {Function} done
 */


Authorization.save = function (authorization, done) {
  return Authorization[authorization.id ? 'update' : 'create'](authorization, done);
};
/**
 * Delete an authorization
 *
 * @param  {uuid}     id   of the authorization to delete
 * @param  {Function} done
 */


Authorization["delete"] = function (id, done) {
  return this.http.del(this.path + '/' + id, {
    done: done
  });
};

Authorization.check = function (authorization, done) {
  return this.http.get(this.path + '/check', {
    data: authorization,
    done: done
  });
};

module.exports = Authorization;

},{"./../abstract-client-resource":4}],9:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Batch Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Batch = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Batch.path = 'batch';
/**
 * Retrieves a single batch according to the Batch interface in the engine.
 */

Batch.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};

Batch.suspended = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/suspended', {
    data: {
      suspended: !!params.suspended
    },
    done: done
  });
};

Batch.statistics = function (params, done) {
  return this.http.get(this.path + '/statistics/', {
    data: params,
    done: done
  });
};

Batch.statisticsCount = function (params, done) {
  return this.http.get(this.path + '/statistics/count', {
    data: params,
    done: done
  });
};

Batch["delete"] = function (params, done) {
  var path = this.path + '/' + params.id;

  if (params.cascade) {
    path += '?cascade=true';
  }

  return this.http.del(path, {
    done: done
  });
};

module.exports = Batch;

},{"./../abstract-client-resource":4}],10:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * No-Op callback
 */


function noop() {}
/**
 * CaseDefinition Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var CaseDefinition = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

CaseDefinition.path = 'case-definition';
/**
 * Retrieve a single case definition
 *
 * @param  {uuid}     id    of the case definition to be requested
 * @param  {Function} done
 */

CaseDefinition.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};
/**
 * Retrieve a single cace definition
 *
 * @param  {String}   key    of the case definition to be requested
 * @param  {Function} done
 */


CaseDefinition.getByKey = function (key, done) {
  return this.http.get(this.path + '/key/' + key, {
    done: done
  });
};

CaseDefinition.list = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};
/**
 * Instantiates a given case definition.
 *
 * @param {Object} [params]
 * @param {String} [params.id]              The id of the case definition to be instantiated. Must be omitted if key is provided.
 * @param {String} [params.key]             The key of the case definition (the latest version thereof) to be instantiated. Must be omitted if id is provided.
 * @param {String} [params.variables]       A JSON object containing the variables the case is to be initialized with. Each key corresponds to a variable name and each value to a variable value.
 * @param {String} [params.businessKey]     The business key the case instance is to be initialized with. The business key identifies the case instance in the context of the given case definition.
 */


CaseDefinition.create = function (params, done) {
  var url = this.path + '/';

  if (params.id) {
    url = url + params.id;
  } else {
    url = url + 'key/' + params.key;

    if (params.tenantId) {
      url = url + '/tenant-id/' + params.tenantId;
    }
  }

  return this.http.post(url + '/create', {
    data: params,
    done: done
  });
};
/**
 * Retrieves the CMMN XML of this case definition.
 * @param  {uuid}     id   The id of the case definition.
 * @param  {Function} done
 */


CaseDefinition.xml = function (data, done) {
  var path = this.path + '/' + (data.id ? data.id : 'key/' + data.key) + '/xml';
  return this.http.get(path, {
    done: done || noop
  });
};
/**
 * Instantiates a given process definition.
 *
 * @param {String} [id]                        The id of the process definition to activate or suspend.
 * @param {Object} [params]
 * @param {Number} [params.historyTimeToLive]  New value for historyTimeToLive field of process definition. Can be null.
 */


CaseDefinition.updateHistoryTimeToLive = function (id, params, done) {
  var url = this.path + '/' + id + '/history-time-to-live';
  return this.http.put(url, {
    data: params,
    done: done
  });
};

module.exports = CaseDefinition;

},{"./../abstract-client-resource":4}],11:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * CaseExecution Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var CaseExecution = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

CaseExecution.path = 'case-execution';

CaseExecution.list = function (params, done) {
  done = done || noop;
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

CaseExecution.disable = function (executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/disable', {
    data: params,
    done: done
  });
};

CaseExecution.reenable = function (executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/reenable', {
    data: params,
    done: done
  });
};

CaseExecution.manualStart = function (executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/manual-start', {
    data: params,
    done: done
  });
};

CaseExecution.complete = function (executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/complete', {
    data: params,
    done: done
  });
};
/**
 * Deletes a variable in the context of a given case execution. Deletion does not propagate upwards in the case execution hierarchy.
 */


CaseExecution.deleteVariable = function (data, done) {
  return this.http.del(this.path + '/' + data.id + '/localVariables/' + utils.escapeUrl(data.varId), {
    done: done
  });
};
/**
 * Updates or deletes the variables in the context of an execution.
 * The updates do not propagate upwards in the execution hierarchy.
 * Deletion precede updates.
 * So, if a variable is updated AND deleted, the updates overrides the deletion.
 */


CaseExecution.modifyVariables = function (data, done) {
  return this.http.post(this.path + '/' + data.id + '/localVariables', {
    data: data,
    done: done
  });
};

module.exports = CaseExecution;

},{"../../utils":50,"./../abstract-client-resource":4}],12:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * CaseInstance Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var CaseInstance = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

CaseInstance.path = 'case-instance';

CaseInstance.get = function (instanceId, done) {
  return this.http.get(this.path + '/' + instanceId, {
    done: done
  });
};

CaseInstance.list = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

CaseInstance.close = function (instanceId, params, done) {
  return this.http.post(this.path + '/' + instanceId + '/close', {
    data: params,
    done: done
  });
};

CaseInstance.terminate = function (instanceId, params, done) {
  return this.http.post(this.path + '/' + instanceId + '/terminate', {
    data: params,
    done: done
  });
};
/**
 * Sets a variable of a given case instance by id.
 *
 * @see http://docs.camunda.org/manual/develop/reference/rest/case-instance/variables/put-variable/
 *
 * @param   {uuid}              id
 * @param   {Object}            params
 * @param   {requestCallback}   done
 */


CaseInstance.setVariable = function (id, params, done) {
  var url = this.path + '/' + id + '/variables/' + utils.escapeUrl(params.name);
  return this.http.put(url, {
    data: params,
    done: done
  });
};

module.exports = CaseInstance;

},{"../../utils":50,"./../abstract-client-resource":4}],13:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * DecisionDefinition Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var DecisionDefinition = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

DecisionDefinition.path = 'decision-definition';
/**
 * Fetch a list of decision definitions
 * @param  {Object} params                        Query parameters as follow
 * @param  {String} [params.decisionDefinitionId] Filter by decision definition id.
 * @param  {String} [params.decisionDefinitionIdIn] Filter by decision definition ids.
 * @param  {String} [params.name]                 Filter by name.
 * @param  {String} [params.nameLike]             Filter by names that the parameter is a substring of.
 * @param  {String} [params.deploymentId]         Filter by the deployment the id belongs to.
 * @param  {String} [params.key]                  Filter by key, i.e. the id in the DMN 1.0 XML. Exact match.
 * @param  {String} [params.keyLike]              Filter by keys that the parameter is a substring of.
 * @param  {String} [params.category]             Filter by category. Exact match.
 * @param  {String} [params.categoryLike]         Filter by categories that the parameter is a substring of.
 * @param  {String} [params.version]              Filter by version.
 * @param  {String} [params.latestVersion]        Only include those decision definitions that are latest versions.
 *                                                Values may be "true" or "false".
 * @param  {String} [params.resourceName]         Filter by the name of the decision definition resource. Exact match.
 * @param  {String} [params.resourceNameLike]     Filter by names of those decision definition resources that the parameter is a substring of.
 *
 * @param  {String} [params.sortBy]               Sort the results lexicographically by a given criterion.
 *                                                Valid values are category, "key", "id", "name", "version" and "deploymentId".
 *                                                Must be used in conjunction with the "sortOrder" parameter.
 *
 * @param  {String} [params.sortOrder]            Sort the results in a given order.
 *                                                Values may be asc for ascending "order" or "desc" for descending order.
 *                                                Must be used in conjunction with the sortBy parameter.
 *
 * @param  {Integer} [params.firstResult]         Pagination of results. Specifies the index of the first result to return.
 * @param  {Integer} [params.maxResults]          Pagination of results. Specifies the maximum number of results to return.
 *                                                Will return less results, if there are no more results left.
 * @param {Function} done
 */

DecisionDefinition.list = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};
/**
 * Retrieves a single decision definition according to the DecisionDefinition interface in the engine.
 * @param  {uuid}     id   The id of the decision definition to be retrieved.
 * @param  {Function} done
 */


DecisionDefinition.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};
/**
 * Retrieves the DMN 1.0 XML of this decision definition.
 * @param  {uuid}     id   The id of the decision definition.
 * @param  {Function} done
 */


DecisionDefinition.getXml = function (id, done) {
  return this.http.get(this.path + '/' + id + '/xml', {
    done: done
  });
};
/**
 * Evaluates a given decision.
 *
 * @param {Object} [params]
 * @param {String} [params.id]              The id of the decision definition to be evaluated. Must be omitted if key is provided.
 * @param {String} [params.key]             The key of the decision definition (the latest version thereof) to be evaluated. Must be omitted if id is provided.
 * @param {String} [params.variables]       A JSON object containing the input variables of the decision. Each key corresponds to a variable name and each value to a variable value.
 */


DecisionDefinition.evaluate = function (params, done) {
  return this.http.post(this.path + '/' + (params.id ? params.id : 'key/' + params.key) + '/evaluate', {
    data: params,
    done: done
  });
};
/**
 * Instantiates a given process definition.
 *
 * @param {String} [id]                        The id of the process definition to activate or suspend.
 * @param {Object} [params]
 * @param {Number} [params.historyTimeToLive]  New value for historyTimeToLive field of process definition. Can be null.
 */


DecisionDefinition.updateHistoryTimeToLive = function (id, params, done) {
  var url = this.path + '/' + id + '/history-time-to-live';
  return this.http.put(url, {
    data: params,
    done: done
  });
};

module.exports = DecisionDefinition;

},{"./../abstract-client-resource":4}],14:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Deployment Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Deployment = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Deployment.path = 'deployment';
/**
 * Create a deployment
 * @param  {Object} options
 *
 * @param  {Array} options.files
 *
 * @param  {String} options.deploymentName
 * @param  {String} [options.deploymentSource]
 * @param  {String} [options.enableDuplicateFiltering]
 * @param  {String} [options.deployChangedOnly]
 * @param	 {String} [options.tenantId]
 * @param  {Function} done
 */

Deployment.create = function (options, done) {
  var fields = {
    'deployment-name': options.deploymentName
  };
  var files = Array.isArray(options.files) ? options.files : [options.files];

  if (options.deploymentSource) {
    fields['deployment-source'] = options.deploymentSource;
  }

  if (options.enableDuplicateFiltering) {
    fields['enable-duplicate-filtering'] = 'true';
  }

  if (options.deployChangedOnly) {
    fields['deploy-changed-only'] = 'true';
  }

  if (options.tenantId) {
    fields['tenant-id'] = options.tenantId;
  }

  return this.http.post(this.path + '/create', {
    data: {},
    fields: fields,
    attachments: files,
    done: done
  });
};
/**
 * Deletes a deployment
 *
 * @param  {String}  id
 *
 * @param  {Object}  options
 *
 * @param  {Boolean} [options.cascade]
 * @param  {Boolean} [options.skipCustomListeners]
 *
 * @param  {Function} done
 */


Deployment["delete"] = function (id, options, done) {
  var path = this.path + '/' + id;

  if (options) {
    var queryParams = [];

    for (var key in options) {
      var value = options[key];
      queryParams.push(key + '=' + value);
    }

    if (queryParams.length) {
      path += '?' + queryParams.join('&');
    }
  }

  return this.http.del(path, {
    done: done
  });
};
/**
 * Lists the deployments
 * @param  {Object}   params                An object containing listing options.
 * @param  {uuid}     [params.id]           Filter by deployment id.
 * @param  {String}   [params.name]         Filter by the deployment name. Exact match.
 * @param  {String}   [params.nameLike]     Filter by the deployment name that the parameter is a
 *                                          substring of. The parameter can include the wildcard %
 *                                          to express like-strategy such as: starts with (%name),
 *                                          ends with (name%) or contains (%name%).
 * @param  {String}   [params.after]        Restricts to all deployments after the given date.
 *                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss,
 *                                          e.g., 2013-01-23T14:42:45
 * @param  {String}   [params.before]       Restricts to all deployments before the given date.
 *                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss,
 *                                          e.g., 2013-01-23T14:42:45
 * @param  {String}   [params.sortBy]       Sort the results lexicographically by a given criterion.
 *                                          Valid values are id, name and deploymentTime. Must be
 *                                          used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]    Sort the results in a given order. Values may be asc for
 *                                          ascending order or desc for descending order. Must be
 *                                          used in conjunction with the sortBy parameter.
 * @param  {Integer}  [params.firstResult]  Pagination of results. Specifies the index of the first
 *                                          result to return.
 * @param  {Integer}  [params.maxResults]   Pagination of results. Specifies the maximum number of
 *                                          results to return. Will return less results if there are
 *                                          no more results left.
 * @param  {Function} done
 */


Deployment.list = function () {
  return AbstractClientResource.list.apply(this, arguments);
};
/**
 * Returns information about a deployment resources for the given deployment.
 */


Deployment.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};
/**
 * Returns a list of deployment resources for the given deployment.
 */


Deployment.getResources = function (id, done) {
  return this.http.get(this.path + '/' + id + '/resources', {
    done: done
  });
};
/**
 * Returns a deployment resource for the given deployment and resource id.
 */


Deployment.getResource = function (deploymentId, resourceId, done) {
  return this.http.get(this.path + '/' + deploymentId + '/resources/' + resourceId, {
    done: done
  });
};
/**
 * Returns the binary content of a single deployment resource for the given deployment.
 */


Deployment.getResourceData = function (deploymentId, resourceId, done) {
  return this.http.get(this.path + '/' + deploymentId + '/resources/' + resourceId + '/data', {
    accept: '*/*',
    done: done
  });
};
/**
 * Redeploy a deployment

 * @param  {Object} options
 * @param  {String} options.id
 * @param  {Array} [options.resourceIds]
 * @param  {Array} [options.resourceNames]
 * @param  {Function} done
 */


Deployment.redeploy = function (options, done) {
  var id = options.id;
  delete options.id;
  return this.http.post(this.path + '/' + id + '/redeploy', {
    data: options,
    done: done || function () {}
  });
};

module.exports = Deployment;

},{"./../abstract-client-resource":4}],15:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('../abstract-client-resource');

var utils = require('../../utils');
/**
 * DRD (Decision Requirements Definition) Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var DRD = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

DRD.path = 'decision-requirements-definition';
/**
 * Fetch a  count of DRD's
 * @param  {Object} params                          Query parameters as follow
 * @param  {String} [params.decisionDefinitionId]   Filter by decision definition id.
 * @param  {String} [params.decisionDefinitionIdIn] Filter by decision definition ids.
 * @param  {String} [params.name]                   Filter by name.
 * @param  {String} [params.nameLike]               Filter by names that the parameter is a substring of.
 * @param  {String} [params.deploymentId]           Filter by the deployment the id belongs to.
 * @param  {String} [params.key]                    Filter by key, i.e. the id in the DMN 1.0 XML. Exact match.
 * @param  {String} [params.keyLike]                Filter by keys that the parameter is a substring of.
 * @param  {String} [params.category]               Filter by category. Exact match.
 * @param  {String} [params.categoryLike]           Filter by categories that the parameter is a substring of.
 * @param  {String} [params.version]                Filter by version.
 * @param  {String} [params.latestVersion]          Only include those decision definitions that are latest versions.
 *                                                  Values may be "true" or "false".
 * @param  {String} [params.resourceName]           Filter by the name of the decision definition resource. Exact match.
 * @param  {String} [params.resourceNameLike]       Filter by names of those decision definition resources that the parameter is a substring of.
 *
 * @param  {String} [params.tenantIdInIdLn]         Filter by a comma-separated list of tenant ids. A decision requirements definition
 *                                                  must have one of the given tenant ids.
 *
 * @param  {Boolean} [params.withoutTenantId]       Only include decision requirements definitions which belongs to no tenant.
 *                                                  Value may only be true, as false is the default behavior.
 *
 * @param  {String} [params.includeDecisionRequirementsDefinitionsWithoutTenantId] Include decision requirements definitions which belongs to no tenant.
 *                                                  Can be used in combination with tenantIdIn. Value may only be true, as false is the default behavior.
 * @param {Function} done
 */

DRD.count = function (params, done) {
  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(this.path + '/count', {
    data: params,
    done: done
  });
};
/**
 * Fetch a list of decision definitions
 * @param  {Object} params                        Query parameters as follow
 * @param  {String} [params.decisionDefinitionId] Filter by decision definition id.
 * @param  {String} [params.decisionDefinitionIdIn] Filter by decision definition ids.
 * @param  {String} [params.name]                 Filter by name.
 * @param  {String} [params.nameLike]             Filter by names that the parameter is a substring of.
 * @param  {String} [params.deploymentId]         Filter by the deployment the id belongs to.
 * @param  {String} [params.key]                  Filter by key, i.e. the id in the DMN 1.0 XML. Exact match.
 * @param  {String} [params.keyLike]              Filter by keys that the parameter is a substring of.
 * @param  {String} [params.category]             Filter by category. Exact match.
 * @param  {String} [params.categoryLike]         Filter by categories that the parameter is a substring of.
 * @param  {String} [params.version]              Filter by version.
 * @param  {String} [params.latestVersion]        Only include those decision definitions that are latest versions.
 *                                                Values may be "true" or "false".
 * @param  {String} [params.resourceName]         Filter by the name of the decision definition resource. Exact match.
 * @param  {String} [params.resourceNameLike]     Filter by names of those decision definition resources that the parameter is a substring of.
 *
 * @param  {String} [params.tenantIdInIdLn]       Filter by a comma-separated list of tenant ids. A decision requirements definition
 *                                                must have one of the given tenant ids.
 *
 * @param  {Boolean} [params.withoutTenantId]     Only include decision requirements definitions which belongs to no tenant.
 *                                                Value may only be true, as false is the default behavior.
 *
 * @param  {String} [params.includeDecisionRequirementsDefinitionsWithoutTenantId] Include decision requirements definitions which belongs to no tenant.
 *                                                  Can be used in combination with tenantIdIn. Value may only be true, as false is the default behavior.
 *
 * @param  {String} [params.sortBy]               Sort the results lexicographically by a given criterion.
 *                                                Valid values are category, "key", "id", "name", "version" and "deploymentId".
 *                                                Must be used in conjunction with the "sortOrder" parameter.
 *
 * @param  {String} [params.sortOrder]            Sort the results in a given order.
 *                                                Values may be asc for ascending "order" or "desc" for descending order.
 *                                                Must be used in conjunction with the sortBy parameter.
 *
 * @param  {Integer} [params.firstResult]         Pagination of results. Specifies the index of the first result to return.
 * @param  {Integer} [params.maxResults]          Pagination of results. Specifies the maximum number of results to return.
 *                                                Will return less results, if there are no more results left.
 * @param {Function} done
 */


DRD.list = function (params, done) {
  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

function createIdUrl(path, id) {
  return path + '/' + utils.escapeUrl(id);
}
/**
 * Retrieves a single decision requirements definition.
 * @param  {uuid}     id   The id of the decision definition to be retrieved.
 * @param  {Function} done
 */


DRD.get = function (id, done) {
  return this.http.get(createIdUrl(this.path, id), {
    done: done
  });
};

function createKeyTenantUrl(path, key, tenantId) {
  var url = path + '/key/' + utils.escapeUrl(key);

  if (typeof tenantId !== 'function') {
    url += '/tenant-id/' + utils.escapeUrl(tenantId);
  }

  return url;
}
/**
 * Retrieves a single decision requirements definition.
 * @param  {string}     key   The key of the decision requirements definition (the latest version thereof) to be retrieved.
 * @param  {uuid}     [tenantId]   The id of the tenant to which the decision requirements definition belongs to.
 * @param  {Function} done
 */


DRD.getByKey = function (key, tenantId, done) {
  var url = createKeyTenantUrl(this.path, key, tenantId);

  if (typeof tenantId === 'function') {
    done = tenantId;
  }

  return this.http.get(url, {
    done: done
  });
};
/**
 * Retrieves the DMN XML of this decision requirements definition.
 * @param  {uuid}     id   The id of the decision definition to be retrieved.
 * @param  {Function} done
 */


DRD.getXML = function (id, done) {
  return this.http.get(createIdUrl(this.path, id) + '/xml', {
    done: done
  });
};
/**
 * Retrieves the DMN XML of this decision requirements definition.
 * @param  {string}     key   The key of the decision requirements definition (the latest version thereof) to be retrieved.
 * @param  {uuid}     [tenantId]   The id of the tenant to which the decision requirements definition belongs to.
 * @param  {Function} done
 */


DRD.getXMLByKey = function (key, tenantId, done) {
  var url = createKeyTenantUrl(this.path, key, tenantId) + '/xml';

  if (typeof tenantId === 'function') {
    done = tenantId;
  }

  return this.http.get(url, {
    done: done
  });
};

module.exports = DRD;

},{"../../utils":50,"../abstract-client-resource":4}],16:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * Execution Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Execution = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Execution.path = 'execution';
/**
 * Deletes a variable in the context of a given execution. Deletion does not propagate upwards in the execution hierarchy.
 */

Execution.deleteVariable = function (data, done) {
  return this.http.del(this.path + '/' + data.id + '/localVariables/' + utils.escapeUrl(data.varId), {
    done: done
  });
};
/**
 * Updates or deletes the variables in the context of an execution.
 * The updates do not propagate upwards in the execution hierarchy.
 * Updates precede deletions.
 * So, if a variable is updated AND deleted, the deletion overrides the update.
 */


Execution.modifyVariables = function (data, done) {
  return this.http.post(this.path + '/' + data.id + '/localVariables', {
    data: data,
    done: done
  });
};

module.exports = Execution;

},{"../../utils":50,"./../abstract-client-resource":4}],17:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * ExternalTask Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var ExternalTask = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

ExternalTask.path = 'external-task';
/**
 * Retrieves a single external task corresponding to the ExternalTask interface in the engine.
 *
 * @param {Object} [params]
 * @param {String} [params.id]      The id of the external task to be retrieved.
 */

ExternalTask.get = function (params, done) {
  return this.http.get(this.path + '/' + params.id, {
    data: params,
    done: done
  });
};
/**
 * Query for external tasks that fulfill given parameters in the form of a json object. This method is slightly more
 * powerful than the GET query because it allows to specify a hierarchical result sorting.
 *
 * @param {Object} [params]
 * @param {String} [params.externalTaskId]    Filter by an external task's id.
 * @param {String} [params.topicName]         Filter by an external task topic.
 * @param {String} [params.workerId]          Filter by the id of the worker that the task was most recently locked by.
 * @param {String} [params.locked]            Only include external tasks that are currently locked (i.e. they have a lock time and it has not expired). Value may only be true, as false matches any external task.
 * @param {String} [params.notLocked]         Only include external tasks that are currently not locked (i.e. they have no lock or it has expired). Value may only be true, as false matches any external task.
 * @param {String} [params.withRetriesLeft]	  Only include external tasks that have a positive (> 0) number of retries (or null). Value may only be true, as false matches any external task.
 * @param {String} [params.noRetriesLeft]	    Only include external tasks that have 0 retries. Value may only be true, as false matches any external task.
 * @param {String} [params.lockExpirationAfter]	Restrict to external tasks that have a lock that expires after a given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param {String} [params.lockExpirationBefore]	Restrict to external tasks that have a lock that expires before a given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param {String} [params.activityId]	      Filter by the id of the activity that an external task is created for.
 * @param {String} [params.executionId]	      Filter by the id of the execution that an external task belongs to.
 * @param {String} [params.processInstanceId]	Filter by the id of the process instance that an external task belongs to.
 * @param {String} [params.processDefinitionId]	Filter by the id of the process definition that an external task belongs to.
 * @param {String} [params.active]	          Only include active tasks. Value may only be true, as false matches any external task.
 * @param {String} [params.suspended]	        Only include suspended tasks. Value may only be true, as false matches any external task.
 * @param {String} [params.sorting]           A JSON array of criteria to sort the result by. Each element of the array is a JSON object that specifies one ordering. The position in the array identifies the rank of an ordering, i.e. whether it is primary, secondary, etc. The ordering objects have the following properties:
 *                                            - sortBy	Mandatory. Sort the results lexicographically by a given criterion. Valid values are id, lockExpirationTime, processInstanceId, processDefinitionId, and processDefinitionKey.
 *                                            - sortOrder	Mandatory. Sort the results in a given order. Values may be asc for ascending order or desc for descending order.
 * @param {String} [params.firstResult]	      Pagination of results. Specifies the index of the first result to return.
 * @param {String} [params.maxResults]	      Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


ExternalTask.list = function (params, done) {
  var path = this.path + '/'; // those parameters have to be passed in the query and not body

  path += '?firstResult=' + (params.firstResult || 0);
  path += '&maxResults=' + (params.maxResults || 15);
  return this.http.post(path, {
    data: params,
    done: done
  });
};
/**
 * Query for the number of external tasks that fulfill given parameters. Takes the same parameters as the get external tasks method.
 *
 * @param {Object} [params]
 * @param {String} [params.externalTaskId]    Filter by an external task's id.
 * @param {String} [params.topicName]         Filter by an external task topic.
 * @param {String} [params.workerId]          Filter by the id of the worker that the task was most recently locked by.
 * @param {String} [params.locked]            Only include external tasks that are currently locked (i.e. they have a lock time and it has not expired). Value may only be true, as false matches any external task.
 * @param {String} [params.notLocked]         Only include external tasks that are currently not locked (i.e. they have no lock or it has expired). Value may only be true, as false matches any external task.
 * @param {String} [params.withRetriesLeft]	  Only include external tasks that have a positive (> 0) number of retries (or null). Value may only be true, as false matches any external task.
 * @param {String} [params.noRetriesLeft]	    Only include external tasks that have 0 retries. Value may only be true, as false matches any external task.
 * @param {String} [params.lockExpirationAfter]	Restrict to external tasks that have a lock that expires after a given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param {String} [params.lockExpirationBefore]	Restrict to external tasks that have a lock that expires before a given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param {String} [params.activityId]	      Filter by the id of the activity that an external task is created for.
 * @param {String} [params.executionId]	      Filter by the id of the execution that an external task belongs to.
 * @param {String} [params.processInstanceId]	Filter by the id of the process instance that an external task belongs to.
 * @param {String} [params.processDefinitionId]	Filter by the id of the process definition that an external task belongs to.
 * @param {String} [params.active]	          Only include active tasks. Value may only be true, as false matches any external task.
 * @param {String} [params.suspended]	        Only include suspended tasks. Value may only be true, as false matches any external task.
 */


ExternalTask.count = function (params, done) {
  return this.http.post(this.path + '/count', {
    data: params,
    done: done
  });
};
/**
 * Query for the number of external tasks that fulfill given parameters. Takes the same parameters as the get external tasks method.
 *
 * @param {Object} [params]
 * @param {String} [params.workerId]         Mandatory. The id of the worker on which behalf tasks are fetched. The returned tasks are locked for that worker and can only be completed when providing the same worker id.
 * @param {String} [params.maxTasks]         Mandatory. The maximum number of tasks to return.
 * @param {String} [params.topics]           A JSON array of topic objects for which external tasks should be fetched. The returned tasks may be arbitrarily distributed among these topics.
 *
 * Each topic object has the following properties:
 *  Name	         Description
 *  topicName	   Mandatory. The topic's name.
 *  lockDuration	 Mandatory. The duration to lock the external tasks for in milliseconds.
 *  variables	   A JSON array of String values that represent variable names. For each result task belonging to this topic, the given variables are returned as well if they are accessible from the external task's execution.
 */


ExternalTask.fetchAndLock = function (params, done) {
  return this.http.post(this.path + '/fetchAndLock', {
    data: params,
    done: done
  });
};
/**
 * Complete an external task and update process variables.
 *
 * @param {Object} [params]
 * @param {String} [params.id]            The id of the task to complete.
 * @param {String} [params.workerId]      The id of the worker that completes the task. Must match the id of the worker who has most recently locked the task.
 * @param {String} [params.variables]     A JSON object containing variable key-value pairs.
 *
 * Each key is a variable name and each value a JSON variable value object with the following properties:
 *  Name	        Description
 *  value	        The variable's value. For variables of type Object, the serialized value has to be submitted as a String value.
 *                For variables of type File the value has to be submitted as Base64 encoded string.
 *  type	        The value type of the variable.
 *  valueInfo	    A JSON object containing additional, value-type-dependent properties.
 *                For serialized variables of type Object, the following properties can be provided:
 *                - objectTypeName: A string representation of the object's type name.
 *                - serializationDataFormat: The serialization format used to store the variable.
 *                For serialized variables of type File, the following properties can be provided:
 *                - filename: The name of the file. This is not the variable name but the name that will be used when downloading the file again.
 *                - mimetype: The mime type of the file that is being uploaded.
 *                - encoding: The encoding of the file that is being uploaded.
 */


ExternalTask.complete = function (params, done) {
  return this.http.post(this.path + '/' + params.id + '/complete', {
    data: params,
    done: done
  });
};
/**
 * Report a failure to execute an external task. A number of retries and a timeout until
 * the task can be retried can be specified. If retries are set to 0, an incident for this
 * task is created.
 *
 * @param {Object} [params]
 * @param {String} [params.id]                 The id of the external task to report a failure for.
 * @param {String} [params.workerId]           The id of the worker that reports the failure. Must match the id of the worker who has most recently locked the task.
 * @param {String} [params.errorMessage]       An message indicating the reason of the failure.
 * @param {String} [params.retries]            A number of how often the task should be retried. Must be >= 0. If this is 0, an incident is created and the task cannot be fetched anymore unless the retries are increased again. The incident's message is set to the errorMessage parameter.
 * @param {String} [params.retryTimeout]       A timeout in milliseconds before the external task becomes available again for fetching. Must be >= 0.
 */


ExternalTask.failure = function (params, done) {
  return this.http.post(this.path + '/' + params.id + '/failure', {
    data: params,
    done: done
  });
};
/**
 * Unlock an external task. Clears the task’s lock expiration time and worker id.
 *
 * @param {Object} [params]
 * @param {String} [params.id]          The id of the external task to unlock.
 */


ExternalTask.unlock = function (params, done) {
  return this.http.post(this.path + '/' + params.id + '/unlock', {
    data: params,
    done: done
  });
};
/**
 * Set the number of retries left to execute an external task. If retries are set to 0, an incident is created.
 *
 * @param {Object} [params]
 * @param {String} [params.id]           The id of the external task to unlock.
 * @param {String} [params.retries]      The number of retries to set for the external task. Must be >= 0. If this is 0, an incident is created and the task cannot be fetched anymore unless the retries are increased again.
 */


ExternalTask.retries = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/retries', {
    data: params,
    done: done
  });
};
/**
 * Set the number of retries left to execute an external task asynchronously. If retries are set to 0, an incident is created.
 *
 * @see https://docs.camunda.org/manual/latest/reference/rest/external-task/post-retries-async/
 *
 * @param   {Object}            params
 * @param   {requestCallback}   done
 */


ExternalTask.retriesAsync = function (params, done) {
  return this.http.post(this.path + '/retries-async', {
    data: params,
    done: done
  });
};

module.exports = ExternalTask;

},{"./../abstract-client-resource":4}],18:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Filter Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Filter = AbstractClientResource.extend();
/**
 * API path for the filter resource
 * @type {String}
 */

Filter.path = 'filter';
/**
 * Retrieve a single filter
 *
 * @param  {uuid}     filterId   of the filter to be requested
 * @param  {Function} done
 */

Filter.get = function (filterId, done) {
  return this.http.get(this.path + '/' + filterId, {
    done: done
  });
};
/**
 * Retrieve some filters
 *
 * @param  {Object}   data
 * @param  {Integer}  [data.firstResult]
 * @param  {Integer}  [data.maxResults]
 * @param  {String}   [data.sortBy]
 * @param  {String}   [data.sortOrder]
 * @param  {Bool}     [data.itemCount]
 * @param  {Function} done
 */


Filter.list = function (data, done) {
  return this.http.get(this.path, {
    data: data,
    done: done
  });
};
/**
 * Get the tasks result of filter
 *
 * @param  {(Object.<String, *>|uuid)}  data  uuid of a filter or parameters
 * @param  {uuid}     [data.id]               uuid of the filter to be requested
 * @param  {Integer}  [data.firstResult]
 * @param  {Integer}  [data.maxResults]
 * @param  {String}   [data.sortBy]
 * @param  {String}   [data.sortOrder]
 * @param  {Function} done
 */


Filter.getTasks = function (data, done) {
  var path = this.path + '/';

  if (typeof data === 'string') {
    path = path + data + '/list';
    data = {};
  } else {
    path = path + data.id + '/list';
    delete data.id;
  } // those parameters have to be passed in the query and not body


  path += '?firstResult=' + (data.firstResult || 0);
  path += '&maxResults=' + (data.maxResults || 15);
  return this.http.post(path, {
    data: data,
    done: done
  });
};
/**
 * Creates a filter
 *
 * @param  {Object}   filter   is an object representation of a filter
 * @param  {Function} done
 */


Filter.create = function (filter, done) {
  return this.http.post(this.path + '/create', {
    data: filter,
    done: done
  });
};
/**
 * Update a filter
 *
 * @param  {Object}   filter   is an object representation of a filter
 * @param  {Function} done
 */


Filter.update = function (filter, done) {
  return this.http.put(this.path + '/' + filter.id, {
    data: filter,
    done: done
  });
};
/**
 * Save a filter
 *
 * @see Filter.create
 * @see Filter.update
 *
 * @param  {Object}   filter   is an object representation of a filter, if it has
 *                             an id property, the filter will be updated, otherwise created
 * @param  {Function} done
 */


Filter.save = function (filter, done) {
  return Filter[filter.id ? 'update' : 'create'](filter, done);
};
/**
 * Delete a filter
 *
 * @param  {uuid}     id   of the filter to delete
 * @param  {Function} done
 */


Filter["delete"] = function (id, done) {
  return this.http.del(this.path + '/' + id, {
    done: done
  });
};
/**
 * Performs an authorizations lookup on the resource or entity
 *
 * @param  {uuid}     [id]   of the filter to get authorizations for
 * @param  {Function} done
 */


Filter.authorizations = function (id, done) {
  if (typeof id === 'function') {
    return this.http.options(this.path, {
      done: id,
      headers: {
        Accept: 'application/json'
      }
    });
  }

  return this.http.options(this.path + '/' + id, {
    done: done,
    headers: {
      Accept: 'application/json'
    }
  });
};

module.exports = Filter;

},{"./../abstract-client-resource":4}],19:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * Group Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Group = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Group.path = 'group';
/**
 * Check resource access
 * @param  {Object}   options
 * @param  {String}   options.id
 * @param  {Function} done
 */

Group.options = function (options, done) {
  var id;

  if (typeof options === 'function') {
    done = options;
    id = '';
  } else {
    id = typeof options === 'string' ? options : options.id;

    if (id === undefined) {
      id = '';
    }
  }

  return this.http.options(this.path + '/' + utils.escapeUrl(id), {
    done: done || noop,
    headers: {
      Accept: 'application/json'
    }
  });
};
/**
 * Creates a group
 *
 * @param  {Object}   group       is an object representation of a group
 * @param  {String}   group.id
 * @param  {String}   group.name
 * @param  {String}   group.type
 * @param  {Function} done
 */


Group.create = function (options, done) {
  return this.http.post(this.path + '/create', {
    data: options,
    done: done || noop
  });
};
/**
 * Query for groups using a list of parameters and retrieves the count
 *
 * @param {String} [options.id]        Filter by the id of the group.
 * @param {String} [options.name]      Filter by the name of the group.
 * @param {String} [options.nameLike]  Filter by the name that the parameter is a substring of.
 * @param {String} [options.type]      Filter by the type of the group.
 * @param {String} [options.member]    Only retrieve groups where the given user id is a member of.
 * @param  {Function} done
 */


Group.count = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  return this.http.get(this.path + '/count', {
    data: options,
    done: done || noop
  });
};
/**
 * Retrieves a single group
 *
 * @param  {String} [options.id]    The id of the group, can be a property (id) of an object
 * @param  {Function} done
 */


Group.get = function (options, done) {
  var id = typeof options === 'string' ? options : options.id;
  return this.http.get(this.path + '/' + utils.escapeUrl(id), {
    data: options,
    done: done || noop
  });
};
/**
 * Query for a list of groups using a list of parameters.
 * The size of the result set can be retrieved by using the get groups count method
 *
 * @param {String} [options.id]           Filter by the id of the group.
 * @param {String} [options.idIn]         Filter by multiple ids.
 * @param {String} [options.name]         Filter by the name of the group.
 * @param {String} [options.nameLike]     Filter by the name that the parameter is a substring of.
 * @param {String} [options.type]         Filter by the type of the group.
 * @param {String} [options.member]       Only retrieve groups where the given user id is a member of.
 * @param {String} [options.sortBy]       Sort the results lexicographically by a given criterion.
 *                                        Valid values are id, name and type.
 *                                        Must be used in conjunction with the sortOrder parameter.
 * @param {String} [options.sortOrder]    Sort the results in a given order.
 *                                        Values may be asc for ascending order or desc for descending order.
 *                                        Must be used in conjunction with the sortBy parameter.
 * @param {String} [options.firstResult]  Pagination of results.
 *                                        Specifies the index of the first result to return.
 * @param {String} [options.maxResults]   Pagination of results.
 *                                        Specifies the maximum number of results to return.
 *                                        Will return less results if there are no more results left.
 *
 * @param  {Function} done
 */


Group.list = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  var query = {};

  if (options.maxResults) {
    query.maxResults = options.maxResults;
    query.firstResult = options.firstResult;
  }

  return this.http.post(this.path, {
    data: options,
    query: query,
    done: done || noop
  });
};
/**
 * Add a memeber to a Group
 *
 * @param {String} [options.id]       The id of the group
 * @param {String} [options.userId]   The id of user to add to the group
 * @param  {Function} done
 */


Group.createMember = function (options, done) {
  return this.http.put(this.path + '/' + utils.escapeUrl(options.id) + '/members/' + utils.escapeUrl(options.userId), {
    data: options,
    done: done || noop
  });
};
/**
 * Removes a memeber of a Group
 *
 * @param {String} [options.id]       The id of the group
 * @param {String} [options.userId]   The id of user to add to the group
 * @param  {Function} done
 */


Group.deleteMember = function (options, done) {
  return this.http.del(this.path + '/' + utils.escapeUrl(options.id) + '/members/' + utils.escapeUrl(options.userId), {
    data: options,
    done: done || noop
  });
};
/**
 * Update a group
 *
 * @param  {Object}   group   is an object representation of a group
 * @param  {Function} done
 */


Group.update = function (options, done) {
  return this.http.put(this.path + '/' + utils.escapeUrl(options.id), {
    data: options,
    done: done || noop
  });
};
/**
 * Delete a group
 *
 * @param  {Object}   group   is an object representation of a group
 * @param  {Function} done
 */


Group["delete"] = function (options, done) {
  return this.http.del(this.path + '/' + utils.escapeUrl(options.id), {
    data: options,
    done: done || noop
  });
};

module.exports = Group;

},{"../../utils":50,"./../abstract-client-resource":4}],20:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('../abstract-client-resource');

var helpers = require('../helpers');
/**
 * History Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var History = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

History.path = 'history';
/**
 * Queries for the number of user operation log entries that fulfill the given parameters
 *
 * @param {Object}   [params]
 * @param {String}   [params.processDefinitionId]   Filter by process definition id.
 * @param {String}   [params.processDefinitionKey]  Filter by process definition key.
 * @param {String}   [params.processInstanceId]     Filter by process instance id.
 * @param {String}   [params.executionId]           Filter by execution id.
 * @param {String}   [params.caseDefinitionId]      Filter by case definition id.
 * @param {String}   [params.caseInstanceId]        Filter by case instance id.
 * @param {String}   [params.caseExecutionId]       Filter by case execution id.
 * @param {String}   [params.taskId]                Only include operations on this task.
 * @param {String}   [params.userId]                Only include operations of this user.
 * @param {String}   [params.operationId]           Filter by the id of the operation. This allows fetching of multiple entries which are part of a composite operation.
 * @param {String}   [params.operationType]         Filter by the type of the operation like Claim or Delegate.
 * @param {String}   [params.entityType]            Filter by the type of the entity that was affected by this operation, possible values are Task, Attachment or IdentityLink.
 * @param {String}   [params.property]              Only include operations that changed this property, e.g. owner or assignee
 * @param {String}   [params.afterTimestamp]        Restrict to entries that were created after the given timestamp. The timestamp must have the format yyyy-MM-dd'T'HH:mm:ss, e.g. 2014-02-25T14:58:37
 * @param {String}   [params.beforeTimestamp]       Restrict to entries that were created before the given timestamp. The timestamp must have the format yyyy-MM-dd'T'HH:mm:ss, e.g. 2014-02-25T14:58:37
 * @param {String}   [params.sortBy]                Sort the results by a given criterion. At the moment the query only supports sorting based on the timestamp.
 * @param {String}   [params.sortOrder]             Sort the results in a given order. Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param {Number}   [params.firstResult]           Pagination of results. Specifies the index of the first result to return.
 * @param {Number}   [params.maxResults]            Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 * @param {Function} done
 */

History.userOperationCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/user-operation/count', {
    data: params,
    done: done
  });
};
/**
 * Queries for user operation log entries that fulfill the given parameters
 * This method takes the same parameters as `History.userOperationCount`.
 */


History.userOperation = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/user-operation', {
    data: params,
    done: done
  });
};
/**
 *  Set an annotation for auditing reasons.
 *
 * @param {Object}   [params]
 * @param {String}   [params.id]            Operation ID to set the Annotation
 * @param {String}   [params.annotation]    An arbitrary text annotation set by a user for auditing reasons.
 * @param {Function} done
 */


History.setUserOperationAnnotation = function (params, done) {
  return this.http.put(this.path + '/user-operation/' + params.id + '/set-annotation', {
    data: params,
    done: done
  });
};
/**
 *  Clear the annotation which was previously set for auditing reasons.
 *
 * @param {String}   [id]                   The operation id of the operation log to be updated.
 * @param {Function} done
 */


History.clearUserOperationAnnotation = function (id, done) {
  return this.http.put(this.path + '/user-operation/' + id + '/clear-annotation', {
    done: done
  });
};
/**
 * Query for historic process instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.processInstanceId]                Filter by process instance id.
 * @param  {uuid[]}   [params.processInstanceIds]               Filter by process instance ids.
 *                                                              Must be a json array process instance ids.
 * @param  {String}   [params.processInstanceBusinessKey]       Filter by process instance business key.
 * @param  {String}   [params.processInstanceBusinessKeyLike]   Filter by process instance business key that the parameter is a substring of.
 * @param  {uuid}     [params.superProcessInstanceId]           Restrict query to all process instances that are sub process instances of the given process instance.
 *                                                              Takes a process instance id.
 * @param  {uuid}     [params.subProcessInstanceId]             Restrict query to one process instance that has a sub process instance with the given id.
 * @param  {uuid}     [params.superCaseInstanceId]              Restrict query to all process instances that are sub process instances of the given case instance.
 *                                                              Takes a case instance id.
 * @param  {uuid}     [params.subCaseInstanceId]                Restrict query to one process instance that has a sub case instance with the given id.
 * @param  {uuid}     [params.caseInstanceId]                   Restrict query to all process instances that are sub process instances of the given case instance.
 *                                                              Takes a case instance id.
 * @param  {uuid}     [params.processDefinitionId]              Filter by the process definition the instances run on.
 * @param  {String}   [params.processDefinitionKey]             Filter by the key of the process definition the instances run on.
 * @param  {String[]} [params.processDefinitionKeyNotIn]        Exclude instances that belong to a set of process definitions.
 *                                                              Must be a json array of process definition keys.
 * @param  {String}   [params.processDefinitionName]            Filter by the name of the process definition the instances run on.
 * @param  {String}   [params.processDefinitionNameLike]        Filter by process definition names that the parameter is a substring of.
 * @param  {Boolean}  [params.finished]                         Only include finished process instances.
 *                                                              Values may be `true` or `false`.
 * @param  {Boolean}  [params.unfinished]                       Only include unfinished process instances.
 *                                                              Values may be `true` or `false`.
 * @param  {String}   [params.startedBy]                        Only include process instances that were started by the given user.
 * @param  {String}   [params.startedBefore]                    Restrict to instances that were started before the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.startedAfter]                     Restrict to instances that were started after the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.finishedBefore]                   Restrict to instances that were finished before the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.finishedAfter]                    Restrict to instances that were finished after the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Object[]} [params.variables]                        A JSON array to only include process instances that have/had variables with certain values. The array consists of objects with the three properties name, operator and value. name (String) is the variable name, operator (String) is the comparison operator to be used and value the variable value.
 *                                                              `value` may be String, Number or Boolean.
 *                                                              Valid operator values are:
 *                                                              - `eq` - equal to
 *                                                              - `neq` - not equal to
 *                                                              - `gt` - greater than
 *                                                              - `gteq` - greater than or equal to
 *                                                              - `lt` - lower than
 *                                                              - `lteq` - lower than or equal to
 *                                                              - `like`
 * @param  {String}   [params.sortBy]                           Sort the results by a given criterion.
 *                                                              Valid values are instanceId, definitionId, businessKey, startTime, endTime, duration. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                        Sort the results in a given order.
 *                                                              Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                      Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                       Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.

 * @param  {Function} done
 */


History.processInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    } else {
      body[p] = params[p];
    }
  }

  return this.http.post(this.path + '/process-instance', {
    data: body,
    query: query,
    done: done
  });
};
/**
 * Query for the number of historic process instances that fulfill the given parameters.
 * This method takes the same message body as `History.processInstance`.
 */


History.processInstanceCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/process-instance/count', {
    data: params,
    done: done
  });
};
/**
 * Delete finished process instances asynchronously. With creation of a batch operation.
 *
 * @param params - either list of process instance ID's or an object corresponding to a processInstances
 *                  POST request based query
 * @param done - a callback function
 * @returns {*}
 */


History.deleteProcessInstancesAsync = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/process-instance/delete', {
    data: params,
    done: done
  });
};
/**
 * Set removal time to historic process instances asynchronously. With creation of a batch operation.
 *
 * @param params - either list of process instance ID's or an object corresponding to a processInstances
 *                  POST request based query
 * @param done - a callback function
 * @returns {*}
 */


History.setRemovalTimeToHistoricProcessInstancesAsync = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/process-instance/set-removal-time', {
    data: params,
    done: done
  });
};
/**
 * Set removal time to historic decision instances asynchronously. With creation of a batch operation.
 *
 * @param params - either list of decision instance ID's or an object corresponding to a decisionInstances
 *                  POST request based query
 * @param done - a callback function
 * @returns {*}
 */


History.setRemovalTimeToHistoricDecisionInstancesAsync = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/decision-instance/set-removal-time', {
    data: params,
    done: done
  });
};
/**
 * Set removal time to historic batches asynchronously. With creation of a batch operation.
 *
 * @param params - either list of batch ID's or an object corresponding to a batches
 *                  POST request based query
 * @param done - a callback function
 * @returns {*}
 */


History.setRemovalTimeToHistoricBatchesAsync = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/batch/set-removal-time', {
    data: params,
    done: done
  });
};
/**
 * Query for historic decision instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.decisionInstanceId]                 Filter by decision instance id.
 * @param  {String}   [params.decisionInstanceIdIn]               Filter by decision instance ids. Must be a comma-separated list of decision instance ids.
 * @param  {uuid}     [params.decisionDefinitionId]               Filter by the decision definition the instances belongs to.
 * @param  {String}   [params.decisionDefinitionKey]              Filter by the key of the decision definition the instances belongs to.
 * @param  {String}   [params.decisionDefinitionName]             Filter by the name of the decision definition the instances belongs to.
 * @param  {uuid}     [params.processDefinitionId]                Filter by the process definition the instances belongs to.
 * @param  {String}   [params.processDefinitionKey]               Filter by the key of the process definition the instances belongs to.
 * @param  {uuid}     [params.processInstanceId]                  Filter by the process instance the instances belongs to.
 * @param  {uuid}     [params.activityIdIn]                       Filter by the activity ids the instances belongs to. Must be a comma-separated list of acitvity ids.
 * @param  {String}   [params.activityInstanceIdIn]               Filter by the activity instance ids the instances belongs to. Must be a comma-separated list of acitvity instance ids.
 * @param  {String}   [params.evaluatedBefore]                    Restrict to instances that were evaluated before the given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.evaluatedAfter]                     Restrict to instances that were evaluated after the given date. The date must have the format yyyy-MM-dd'T'HH:mm:ss, e.g., 2013-01-23T14:42:45.
 * @param  {Boolean}  [params.includeInputs]                      Include input values in the result. Value may only be true, as false is the default behavior.
 * @param  {Boolean}  [params.includeOutputs]                     Include output values in the result. Value may only be true, as false is the default behavior.
 * @param  {Boolean}  [params.disableBinaryFetching]              Disables fetching of byte array input and output values. Value may only be true, as false is the default behavior.
 * @param  {Boolean}  [params.disableCustomObjectDeserialization] Disables deserialization of input and output values that are custom objects. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.sortBy]                             Sort the results by a given criterion.
 *                                                                Valid values are evaluationTime. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                          Sort the results in a given order.
 *                                                                Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                        Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                         Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 * @param  {Function} done
 */


History.decisionInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/decision-instance', {
    data: params,
    done: done
  });
};
/**
 * Query for the number of historic decision instances that fulfill the given parameters.
 * This method takes the same parameters as `History.decisionInstance`.
 */


History.decisionInstanceCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/decision-instance/count', {
    data: params,
    done: done
  });
};
/**
 * Delete historic decision instances asynchronously. With creation of a batch operation.
 *
 * @param params - either list of decision instance ID's or an object corresponding to a decisionInstances
 *                  POST request based query
 * @param done - a callback function
 * @returns {*}
 */


History.deleteDecisionInstancesAsync = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/decision-instance/delete', {
    data: params,
    done: done
  });
};
/**
 * Query for historic batches that fulfill given parameters. Parameters may be the properties of batches, such as the id or type.
 * The size of the result set can be retrieved by using the GET query count.
 */


History.batch = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/batch', {
    data: params,
    done: done
  });
};
/**
 * Retrieves a single historic batch according to the HistoricBatch interface in the engine.
 */


History.singleBatch = function (id, done) {
  return this.http.get(this.path + '/batch/' + id, {
    done: done
  });
};
/**
 * Request the number of historic batches that fulfill the query criteria.
 * Takes the same filtering parameters as the GET query.
 */


History.batchCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/batch/count', {
    data: params,
    done: done
  });
};

History.batchDelete = function (id, done) {
  var path = this.path + '/batch/' + id;
  return this.http.del(path, {
    done: done
  });
};
/**
 * Query for process instance durations report.
 * @param  {Object}   [params]
 * @param  {Object}   [params.reportType]           Must be 'duration'.
 * @param  {Object}   [params.periodUnit]           Can be one of `month` or `quarter`, defaults to `month`
 * @param  {Object}   [params.processDefinitionIn]  Comma separated list of process definition IDs
 * @param  {Object}   [params.startedAfter]         Date after which the process instance were started
 * @param  {Object}   [params.startedBefore]        Date before which the process instance were started
 * @param  {Function} done
 */


History.report = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  params.reportType = params.reportType || 'duration';
  params.periodUnit = params.periodUnit || 'month';
  return this.http.get(this.path + '/process-instance/report', {
    data: params,
    done: done
  });
};
/**
 * Query for process instance durations report.
 * @param  {Object}   [params]
 * @param  {Object}   [params.reportType]           Must be 'duration'.
 * @param  {Object}   [params.periodUnit]           Can be one of `month` or `quarter`, defaults to `month`
 * @param  {Object}   [params.processDefinitionIn]  Comma separated list of process definition IDs
 * @param  {Object}   [params.startedAfter]         Date after which the process instance were started
 * @param  {Object}   [params.startedBefore]        Date before which the process instance were started
 * @param  {Function} done
 */


History.reportAsCsv = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  params.reportType = params.reportType || 'duration';
  params.periodUnit = params.periodUnit || 'month';
  return this.http.get(this.path + '/process-instance/report', {
    data: params,
    accept: 'text/csv',
    done: done
  });
};
/**
 * Query for historic task instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.taskId]                           Filter by taskId.
 * @param  {uuid}     [params.taskParentTaskId]                 Filter by parent task id.
 * @param  {uuid}     [params.processInstanceId]                Filter by process instance id.
 * @param  {uuid}     [params.executionId]                      Filter by the id of the execution that executed the task.
 * @param  {uuid}     [params.processDefinitionId]              Filter by process definition id.
 * @param  {String}   [params.processDefinitionKey]             Restrict to tasks that belong to a process definition with the given key.
 * @param  {String}   [params.processDefinitionName]            Restrict to tasks that belong to a process definition with the given name.
 * @param  {uuid}     [params.caseInstanceId]                   Filter by case instance id.

 * @param  {uuid}     [params.caseExecutionId]                  Filter by the id of the case execution that executed the task.
 * @param  {uuid}     [params.caseDefinitionId]                 Filter by case definition id.
 * @param  {String}   [params.caseDefinitionKey]                Restrict to tasks that belong to a case definition with the given key.
 * @param  {String}   [params.caseDefinitionName]               Restrict to tasks that belong to a case definition with the given name.
 * @param  {uuid[]}   [params.activityInstanceIdIn]             Only include tasks which belong to one of the passed activity instance ids.
 *                                                              Must be a json array of activity instance ids.
 * @param  {String}   [params.taskName]                         Restrict to tasks that have the given name.
 * @param  {String}   [params.taskNameLike]                     Restrict to tasks that have a name with the given parameter value as substring.
 * @param  {String}   [params.taskDescription]                  Restrict to tasks that have the given description.
 * @param  {String}   [params.taskDescriptionLike]              Restrict to tasks that have a description that has the parameter value as a substring.
 * @param  {String}   [params.taskDefinitionKey]                Restrict to tasks that have the given key.
 * @param  {String}   [params.taskDeleteReason]                 Restrict to tasks that have the given delete reason.
 * @param  {String}   [params.taskDeleteReasonLike]             Restrict to tasks that have a delete reason that has the parameter value as a substring.
 * @param  {String}   [params.taskAssignee]                     Restrict to tasks that the given user is assigned to.
 * @param  {String}   [params.taskAssigneeLike]                 Restrict to tasks that are assigned to users with the parameter value as a substring.
 * @param  {String}   [params.taskOwner]                        Restrict to tasks that the given user owns.
 * @param  {String}   [params.taskOwnerLike]                    Restrict to tasks that are owned by users with the parameter value as a substring.
 * @param  {String}   [params.taskPriority]                     Restrict to tasks that have the given priority.
 * @param  {String}   [params.assigned]                         If set to true, restricts the query to all tasks that are assigned.
 *                                                              Values may be `true` or `false`.
 * @param  {String}   [params.unassigned]                       If set to true, restricts the query to all tasks that are unassigned.
 *                                                              Values may be `true` or `false`.
 * @param  {String}   [params.finished]                         Only include finished tasks. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.unfinished]                       Only include unfinished tasks. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.processFinished]                  Only include tasks of finished processes. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.processUnfinished]                Only include tasks of unfinished processes. Value may only be true, as false is the default behavior.
 * @param  {Date}     [params.taskDueDate]                      Restrict to tasks that are due on the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.taskDueDateBefore]                RestRestrict to tasks that are due before the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.taskDueDateAfter]                 Restrict to tasks that are due after the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.taskFollowUpDate]                 ReRestrict to tasks that have a followUp date on the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.taskFollowUpDateBefore]           Restrict to tasks that have a followUp date before the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.taskFollowUpDateAfter]            Restrict to tasks that have a followUp date after the given date.
 *                                                              The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {uuid[]}   [params.tenantIdIn]                       Filter by a comma-separated list of tenant ids. A task instance must have one of the given tenant ids.
 *                                                              Must be a json array of tenant ids.
 * @param  {Object[]} [params.taskVariables]                    A JSON array to only include process instances that have/had variables with certain values. The array consists of objects with the three properties name, operator and value. name (String) is the variable name, operator (String) is the comparison operator to be used and value the variable value.
 *                                                              `value` may be String, Number or Boolean.
 *                                                              Valid operator values are:
 *                                                              - `eq` - equal to
 *                                                              - `neq` - not equal to
 *                                                              - `gt` - greater than
 *                                                              - `gteq` - greater than or equal to
 *                                                              - `lt` - lower than
 *                                                              - `lteq` - lower than or equal to
 *                                                              - `like`
 * @param  {Object[]} [params.processVariables]                 A JSON array to only include process instances that have/had variables with certain values. The array consists of objects with the three properties name, operator and value. name (String) is the variable name, operator (String) is the comparison operator to be used and value the variable value.
 *                                                              `value` may be String, Number or Boolean.
 *                                                              Valid operator values are:
 *                                                              - `eq` - equal to
 *                                                              - `neq` - not equal to
 *                                                              - `gt` - greater than
 *                                                              - `gteq` - greater than or equal to
 *                                                              - `lt` - lower than
 *                                                              - `lteq` - lower than or equal to
 *                                                              - `like`
 * @param  {String}   [params.taskInvolvedUser]                 Restrict on the historic identity links of any type of user.
 * @param  {String}   [params.taskInvolvedGroup]                Restrict on the historic identity links of any type of group.
 * @param  {String}   [params.taskHadCandidateUser]             Restrict on the historic identity links of type candidate user.
 * @param  {String}   [params.taskHadCandidateGroup]            Restrict on the historic identity links of type candidate group.
 * @param  {String}   [params.withCandidateGroups]              Only include tasks which have a candidate group. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.withoutCandidateGroups]           Only include tasks which have no candidate group. Value may only be true, as false is the default behavior.
 * @param  {String}   [params.sortBy]                           Sort the results by a given criterion.
 *                                                              Valid values are taskId, activityInstanceID, processDefinitionId, processInstanceId, executionId,
 *                                                              duration, endTime, startTime, taskName, taskDescription, assignee, owner, dueDate, followUpDate,
 *                                                              deleteReason, taskDefinitionKey, priority, caseDefinitionId, caseInstanceId, caseExecutionId and
 *                                                              tenantId. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                        Sort the results in a given order.
 *                                                              Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                      Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                       Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.

 * @param  {Function} done
 */


History.task = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    } else {
      body[p] = params[p];
    }
  }

  return this.http.post(this.path + '/task', {
    data: body,
    query: query,
    done: done
  });
};
/**
 * Query for the number of historic task instances that fulfill the given parameters.
 * This method takes the same parameters as `History.task`.
 */


History.taskCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/task/count', {
    data: params,
    done: done
  });
};
/**
 * Query for a historic task instance duration report.
 *
 * @param  {Object}   [params]
 * @param  {Date}     [params.completedBefore]    Restrict to tasks which are completed before a given date.
 *                                                The date must have the format `yyyy-MM-dd'T'HH:mm:ss`,
 *                                                e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.completedAfter]     Restrict to tasks which are completed after a given date.
 *                                                The date must have the format `yyyy-MM-dd'T'HH:mm:ss`,
 *                                                e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.periodUnit]         Can be one of `month` or `quarter`, defaults to `month`
 * @param  {Function}  done
 */


History.taskDurationReport = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  params.reportType = params.reportType || 'duration';
  params.periodUnit = params.periodUnit || 'month';
  return this.http.get(this.path + '/task/report', {
    data: params,
    done: done
  });
};
/**
 * Query for a completed task instance report
 *
 * @param  {Object}   [params]
 * @param  {Date}     [params.completedBefore]    Restrict to tasks which are completed before a given date.
 *                                                The date must have the format `yyyy-MM-dd'T'HH:mm:ss`,
 *                                                e.g., 2013-01-23T14:42:45.
 * @param  {Date}     [params.completedAfter]     Restrict to tasks which are completed after a given date.
 *                                                The date must have the format `yyyy-MM-dd'T'HH:mm:ss`,
 *                                                e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.groupBy]            Groups the task report by `taskDefinitionKey` (Default) or
 *                                                `processDefinitionKey`. Valid values are `taskDefinition` or
 *                                                `processDefinition`.
 * @param done
 * @returns {*}
 */


History.taskReport = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  params.reportType = params.reportType || 'count';
  return this.http.get(this.path + '/task/report', {
    data: params,
    done: done
  });
};
/**
 * Query for historic case instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.caseInstanceId]                Filter by case instance id.
 * @param  {uuid[]}   [params.caseInstanceIds]               Filter by case instance ids.
 *                                                           Must be a json array case instance ids.
 *
 * @param  {uuid}     [params.caseDefinitionId]              Filter by the case definition the instances run on.
 * @param  {String}   [params.caseDefinitionKey]             Filter by the key of the case definition the instances run on.
 * @param  {String[]} [params.caseDefinitionKeyNotIn]        Exclude instances that belong to a set of case definitions.
 *
 * @param  {String}   [params.caseDefinitionName]            Filter by the name of the case definition the instances run on.
 * @param  {String}   [params.caseDefinitionNameLike]        Filter by case definition names that the parameter is a substring of.
 *
 * @param  {String}   [params.caseInstanceBusinessKey]       Filter by case instance business key.
 * @param  {String}   [params.caseInstanceBusinessKeyLike]   Filter by case instance business key that the parameter is a substring of.
 *
 *
 * @param  {String}   [params.createdBefore]                 Restrict to instances that were created before the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.createdAfter]                  Restrict to instances that were created after the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 *
 * @param  {String}   [params.closedBefore]                  Restrict to instances that were closed before the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.closedAfter]                   Restrict to instances that were closed after the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 *
 * @param  {String}   [params.createdBy]                     Only include case instances that were created by the given user.
 *
 *
 * @param  {uuid}     [params.superCaseInstanceId]           Restrict query to all case instances that are sub case instances of the given case instance.
 *                                                           Takes a case instance id.
 * @param  {uuid}     [params.subCaseInstanceId]             Restrict query to one case instance that has a sub case instance with the given id.
 *
 * @param  {uuid}     [params.superProcessInstanceId]        Restrict query to all process instances that are sub case instances of the given process instance.
 *                                                           Takes a process instance id.
 * @param  {uuid}     [params.subProcessInstanceId]          Restrict query to one case instance that has a sub process instance with the given id.
 *
 * @param  {uuid}     [params.tenantIdIn]                    Filter by a comma-separated list of tenant ids. A case instance must have one of the given tenant ids.
 *
 * @param  {Boolean}  [params.active]                        Only include active case instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.completed]                     Only include completed case instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.terminated]                    Only include terminated case instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.closed]                        Only include closed case instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.notClosed]                     Only include not closed case instances.
 *                                                           Values may be `true` or `false`.
 *
 * @param  {Object[]} [params.variables]                     A JSON array to only include case instances that have/had variables with certain values. The array consists of objects with the three properties name, operator and value. name (String) is the variable name, operator (String) is the comparison operator to be used and value the variable value.
 *                                                           `value` may be String, Number or Boolean.
 *                                                           Valid operator values are:
 *                                                           - `eq` - equal to
 *                                                           - `neq` - not equal to
 *                                                           - `gt` - greater than
 *                                                           - `gteq` - greater than or equal to
 *                                                           - `lt` - lower than
 *                                                           - `lteq` - lower than or equal to
 *                                                           - `like`
 *
 * @param  {String}   [params.sortBy]                        Sort the results by a given criterion.
 *                                                           Valid values are instanceId, definitionId, businessKey, startTime, endTime, duration. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                     Sort the results in a given order.
 *                                                           Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                   Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                    Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.

 * @param  {Function} done
 */


History.caseInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    } else {
      body[p] = params[p];
    }
  }

  return this.http.post(this.path + '/case-instance', {
    data: body,
    query: query,
    done: done
  });
};
/**
 * Query for the number of historic case instances that fulfill the given parameters.
 * This method takes the same parameters as `History.caseInstance`.
 */


History.caseInstanceCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/case-instance/count', {
    data: params,
    done: done
  });
};
/**
 * Query for historic case activty instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.caseActivityInstanceId]        Filter by case activity instance id.
 * @param  {String}   [params.caseExecutionId]               Filter by the id of the case execution that executed the case activity instance.
 * @param  {uuid}     [params.caseInstanceId]                Filter by case instance id.
 *
 * @param  {uuid}     [params.caseDefinitionId]              Filter by the case definition the instances run on.
 *
 * @param  {String}   [params.caseActivityId]                Filter by the case activity id.
 * @param  {String}   [params.caseActivityName]              Filter by the case activity name.
 * @param  {String}   [params.caseActivityType]              Filter by the case activity type.
 *
 * @param  {String}   [params.createdBefore]                 Restrict to instances that were created before the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.createdAfter]                  Restrict to instances that were created after the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 *
 * @param  {String}   [params.endedBefore]                   Restrict to instances that were ended before the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 * @param  {String}   [params.endedAfter]                    Restrict to instances that were ended after the given date.
 *                                                           The date must have the format `yyyy-MM-dd'T'HH:mm:ss`, e.g., 2013-01-23T14:42:45.
 *
 * @param  {Boolean}  [params.required]                      Only include required case activity instances.
 *                                                           Values may be `true` or `false`.
 *
 * @param  {Boolean}  [params.finished]                      Only include finished case activity instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.unfinished]                    Only include unfinished case activity instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.available]                     Only include available case activity instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.enabled]                       Only include enabled case activity instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.disabled]                      Only include disabled case activity instances.
 *                                                           Values may be `true` or `false`.
 * @param  {Boolean}  [params.active]                        Only include active case activity instances.
 *                                                           Values may be `true` or `false`.
 *
 * @param  {Boolean}  [params.completed]                     Only include completed case activity instances.
 *                                                           Values may be `true` or `false`.
 *
 * @param  {Boolean}  [params.terminated]                    Only include terminated case activity instances.
 *                                                           Values may be `true` or `false`.
 *
 * @param  {uuid[]}   [params.tenantIdIn]                    Filter by a comma-separated list of tenant ids. A case activity instance must have one of the given tenant ids.
 *
 * @param  {String}   [params.sortBy]                        Sort the results by a given criterion.
 *                                                           Valid values are caseActivityInstanceId, caseInstanceId, caseExecutionId, caseActivityId, caseActivityName, createTime, endTime, duration,
 *                                                           caseDefinitionId and tenantId. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                     Sort the results in a given order.
 *                                                           Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                   Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                    Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.

 * @param  {Function} done
 */


History.caseActivityInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/case-activity-instance', {
    data: params,
    done: done
  });
};
/**
 * Query for the number of historic case activity instances that fulfill the given parameters.
 * This method takes the same parameters as `History.caseActivityInstance`.
 */


History.caseActivityInstanceCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/case-activity-instance/count', {
    data: params,
    done: done
  });
};
/**
 * Queries for historic activity instances that fulfill the given parameters.
 * @param {Object}  [params]
 * @param {String}  params.activityInstanceId	    Filter by activity instance id.
 * @param {String}  params.processInstanceId      Filter by process instance id.
 * @param {String}  params.processDefinitionId    Filter by process definition id.
 * @param {String}  params.executionId            Filter by the id of the execution that executed the activity instance.
 * @param {String}  params.activityId             Filter by the activity id (according to BPMN 2.0 XML).
 * @param {String}  params.activityName           Filter by the activity name (according to BPMN 2.0 XML).
 * @param {String}  params.activityType           Filter by activity type.
 * @param {String}  params.taskAssignee           Only include activity instances that are user tasks and assigned to a given user.
 * @param {Boolean} params.finished               Only include finished activity instances. Value may only be true, as false behaves the same as when the property is not set.
 * @param {Boolean} params.unfinished             Only include unfinished activity instances. Value may only be true, as false behaves the same as when the property is not set.
 * @param {Boolean} params.canceled               Only include canceled activity instances. Value may only be true, as false behaves the same as when the property is not set.
 * @param {Boolean} params.completeScope          Only include activity instances which completed a scope. Value may only be true, as false behaves the same as when the property is not set.
 * @param {String}  params.startedBefore          Restrict to instances that were started before the given date. By default*, the date must have the format yyyy-MM-dd'T'HH:mm:ss.SSSZ, e.g., 2013-01-23T14:42:45.000+0200.
 * @param {String}  params.startedAfter           Restrict to instances that were started after the given date. By default*, the date must have the format yyyy-MM-dd'T'HH:mm:ss.SSSZ, e.g., 2013-01-23T14:42:45.000+0200.
 * @param {String}  params.finishedBefore         Restrict to instances that were finished before the given date. By default*, the date must have the format yyyy-MM-dd'T'HH:mm:ss.SSSZ, e.g., 2013-01-23T14:42:45.000+0200.
 * @param {String}  params.finishedAfter          Restrict to instances that were finished after the given date. By default*, the date must have the format yyyy-MM-dd'T'HH:mm:ss.SSSZ, e.g., 2013-01-23T14:42:45.000+0200.
 * @param {String}  params.tenantIdIn             Filter by a comma-separated list of tenant ids. An activity instance must have one of the given tenant ids.
 * @param {String}  params.sortBy                 Sort the results by a given criterion. Valid values are activityInstanceId, instanceId, executionId, activityId, activityName, activityType, startTime, endTime, duration, definitionId, occurrence and tenantId. Must be used in conjunction with the sortOrder parameter.
 * @param {String}  params.sortOrder              Sort the results in a given order. Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param {Number}  params.firstResult            Pagination of results. Specifies the index of the first result to return.
 * @param {Number}  params.maxResults             Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


History.activityInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/activity-instance', {
    data: params,
    done: done
  });
};
/**
 * Queries for historic activity instances that fulfill the given parameters.
 * @param {Object}  [params]
 * @param {String}  params.incidentId           Restricts to incidents that have the given id.
 * @param {String}  params.incidentType         Restricts to incidents that belong to the given incident type. See the User Guide for a list of incident types.
 * @param {String}  params.incidentMessage      Restricts to incidents that have the given incident message.
 * @param {String}  params.processDefinitionId  Restricts to incidents that belong to a process definition with the given id.
 * @param {String}  params.processInstanceId    Restricts to incidents that belong to a process instance with the given id.
 * @param {String}  params.executionId          Restricts to incidents that belong to an execution with the given id.
 * @param {String}  params.activityId           Restricts to incidents that belong to an activity with the given id.
 * @param {String}  params.causeIncidentId      Restricts to incidents that have the given incident id as cause incident.
 * @param {String}  params.rootCauseIncidentId  Restricts to incidents that have the given incident id as root cause incident.
 * @param {String}  params.configuration        Restricts to incidents that have the given parameter set as configuration.
 * @param {String}  params.tenantIdIn           Restricts to incidents that have one of the given comma-separated tenant ids.
 * @param {String}  params.jobDefinitionIdIn    Restricts to incidents that have one of the given comma-separated job definition ids.
 * @param {String}  params.open             	  Restricts to incidents that are open.
 * @param {String}  params.deleted              Restricts to incidents that are deleted.
 * @param {String}  params.resolved             Restricts to incidents that are resolved.
 * @param {String}  params.sortBy               Sort the results lexicographically by a given criterion. Valid values are incidentId, incidentMessage, createTime, endTime, incidentType, executionId, activityId, processInstanceId, processDefinitionId, causeIncidentId, rootCauseIncidentId, configuration, tenantId and incidentState. Must be used in conjunction with the sortOrder parameter.
 * @param {String}  params.sortOrder            Sort the results in a given order. Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 */


History.incident = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/incident', {
    data: params,
    done: done
  });
};
/**
 * Query for historic variable instances that fulfill the given parameters.
 *
 * @param  {Object}   [params]
 * @param  {uuid}     [params.variableName]                 Filter by variable name.
 * @param  {String}   [params.variableNameLike]             Restrict to variables with a name like the parameter.
 * @param  {uuid[]}   [params.variableValue]                Filter by variable value.
 *
 * @param  {uuid}     [params.processInstanceId]            Filter by the process instance the variable belongs to.
 * @param  {String[]} [params.executionIdIn]                Filter by the execution ids.
 * @param  {String}   [params.caseInstanceId]               Filter by the case instance id.
 * @param  {String[]} [params.caseExecutionIdIn]            Filter by the case execution ids.
 * @param  {String[]} [params.taskIdIn]                     Filter by the task ids.
 * @param  {String[]} [params.activityInstanceIdIn]         Filter by the activity instance ids.
 *
 * @param  {uuid[]}   [params.tenantIdIn]                    Filter by a comma-separated list of tenant ids. A case activity instance must have one of the given tenant ids.
 *
 * @param  {String}   [params.sortBy]                        Sort the results by a given criterion.
 *                                                           Valid values are instanceId, variableName and tenantId. Must be used in conjunction with the sortOrder parameter.
 * @param  {String}   [params.sortOrder]                     Sort the results in a given order.
 *                                                           Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param  {Number}   [params.firstResult]                   Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}   [params.maxResults]                    Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.

 * @param  {Function} done
 */


History.variableInstance = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults', 'deserializeValues'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    } else {
      body[p] = params[p];
    }
  }

  return this.http.post(this.path + '/variable-instance', {
    data: body,
    query: query,
    done: done
  });
};
/**
 * Query for the number of historic variable instances that fulfill the given parameters.
 * This method takes the same parameters as `History.variableInstance`.
 */


History.variableInstanceCount = function (params, done) {
  if (typeof params === 'function') {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/variable-instance/count', {
    data: params,
    done: done
  });
};

History.caseActivityStatistics = function (params, done) {
  var id = params.id || params;
  return this.http.get(this.path + '/case-definition/' + id + '/statistics', {
    done: done
  });
};

History.drdStatistics = function (id, params, done) {
  var url = this.path + '/decision-requirements-definition/' + id + '/statistics';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the history cleanup configuration
 */


History.cleanupConfiguration = function (params, done) {
  var url = this.path + '/cleanup/configuration';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Delete the history of a single variable
 */


History.deleteVariable = function (id, done) {
  var url = this.path + '/variable-instance/' + id;
  return this.http.del(url, {
    done: done
  });
};
/**
 * Delete the history of a single variable
 */


History.deleteAllVariables = function (id, done) {
  var url = this.path + '/process-instance/' + id + '/variable-instances';
  return this.http.del(url, {
    done: done
  });
};
/**
 * Query for the history cleanup job
 */


History.cleanupJobs = function (params, done) {
  var url = this.path + '/cleanup/jobs';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query to start a history cleanup job
 * @param  {Object}      [params]
 * @param  {Boolean}     [params.executeAtOnce]        Execute job in nearest future
 */


History.cleanup = function (params, done) {
  var url = this.path + '/cleanup';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.post(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the count of the finished historic process instances, cleanable process instances and basic process definition data - id, key, name and version
 * @param  {Object}      [params]
 * @param  {uuid[]}      [params.processDefinitionIdIn]        Array of processDefinition ids
 * @param  {uuid[]}      [params.processDefinitionKeyIn]       Array of processDefinition keys
 * @param  {Number}      [params.firstResult]                  Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}      [params.maxResults]                   Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


History.cleanableProcessCount = function (params, done) {
  var url = this.path + '/process-definition/cleanable-process-instance-report/count';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the report results about a process definition and finished process instances relevant to history cleanup
 * This method takes the same parameterers as 'History.cleanableProcessInstanceCount'
 */


History.cleanableProcess = function (params, done) {
  var url = this.path + '/process-definition/cleanable-process-instance-report';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the count of the finished historic case instances, cleanable case instances and basic case definition data - id, key, name and version.
 * @param  {uuid[]}      [params.caseDefinitionIdIn]           Array of caseDefinition ids
 * @param  {uuid[]}      [params.caseDefinitionKeyIn]          Array of caseDefinition keys
 * @param  {Number}      [params.firstResult]                  Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}      [params.maxResults]                   Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


History.cleanableCaseCount = function (params, done) {
  var url = this.path + '/case-definition/cleanable-case-instance-report/count';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the report results about a case definition and finished case instances relevant to history cleanup
 * This method takes the same parameterers as 'History.cleanableCaseInstanceCount '
 */


History.cleanableCase = function (params, done) {
  var url = this.path + '/case-definition/cleanable-case-instance-report';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the count of the finished historic decision instances, cleanable decision instances and basic decision definition data - id, key, name and version
 * @param  {Object}      [params]
 * @param  {uuid[]}      [params.decisionDefinitionIdIn]           Array of decisionDefinition ids
 * @param  {uuid[]}      [params.decisionDefinitionKeyIn]          Array of decisionDefinition keys
 * @param  {Number}      [params.firstResult]                      Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}      [params.maxResults]                       Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


History.cleanableDecisionCount = function (params, done) {
  var url = this.path + '/decision-definition/cleanable-decision-instance-report/count';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the report results about a decision definition and finished decision instances relevant to history cleanup
 * This method takes the same parameterers as 'History.cleanableDecisionInstanceCount '
 */


History.cleanableDecision = function (params, done) {
  var url = this.path + '/decision-definition/cleanable-decision-instance-report';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the count of report results about historic batch operations relevant to history cleanup
 * @param  {Object}      [params]
 * @param  {Number}      [params.firstResult]                      Pagination of results. Specifies the index of the first result to return.
 * @param  {Number}      [params.maxResults]                       Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 */


History.cleanableBatchCount = function (params, done) {
  var url = this.path + '/batch/cleanable-batch-report/count';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};
/**
 * Query for the report about historic batch operations relevant to history cleanup
 * This method takes the same parameterers as 'History.cleanableBatchCount'
 */


History.cleanableBatch = function (params, done) {
  var url = this.path + '/batch/cleanable-batch-report';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};

History.jobLogList = function (params, done) {
  var url = this.path + '/job-log';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};

History.jobLogCount = function (params, done) {
  var url = this.path + '/job-log/count';

  if (typeof params === 'function') {
    done = params;
    params = {};
  }

  return this.http.get(url, {
    data: params,
    done: done
  });
};

History.externalTaskLogList = helpers.createSimpleGetQueryFunction('/external-task-log');
History.externalTaskLogCount = helpers.createSimpleGetQueryFunction('/external-task-log/count');
module.exports = History;

},{"../abstract-client-resource":4,"../helpers":5}],21:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Incident Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Incident = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Incident.path = 'incident';
/**
 * Query for incidents that fulfill given parameters. The size of the result set can be retrieved by using the get incidents count method.
 *
 * @param  {Object}           params
 *
 * @param  {String}           [params.incidentId]           Restricts to incidents that have the given id.
 *
 * @param  {String}           [params.incidentType]         Restricts to incidents that belong to the given incident type.
 *
 * @param  {String}           [params.incidentMessage]      Restricts to incidents that have the given incident message.
 *
 * @param  {String}           [params.processDefinitionId]  Restricts to incidents that belong to a process definition with the given id.
 *
 * @param  {String}           [params.processInstanceId]    Restricts to incidents that belong to a process instance with the given id.
 *
 * @param  {String}           [params.executionId]          Restricts to incidents that belong to an execution with the given id.
 *
 * @param  {String}           [params.activityId]           Restricts to incidents that belong to an activity with the given id.
 *
 * @param  {String}           [params.causeIncidentId]      Restricts to incidents that have the given incident id as cause incident.
 *
 * @param  {String}           [params.rootCauseIncidentId]  Restricts to incidents that have the given incident id as root cause incident.
 *
 * @param  {String}           [params.configuration]        Restricts to incidents that have the given parameter set as configuration.
 *
 * @param  {String}           [params.sortBy]               Sort the results lexicographically by a given criterion. Valid values are
 *                                                          incidentId, incidentTimestamp, incidentType, executionId, activityId,
 *                                                          processInstanceId, processDefinitionId, causeIncidentId, rootCauseIncidentId
 *                                                          and configuration. Must be used in conjunction with the sortOrder parameter.
 *
 * @param  {String}           [params.sortOrder]            Sort the results in a given order. Values may be asc for ascending order or
 *                                                          desc for descending order. Must be used in conjunction with the sortBy parameter.
 *
 * @param  {String}           [params.firstResult]          Pagination of results. Specifies the
 *                                                          index of the first result to return.
 *
 * @param  {String}           [params.maxResults]           Pagination of results. Specifies the
 *                                                          maximum number of results to return.
 *                                                          Will return less results if there are no
 *                                                          more results left.
 *
 * @param  {RequestCallback}  done
 */

Incident.get = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};
/**
 * Query for the number of incidents that fulfill given parameters. Takes the same parameters as the get incidents method.
 *
 * @param  {Object}           params
 *
 * @param  {String}           [params.incidentId]           Restricts to incidents that have the given id.
 *
 * @param  {String}           [params.incidentType]         Restricts to incidents that belong to the given incident type.
 *
 * @param  {String}           [params.incidentMessage]      Restricts to incidents that have the given incident message.
 *
 * @param  {String}           [params.processDefinitionId]  Restricts to incidents that belong to a process definition with the given id.
 *
 * @param  {String}           [params.processInstanceId]    Restricts to incidents that belong to a process instance with the given id.
 *
 * @param  {String}           [params.executionId]          Restricts to incidents that belong to an execution with the given id.
 *
 * @param  {String}           [params.activityId]           Restricts to incidents that belong to an activity with the given id.
 *
 * @param  {String}           [params.causeIncidentId]      Restricts to incidents that have the given incident id as cause incident.
 *
 * @param  {String}           [params.rootCauseIncidentId]  Restricts to incidents that have the given incident id as root cause incident.
 *
 * @param  {String}           [params.configuration]        Restricts to incidents that have the given parameter set as configuration.
 *
 * @param  {RequestCallback}  done
 */


Incident.count = function (params, done) {
  return this.http.get(this.path + '/count', {
    data: params,
    done: done
  });
};

module.exports = Incident;

},{"./../abstract-client-resource":4}],22:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var JobDefinition = AbstractClientResource.extend();
JobDefinition.path = 'job-definition';

JobDefinition.setRetries = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/retries', {
    data: params,
    done: done
  });
};

JobDefinition.list = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

JobDefinition.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};

module.exports = JobDefinition;

},{"./../abstract-client-resource":4}],23:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Job Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Job = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Job.path = 'job';

Job.get = function (id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};
/**
 * Query for jobs that fulfill given parameters.
 * @param  {Object}   params
 * @param  {String}   [params.jobId]                Filter by job id.
 * @param  {String}   [params.processInstanceId]    Only select jobs which exist for the given process instance.
 * @param  {String}   [params.executionId]          Only select jobs which exist for the given execution.
 * @param  {String}   [params.processDefinitionId]  Filter by the id of the process definition the jobs run on.
 * @param  {String}   [params.processDefinitionKey] Filter by the key of the process definition the jobs run on.
 * @param  {String}   [params.activityId]           Only select jobs which exist for an activity with the given id.
 * @param  {Bool}     [params.withRetriesLeft]      Only select jobs which have retries left.
 * @param  {Bool}     [params.executable]           Only select jobs which are executable, ie. retries > 0 and due date is null or due date is in the past.
 * @param  {Bool}     [params.timers]               Only select jobs that are timers. Cannot be used together with messages.
 * @param  {Bool}     [params.messages]             Only select jobs that are messages. Cannot be used together with timers.
 * @param  {String}   [params.dueDates]             Only select jobs where the due date is lower or higher than the given date. Due date expressions are comma-separated and are structured as follows:
 *                                                  A valid condition value has the form operator_value. operator is the comparison operator to be used and value the date value as string.
 *                                                  Valid operator values are: gt - greater than; lt - lower than.
 *                                                  value may not contain underscore or comma characters.
 * @param  {Bool}     [params.withException]        Only select jobs that failed due to an exception.
 * @param  {String}   [params.exceptionMessage]     Only select jobs that failed due to an exception with the given message.
 * @param  {Bool}     [params.noRetriesLeft]        Only select jobs which have no retries left.
 * @param  {Bool}     [params.active]               Only include active jobs.
 * @param  {Bool}     [params.suspended]            Only include suspended jobs.
 * @param  {Array}    [params.sorting]              A JSON array of criteria to sort the result by. Each element of the array is a JSON object that specifies one ordering. The position in the array identifies the rank of an ordering, i.e. whether it is primary, secondary, etc.
 * @param  {String}   params.sorting.sortBy         Sort the results lexicographically by a given criterion. Valid values are jobId, executionId, processInstanceId, jobRetries and jobDueDate.
 * @param  {String}   params.sorting.sortOrder      Sort the results in a given order. Values may be asc for ascending order or desc for descending order.
 * @param  {String}   [params.firstResult]          Pagination of results. Specifies the index of the first result to return.
 * @param  {String}   [params.maxResults]           Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 * @param  {Function} done
 */


Job.list = function (params, done) {
  var path = this.path; // those parameters have to be passed in the query and not body

  path += '?firstResult=' + (params.firstResult || 0);

  if (params.maxResults) {
    path += '&maxResults=' + params.maxResults;
  }

  return this.http.post(path, {
    data: params,
    done: done
  });
};
/**
 * Sets the retries of the job to the given number of retries.
 * @param  {Object}   params
 * @param  {String}   params.id      The id of the job.
 * @param  {String}   params.retries The number of retries to set that a job has left.
 * @param  {Function} done
 */


Job.setRetries = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/retries', {
    data: params,
    done: done
  });
};

Job["delete"] = function (id, done) {
  return this.http.del(this.path + '/' + id, {
    done: done
  });
};

Job.stacktrace = function (id, done) {
  var url = this.path + '/' + id + '/stacktrace';
  return this.http.get(url, {
    accept: 'text/plain',
    done: done
  });
};
/**
 * Recalculates the duedate for a given job.
 * @param {Object}    params
 * @param {String}    params.id                   The id of the job.Job
 * @param {Bool}      params.creationDateBased    Base recalculation on Job creation date. Default: true
 * @param {Function}  done
 */


Job.recalculateDuedate = function (params, done) {
  var url = this.path + '/' + params.id + '/duedate/recalculate';

  if (params.creationDateBased == false) {
    url += '?creationDateBased=' + params.creationDateBased;
  }

  return this.http.post(url, {
    done: done
  });
};
/**
 * Sets the duedate of the job to the given date.
 * @param  {Object}   params
 * @param  {String}   params.id      The id of the job.
 * @param  {String}   params.duedate The duedate of the job.
 * @param  {Function} done
 */


Job.setDuedate = function (params, done) {
  var url = this.path + '/' + params.id + '/duedate';
  return this.http.put(url, {
    data: params,
    done: done
  });
};

Job.suspended = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/suspended', {
    data: {
      suspended: !!params.suspended
    },
    done: done
  });
};

module.exports = Job;

},{"./../abstract-client-resource":4}],24:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Message Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Message = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Message.path = 'message';
/**
 * correlates a message
 *
 * @param {Object} [params]
 * @param {String} [params.messageName]     The message name of the message to be corrolated
 * @param {String} [params.businessKey]     The business key the workflow instance is to be initialized with. The business key identifies the workflow instance in the context of the given workflow definition.
 * @param {String} [params.correlationKeys]       A JSON object containing the keys the recieve task is to be corrolated with. Each key corresponds to a variable name and each value to a variable value.
 * @param {String} [params.processVariables]       A JSON object containing the variables the recieve task is to be corrolated with. Each key corresponds to a variable name and each value to a variable value.
 */

Message.correlate = function (params, done) {
  var url = this.path + '/';
  return this.http.post(url, {
    data: params,
    done: done
  });
};

module.exports = Message;

},{"./../abstract-client-resource":4}],25:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Job Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Metrics = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Metrics.path = 'metrics';
/**
 * Query for jobs that fulfill given parameters.
 * @param  {Object}   params
 * @param  {String}   [params.name]
 * @param  {String}   [params.startDate]
 * @param  {String}   [params.endDate]
 * @param  {Function} done
 */

Metrics.sum = function (params, done) {
  var path = this.path + '/' + params.name + '/sum';
  delete params.name;
  return this.http.get(path, {
    data: params,
    done: done
  });
};
/**
 * Retrieves a list of metrics, aggregated for a given interval.
 * @param  {Object}   params
 * @param  {String}   params.name          The name of the metric. Supported names: activity-instance-end, job-acquisition-attempt, job-acquired-success, job-acquired-failure, job-execution-rejected, job-successful, job-failed, job-locked-exclusive, executed-decision-elements
 * @param  {String}   [params.reporter]    The name of the reporter (host), on which the metrics was logged.
 * @param  {String}   [params.startDate]   The start date (inclusive).
 * @param  {String}   [params.endDate]     The end date (exclusive).
 * @param  {Integer}  [params.firstResult] The index of the first result, used for paging.
 * @param  {Integer}  [params.maxResults]  The maximum result size of the list which should be returned. The maxResults can't be set larger than 200. Default: 200
 * @param  {Integer}  [params.interval]    The interval for which the metrics should be aggregated. Time unit is seconds. Default: The interval is set to 15 minutes (900 seconds).
 * @param  {Function} done
 */


Metrics.byInterval = function (params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

module.exports = Metrics;

},{"./../abstract-client-resource":4}],26:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Migration Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Migration = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Migration.path = 'migration';
/**
 * Generate a migration plan for a given source and target process definition
 * @param  {Object}   params
 * @param  {String}   [params.sourceProcessDefinitionId]
 * @param  {String}   [params.targetProcessDefinitionId]
 * @param  {Function} done
 */

Migration.generate = function (params, done) {
  var path = this.path + '/generate';
  return this.http.post(path, {
    data: params,
    done: done
  });
};
/**
 * Execute a migration plan
 * @param  {Object}   params
 * @param  {String}   [params.migrationPlan]
 * @param  {String}   [params.processInstanceIds]
 * @param  {Function} done
 */


Migration.execute = function (params, done) {
  var path = this.path + '/execute';
  return this.http.post(path, {
    data: params,
    done: done
  });
};
/**
 * Execute a migration plan asynchronously
 * @param  {Object}   params
 * @param  {String}   [params.migrationPlan]
 * @param  {String}   [params.processInstanceIds]
 * @param  {Function} done
 */


Migration.executeAsync = function (params, done) {
  var path = this.path + '/executeAsync';
  return this.http.post(path, {
    data: params,
    done: done
  });
};

Migration.validate = function (params, done) {
  var path = this.path + '/validate';
  return this.http.post(path, {
    data: params,
    done: done
  });
};

module.exports = Migration;

},{"./../abstract-client-resource":4}],27:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Modification Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Modification = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Modification.path = 'modification';
/**
 * Execute a modification
 * @param  {Object}   params
 * @param  {String}   [params.processDefinitionId]
 * @param  {String}   [params.skipCustomListeners]
 * @param  {String}   [params.skipIoMappings]
 * @param  {String}   [params.processInstanceIds]
 * @param  {String}   [params.processInstanceQuery]
 * @param  {String}   [params.instructions]
 * @param  {String}   [params.annotation]
 * @param  {Function} done
 */

Modification.execute = function (params, done) {
  var path = this.path + '/execute';
  return this.http.post(path, {
    data: params,
    done: done
  });
};
/**
 * Execute a modification asynchronously
 * @param  {Object}   params
 * @param  {String}   [params.processDefinitionId]
 * @param  {String}   [params.skipCustomListeners]
 * @param  {String}   [params.skipIoMappings]
 * @param  {String}   [params.processInstanceIds]
 * @param  {String}   [params.processInstanceQuery]
 * @param  {String}   [params.instructions]
 * @param  {String}   [params.annotation]
 * @param  {Function} done
 */


Modification.executeAsync = function (params, done) {
  var path = this.path + '/executeAsync';
  return this.http.post(path, {
    data: params,
    done: done
  });
};

module.exports = Modification;

},{"./../abstract-client-resource":4}],28:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Password Policy Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var PasswordPolicy = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

PasswordPolicy.path = 'identity/password-policy';
/**
 * Fetch the active password policy.
 *
 * @param {Function} done
 */

PasswordPolicy.get = function (done) {
  return this.http.get(this.path, {
    done: done
  });
};
/**
 * Validate a password against the password policy
 *
 * @param {Object}   [params]
 * @param {String}   [params.password]  Password to be validated
 * @param {Function} done
 */


PasswordPolicy.validate = function (params, done) {
  if (typeof params === 'string') {
    params = {
      password: params
    };
  }

  return this.http.post(this.path, {
    data: params,
    done: done
  });
};

module.exports = PasswordPolicy;

},{"./../abstract-client-resource":4}],29:[function(require,module,exports){
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
'use strict';

var Q = require('q');

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * No-Op callback
 */


function noop() {}
/**
 * Process Definition Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var ProcessDefinition = AbstractClientResource.extend(
/** @lends  CamSDK.client.resource.ProcessDefinition.prototype */
{
  /**
   * Suspends the process definition instance
   *
   * @param  {Object.<String, *>} [params]
   * @param  {requestCallback}    [done]
   */
  suspend: function suspend(params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }

    params = params || {};
    done = done || noop;
    return this.http.post(this.path, {
      done: done
    });
  },

  /**
   * Retrieves the statistics of a process definition.
   *
   * @param  {Function} [done]
   */
  stats: function stats(done) {
    return this.http.post(this.path, {
      done: done || noop
    });
  },

  /**
   * Retrieves the BPMN 2.0 XML document of a process definition.
   *
   * @param  {Function} [done]
   */
  // xml: function(id, done) {
  //   return this.http.post(this.path + +'/xml', {
  //     done: done || noop
  //   });
  // },

  /**
   * Starts a process instance from a process definition.
   *
   * @param  {Object} [varname]
   * @param  {Function} [done]
   */
  start: function start(done) {
    return this.http.post(this.path, {
      data: {},
      done: done
    });
  }
},
/** @lends  CamSDK.client.resource.ProcessDefinition */
{
  /**
   * API path for the process instance resource
   */
  path: 'process-definition',

  /**
   * Retrieve a single process definition
   *
   * @param  {uuid}     id    of the process definition to be requested
   * @param  {Function} done
   */
  get: function get(id, done) {
    // var pointer = '';
    // if (data.key) {
    //   pointer = 'key/'+ data.key;
    // }
    // else if (data.id) {
    //   pointer = data.id;
    // }
    return this.http.get(this.path + '/' + id, {
      done: done
    });
  },

  /**
   * Retrieve a single process definition
   *
   * @param  {String}   key    of the process definition to be requested
   * @param  {Function} done
   */
  getByKey: function getByKey(key, done) {
    return this.http.get(this.path + '/key/' + key, {
      done: done
    });
  },

  /**
   * Get a list of process definitions
   * @param  {Object} params                        Query parameters as follow
   * @param  {String} [params.name]                 Filter by name.
   * @param  {String} [params.nameLike]             Filter by names that the parameter is a substring of.
   * @param  {String} [params.deploymentId]         Filter by the deployment the id belongs to.
   * @param  {String} [params.key]                  Filter by key, i.e. the id in the BPMN 2.0 XML. Exact match.
   * @param  {String} [params.keyLike]              Filter by keys that the parameter is a substring of.
   * @param  {String} [params.category]             Filter by category. Exact match.
   * @param  {String} [params.categoryLike]         Filter by categories that the parameter is a substring of.
   * @param  {String} [params.ver]                  Filter by version.
   * @param  {String} [params.latest]               Only include those process definitions that are latest versions.
   *                                                Values may be "true" or "false".
   * @param  {String} [params.resourceName]         Filter by the name of the process definition resource. Exact match.
   * @param  {String} [params.resourceNameLike]     Filter by names of those process definition resources that the parameter is a substring of.
   * @param  {String} [params.startableBy]          Filter by a user name who is allowed to start the process.
   * @param  {String} [params.active]               Only include active process definitions.
   *                                                Values may be "true" or "false".
   * @param  {String} [params.suspended]            Only include suspended process definitions.
   *                                                Values may be "true" or "false".
   * @param  {String} [params.incidentId]           Filter by the incident id.
   * @param  {String} [params.incidentType]         Filter by the incident type.
   * @param  {String} [params.incidentMessage]      Filter by the incident message. Exact match.
   * @param  {String} [params.incidentMessageLike]  Filter by the incident message that the parameter is a substring of.
   *
   * @param  {String} [params.sortBy]               Sort the results lexicographically by a given criterion.
   *                                                Valid values are category, "key", "id", "name", "version" and "deploymentId".
   *                                                Must be used in conjunction with the "sortOrder" parameter.
   *
   * @param  {String} [params.sortOrder]            Sort the results in a given order.
   *                                                Values may be asc for ascending "order" or "desc" for descending order.
   *                                                Must be used in conjunction with the sortBy parameter.
   *
   * @param  {Integer} [params.firstResult]         Pagination of results. Specifies the index of the first result to return.
   * @param  {Integer} [params.maxResults]          Pagination of results. Specifies the maximum number of results to return.
   *                                                Will return less results, if there are no more results left.
    * @param  {requestCallback} [done]
   *
   * @example
   * CamSDK.resource('process-definition').list({
   *   nameLike: 'Process'
   * }, function(err, results) {
   *   //
   * });
   */
  list: function list() {
    return AbstractClientResource.list.apply(this, arguments);
  },

  /**
   * Get a count of process definitions
   * Same parameters as list
   */
  count: function count() {
    return AbstractClientResource.count.apply(this, arguments);
  },

  /**
   * Fetch the variables of a process definition
   * @param  {Object.<String, *>} data
   * @param  {String}             [data.id]     of the process
   * @param  {String}             [data.key]    of the process
   * @param  {Array}              [data.names]  of variables to be fetched
   * @param  {Function}           [done]
   */
  formVariables: function formVariables(data, done) {
    var pointer = '';
    done = done || noop;

    if (data.key) {
      pointer = 'key/' + data.key;
    } else if (data.id) {
      pointer = data.id;
    } else {
      var err = new Error('Process definition task variables needs either a key or an id.');
      done(err);
      return Q.reject(err);
    }

    var queryData = {
      deserializeValues: data.deserializeValues
    };

    if (data.names) {
      queryData.variableNames = (data.names || []).join(',');
    }

    return this.http.get(this.path + '/' + pointer + '/form-variables', {
      data: queryData,
      done: done
    });
  },

  /**
   * Submit a form to start a process definition
   *
   * @param  {Object.<String, *>} data
   * @param  {String}             [data.key]            start the process-definition with this key
   * @param  {String}             [data.tenantId]       and the this tenant-id
   * @param  {String}             [data.id]             or: start the process-definition with this id
   * @param  {String}             [data.businessKey]    of the process to be set
   * @param  {Array}              [data.variables]      variables to be set
   * @param  {Function}           [done]
   */
  submitForm: function submitForm(data, done) {
    var pointer = '';
    done = done || noop;

    if (data.key) {
      pointer = 'key/' + data.key;

      if (data.tenantId) {
        pointer += '/tenant-id/' + data.tenantId;
      }
    } else if (data.id) {
      pointer = data.id;
    } else {
      return done(new Error('Process definition task variables needs either a key or an id.'));
    }

    return this.http.post(this.path + '/' + pointer + '/submit-form', {
      data: {
        businessKey: data.businessKey,
        variables: data.variables
      },
      done: done
    });
  },

  /**
   * Delete multiple process definitions by key or a single process definition by id
   *
   * @param  {Object.<String, *>} data
   * @param  {String}             [data.key]                        delete the process-definition with this key
   * @param  {String}             [data.tenantId]                   and the this tenant-id
   * @param  {String}             [data.id]                         or: delete the process-definition with this id
   * @param  {Boolean}            [data.cascade]                    All instances, including historic instances,
   *                                                                will also be deleted
   * @param  {Boolean}            [data.skipCustomListeners]        Skip execution listener invocation for
   *                                                                activities that are started or ended
   *                                                                as part of this request.
   * @param  {Function}           [done]
   */
  "delete": function _delete(data, done) {
    done = done || noop;
    var pointer = '';

    if (data.key) {
      pointer = 'key/' + data.key;

      if (data.tenantId) {
        pointer += '/tenant-id/' + data.tenantId;
      }

      pointer += '/delete';
    } else if (data.id) {
      pointer = data.id;
    } else {
      return done(new Error('Process definition deletion needs either a key or an id.'));
    }

    var queryParams = '?';
    var param = 'cascade';

    if (typeof data[param] === 'boolean') {
      queryParams += param + '=' + data[param];
    }

    param = 'skipCustomListeners';

    if (typeof data[param] === 'boolean') {
      if (queryParams.length > 1) {
        queryParams += '&';
      }

      queryParams += param + '=' + data[param];
    }

    param = 'skipIoMappings';

    if (typeof data[param] === 'boolean') {
      if (queryParams.length > 1) {
        queryParams += '&';
      }

      queryParams += param + '=' + data[param];
    }

    return this.http.del(this.path + '/' + pointer + queryParams, {
      done: done
    });
  },

  /**
   * Retrieves the form of a process definition.
   * @param  {Function} [done]
   */
  startForm: function startForm(data, done) {
    var path = this.path + '/' + (data.key ? 'key/' + data.key : data.id) + '/startForm';
    return this.http.get(path, {
      done: done || noop
    });
  },

  /**
   * Retrieves the form of a process definition.
   * @param  {Function} [done]
   */
  xml: function xml(data, done) {
    var path = this.path + '/' + (data.id ? data.id : 'key/' + data.key) + '/xml';
    return this.http.get(path, {
      done: done || noop
    });
  },

  /**
   * Retrieves runtime statistics of a given process definition grouped by activities
   * @param  {Function} [done]
   */
  statistics: function statistics(data, done) {
    var path = this.path;

    if (data.id) {
      path += '/' + data.id;
    } else if (data.key) {
      path += '/key/' + data.key;
    }

    path += '/statistics';
    return this.http.get(path, {
      data: data,
      done: done || noop
    });
  },

  /**
   * Submits the form of a process definition.
   *
   * @param  {Object} [data]
   * @param  {Function} [done]
   */
  submit: function submit(data, done) {
    var path = this.path;

    if (data.key) {
      path += '/key/' + data.key;
    } else {
      path += '/' + data.id;
    }

    path += '/submit-form';
    return this.http.post(path, {
      data: data,
      done: done
    });
  },

  /**
   * Suspends one or more process definitions
   *
   * @param  {String|String[]}    ids
   * @param  {Object.<String, *>} [params]
   * @param  {requestCallback}    [done]
   */
  suspend: function suspend(ids, params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }

    params = params || {};
    done = done || noop; // allows to pass a single ID

    ids = Array.isArray(ids) ? ids : [ids];
    return this.http.post(this.path, {
      done: done
    });
  },

  /**
   * Instantiates a given process definition.
   *
   * @param {Object} [params]
   * @param {String} [params.id]              The id of the process definition to be instantiated. Must be omitted if key is provided.
   * @param {String} [params.key]             The key of the process definition (the latest version thereof) to be instantiated. Must be omitted if id is provided.
   * @param {String} [params.tenantId]				The id of the tenant the process definition belongs to. Must be omitted if id is provided.
   * @param {String} [params.variables]       A JSON object containing the variables the process is to be initialized with. Each key corresponds to a variable name and each value to a variable value.
   * @param {String} [params.businessKey]     The business key the process instance is to be initialized with. The business key uniquely identifies the process instance in the context of the given process definition.
   * @param {String} [params.caseInstanceId]  The case instance id the process instance is to be initialized with.
   */
  start: function start(params, done) {
    var url = this.path + '/';

    if (params.id) {
      url = url + params.id;
    } else {
      url = url + 'key/' + params.key;

      if (params.tenantId) {
        url = url + '/tenant-id/' + params.tenantId;
      }
    }

    return this.http.post(url + '/start', {
      data: params,
      done: done
    });
  },

  /**
   * Instantiates a given process definition.
    * @param {String} [id]                        The id of the process definition to activate or suspend.
   * @param {Object} [params]
   * @param {Number} [params.historyTimeToLive]  New value for historyTimeToLive field of process definition. Can be null.
   */
  updateHistoryTimeToLive: function updateHistoryTimeToLive(id, params, done) {
    var url = this.path + '/' + id + '/history-time-to-live';
    return this.http.put(url, {
      data: params,
      done: done
    });
  },
  restart: function restart(id, params, done) {
    var url = this.path + '/' + id + '/restart';
    return this.http.post(url, {
      data: params,
      done: done
    });
  },
  restartAsync: function restartAsync(id, params, done) {
    var url = this.path + '/' + id + '/restart-async';
    return this.http.post(url, {
      data: params,
      done: done
    });
  }
});
module.exports = ProcessDefinition;

},{"./../abstract-client-resource":4,"q":53}],30:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * Process Instance Resource
 *
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var ProcessInstance = AbstractClientResource.extend(
/** @lends  CamSDK.client.resource.ProcessInstance.prototype */
{},
/** @lends  CamSDK.client.resource.ProcessInstance */
{
  /**
   * API path for the process instance resource
   */
  path: 'process-instance',

  /**
   * Retrieve a single process instance
   *
   * @param  {uuid}     id    of the process instance to be requested
   * @param  {Function} done
   */
  get: function get(id, done) {
    return this.http.get(this.path + '/' + id, {
      done: done
    });
  },

  /**
   * Creates a process instance from a process definition
   *
   * @param  {Object}   params
   * @param  {String}   [params.id]
   * @param  {String}   [params.key]
   * @param  {Object.<String, *>} [params.variables]
   * @param  {requestCallback} [done]
   */
  create: function create(params, done) {
    return this.http.post(params, done);
  },
  list: function list(params, done) {
    var path = this.path; // those parameters have to be passed in the query and not body

    path += '?firstResult=' + (params.firstResult || 0);
    path += '&maxResults=' + (params.maxResults || 15);
    return this.http.post(path, {
      data: params,
      done: done
    });
  },
  count: function count(params, done) {
    var path = this.path + '/count';
    return this.http.post(path, {
      data: params,
      done: done
    });
  },
  getActivityInstances: function getActivityInstances(id, done) {
    return this.http.get(this.path + '/' + id + '/activity-instances', {
      done: done
    });
  },

  /**
   * Post process instance modifications
   * @see http://docs.camunda.org/api-references/rest/#process-instance-modify-process-instance-execution-state-method
   *
   * @param  {Object}           params
   * @param  {UUID}             params.id                     process instance UUID
   *
   * @param  {Array}            params.instructions           Array of instructions
   *
   * @param  {Boolean}          [params.skipCustomListeners]  Skip execution listener invocation for
   *                                                          activities that are started or ended
   *                                                          as part of this request.
   *
   * @param  {Boolean}          [params.skipIoMappings]       Skip execution of input/output
   *                                                          variable mappings for activities that
   *                                                          are started or ended as part of
   *                                                          this request.
   *
   * @param  {String}          [params.annotation]            Add Annotation to the user operation log
   *
   * @param  {requestCallback}  done
   */
  modify: function modify(params, done) {
    return this.http.post(this.path + '/' + params.id + '/modification', {
      data: params,
      done: done
    });
  },
  modifyAsync: function modifyAsync(params, done) {
    return this.http.post(this.path + '/' + params.id + '/modification-async', {
      data: params,
      done: done
    });
  },

  /**
   * Delete multiple process instances asynchronously (batch).
   *
   * @see https://docs.camunda.org/manual/latest/reference/rest/process-instance/post-delete/
   *
   * @param   {Object}            payload
   * @param   {requestCallback}   done
   *
   */
  deleteAsync: function deleteAsync(payload, done) {
    return this.http.post(this.path + '/delete', {
      data: payload,
      done: done
    });
  },

  /**
   * Delete a set of process instances asynchronously (batch) based on a historic process instance query.
   *
   * @see https://docs.camunda.org/manual/latest/reference/rest/process-instance/post-delete-historic-query-based/
   *
   * @param   {Object}            payload
   * @param   {requestCallback}   done
   *
   */
  deleteAsyncHistoricQueryBased: function deleteAsyncHistoricQueryBased(payload, done) {
    return this.http.post(this.path + '/delete-historic-query-based', {
      data: payload,
      done: done
    });
  },

  /**
   * Set retries of jobs belonging to process instances asynchronously (batch).
   *
   * @see https://docs.camunda.org/manual/latest/reference/rest/process-instance/post-set-job-retries
   *
   * @param   {Object}            payload
   * @param   {requestCallback}   done
   *
   */
  setJobsRetriesAsync: function setJobsRetriesAsync(payload, done) {
    return this.http.post(this.path + '/job-retries', {
      data: payload,
      done: done
    });
  },

  /**
   * Create a batch to set retries of jobs asynchronously based on a historic process instance query.
   *
   * @see https://docs.camunda.org/manual/latest/reference/rest/process-instance/post-set-job-retries-historic-query-based
   *
   * @param   {Object}            payload
   * @param   {requestCallback}   done
   *
   */
  setJobsRetriesAsyncHistoricQueryBased: function setJobsRetriesAsyncHistoricQueryBased(payload, done) {
    return this.http.post(this.path + '/job-retries-historic-query-based', {
      data: payload,
      done: done
    });
  },

  /**
   * Activates or suspends process instances asynchronously with a list of process instance ids, a process instance query, and/or a historical process instance query
   *
   * @see https://docs.camunda.org/manual/latest/reference/rest/process-instance/post-activate-suspend-in-batch/
   *
   * @param   {Object}            payload
   * @param   {requestCallback}   done
   */
  suspendAsync: function suspendAsync(payload, done) {
    return this.http.post(this.path + '/suspended-async', {
      data: payload,
      done: done
    });
  },

  /**
   * Sets a variable of a given process instance by id.
   *
   * @see http://docs.camunda.org/manual/develop/reference/rest/process-instance/variables/put-variable/
   *
   * @param   {uuid}              id
   * @param   {Object}            params
   * @param   {requestCallback}   done
   */
  setVariable: function setVariable(id, params, done) {
    var url = this.path + '/' + id + '/variables/' + utils.escapeUrl(params.name);
    return this.http.put(url, {
      data: params,
      done: done
    });
  }
});
module.exports = ProcessInstance;

},{"../../utils":50,"./../abstract-client-resource":4}],31:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Task Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var TaskReport = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

TaskReport.path = 'task/report';
/**
 * Fetch the count of tasks grouped by candidate group.
 *
 * @param {Function} done
 */

TaskReport.countByCandidateGroup = function (done) {
  return this.http.get(this.path + '/candidate-group-count', {
    done: done
  });
};
/**
 * Query for process instance durations report.
 * @param  {Object}   [params]
 * @param  {Object}   [params.reportType]           Must be 'duration'.
 * @param  {Object}   [params.periodUnit]           Can be one of `month` or `quarter`, defaults to `month`
 * @param  {Object}   [params.processDefinitionIn]  Comma separated list of process definition IDs
 * @param  {Object}   [params.startedAfter]         Date after which the process instance were started
 * @param  {Object}   [params.startedBefore]        Date before which the process instance were started
 * @param  {Function} done
 */


TaskReport.countByCandidateGroupAsCsv = function (done) {
  return this.http.get(this.path + '/candidate-group-count', {
    accept: 'text/csv',
    done: done
  });
};

module.exports = TaskReport;

},{"./../abstract-client-resource":4}],32:[function(require,module,exports){
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
'use strict';

var Q = require('q');

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * Task Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Task = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Task.path = 'task';
/**
 * Fetch a list of tasks
 * @param {Object} [params]
 * @param {String} [params.processInstanceId]               Restrict to tasks that belong to process instances with the given id.
 * @param {String} [params.processInstanceBusinessKey]      Restrict to tasks that belong to process instances with the given business key.
 * @param {String} [params.processInstanceBusinessKeyLike]  Restrict to tasks that have a process instance business key that has the parameter value as a substring.
 * @param {String} [params.processDefinitionId]             Restrict to tasks that belong to a process definition with the given id.
 * @param {String} [params.processDefinitionKey]            Restrict to tasks that belong to a process definition with the given key.
 * @param {String} [params.processDefinitionName]           Restrict to tasks that belong to a process definition with the given name.
 * @param {String} [params.processDefinitionNameLike]       Restrict to tasks that have a process definition name that has the parameter value as a substring.
 * @param {String} [params.executionId]                     Restrict to tasks that belong to an execution with the given id.
 * @param {String} [params.activityInstanceIdIn]            Only include tasks which belongs to one of the passed and comma-separated activity instance ids.
 * @param {String} [params.assignee]                        Restrict to tasks that the given user is assigned to.
 * @param {String} [params.assigneeLike]                    Restrict to tasks that have an assignee that has the parameter value as a substring.
 * @param {String} [params.owner]                           Restrict to tasks that the given user owns.
 * @param {String} [params.candidateGroup]                  Only include tasks that are offered to the given group.
 * @param {String} [params.candidateUser]                   Only include tasks that are offered to the given user.
 * @param {String} [params.involvedUser]                    Only include tasks that the given user is involved in.
 *                                                          A user is involved in a task if there exists an identity link between task and user (e.g. the user is the assignee).
 * @param {String} [params.unassigned]                      If set to true, restricts the query to all tasks that are unassigned.
 * @param {String} [params.taskDefinitionKey]               Restrict to tasks that have the given key.
 * @param {String} [params.taskDefinitionKeyLike]           Restrict to tasks that have a key that has the parameter value as a substring.
 * @param {String} [params.name]                            Restrict to tasks that have the given name.
 * @param {String} [params.nameLike]                        Restrict to tasks that have a name with the given parameter value as substring.
 * @param {String} [params.description]                     Restrict to tasks that have the given description.
 * @param {String} [params.descriptionLike]                 Restrict to tasks that have a description that has the parameter value as a substring.
 * @param {String} [params.priority]                        Restrict to tasks that have the given priority.
 * @param {String} [params.maxPriority]                     Restrict to tasks that have a lower or equal priority.
 * @param {String} [params.minPriority]                     Restrict to tasks that have a higher or equal priority.
 * @param {String} [params.due]                             Restrict to tasks that are due on the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.dueAfter]                        Restrict to tasks that are due after the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.dueBefore]                       Restrict to tasks that are due before the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.followUp]                        Restrict to tasks that have a followUp date on the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.followUpAfter]                   Restrict to tasks that have a followUp date after the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.followUpBefore]                  Restrict to tasks that have a followUp date before the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.created]                         Restrict to tasks that were created on the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.createdAfter]                    Restrict to tasks that were created after the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.createdBefore]                   Restrict to tasks that were created before the given date.
 *                                                          The date must have the format yyyy-MM-dd'T'HH:mm:ss, so for example 2013-01-23T14:42:45 is valid.
 * @param {String} [params.delegationState]                 Restrict to tasks that are in the given delegation state.
 *                                                          Valid values are "PENDING" and "RESOLVED".
 * @param {String} [params.candidateGroups]                 Restrict to tasks that are offered to any of the given candidate groups. Takes a comma-separated list of group names, so for example developers,support,sales.
 * @param {String} [params.active]                          Only include active tasks. Values may be true or false. suspended Only include suspended tasks.
 *                                                          Values may be "true" or "false".
 * @param {String} [params.taskVariables]                   Only include tasks that have variables with certain values. Variable tasking expressions are comma-separated and are structured as follows:
 *                                                          A valid parameter value has the form key_operator_value. key is the variable name, op is the comparison operator to be used and value the variable value. Note: Values are always treated as String objects on server side. Valid operator values are: eq - equals; neq - not equals; gt - greater than; gteq - greater than or equals; lt - lower than; lteq - lower than or equals; like. key and value may not contain underscore or comma characters.
 * @param {String} [params.processVariables]                Only include tasks that belong to process instances that have variables with certain values.
 *                                                          Variable tasking expressions are comma-separated and are structured as follows:
 *                                                          A valid parameter value has the form key_operator_value. "key" is the variable name, "op" is the comparison operator to be used and value the variable value.
 *                                                          Note: Values are always treated as String objects on server side.
 *                                                          Valid operator values are: "eq" - equals; "neq" - not equals; "gt" - greater than; "gteq" - greater than or equals; "lt" - lower than; "lteq" - lower than or equals; like.
 *                                                          "key" and "value" may not contain underscore or comma characters.
 *
 * @param {String} [params.sortBy]                          Sort the results lexicographically by a given criterion.
 *                                                          Valid values are "instanceId", "dueDate", "executionId", "assignee", "created", "description", "id", "name" and "priority".
 *                                                          Must be used in conjunction with the sortOrder parameter.
 * @param {String} [params.sortOrder]                       Sort the results in a given order. Values may be "asc" for ascending order or "desc" for descending order.
 *                                                          Must be used in conjunction with the sortBy parameter.
 *
 * @param {String} [params.firstResult]                     Pagination of results. Specifies the index of the first result to return.
 * @param {String} [params.maxResults]                      Pagination of results. Specifies the maximum number of results to return.
 *                                                          Will return less results, if there are no more results left.
 * @param {Function} done
 */

Task.list = function (params, _done) {
  _done = _done || noop;
  var deferred = Q.defer();
  this.http.get(this.path, {
    data: params,
    done: function done(err, data) {
      if (err) {
        _done(err);

        return deferred.reject(err);
      }

      if (data._embedded) {
        // to ease the use of task data, we compile them here
        var tasks = data._embedded.task || data._embedded.tasks;
        var procDefs = data._embedded.processDefinition;

        for (var t in tasks) {
          var task = tasks[t];
          task._embedded = task._embedded || {};

          for (var p in procDefs) {
            if (procDefs[p].id === task.processDefinitionId) {
              task._embedded.processDefinition = [procDefs[p]];
              break;
            }
          }
        }
      }

      _done(null, data);

      deferred.resolve(data);
    }
  });
  return deferred.promise;
};
/**
 * Retrieve a single task
 * @param  {uuid}     taskId   of the task to be requested
 * @param  {Function} done
 */


Task.get = function (taskId, done) {
  return this.http.get(this.path + '/' + taskId, {
    done: done
  });
};
/**
 * Retrieve the comments for a single task
 * @param  {uuid}     taskId   of the task for which the comments are requested
 * @param  {Function} done
 */


Task.comments = function (taskId, done) {
  return this.http.get(this.path + '/' + taskId + '/comment', {
    done: done
  });
};
/**
 * Retrieve the identity links for a single task
 * @param  {uuid}     taskId   of the task for which the identity links are requested
 * @param  {Function} done
 */


Task.identityLinks = function (taskId, done) {
  return this.http.get(this.path + '/' + taskId + '/identity-links', {
    done: done
  });
};
/**
 * Add an identity link to a task
 * @param  {uuid}     taskId          of the task for which the identity link is created
 * @param  {Object} [params]
 * @param  {String} [params.userId]   The id of the user to link to the task. If you set this parameter, you have to omit groupId
 * @param  {String} [params.groupId]  The id of the group to link to the task. If you set this parameter, you have to omit userId
 * @param  {String} [params.type]     Sets the type of the link. Must be provided
 * @param  {Function} done
 */


Task.identityLinksAdd = function (taskId, params, done) {
  if (arguments.length === 2) {
    done = arguments[1];
    params = arguments[0];
    taskId = params.id;
  }

  return this.http.post(this.path + '/' + taskId + '/identity-links', {
    data: params,
    done: done
  });
};
/**
 * Removes an identity link from a task.
 * @param  {uuid}     taskId          The id of the task to remove a link from
 * @param  {Object} [params]
 * @param  {String} [params.userId]   The id of the user being part of the link. If you set this parameter, you have to omit groupId.
 * @param  {String} [params.groupId]  The id of the group being part of the link. If you set this parameter, you have to omit userId.
 * @param  {String} [params.type]     Specifies the type of the link. Must be provided.
 * @param  {Function} done
 */


Task.identityLinksDelete = function (taskId, params, done) {
  if (arguments.length === 2) {
    done = arguments[1];
    params = arguments[0];
    taskId = params.id;
  }

  return this.http.post(this.path + '/' + taskId + '/identity-links/delete', {
    data: params,
    done: done
  });
};
/**
 * Create a comment for a task.
 *
 * @param  {String}   taskId  The id of the task to add the comment to.
 * @param  {String}   message The message of the task comment to create.
 * @param  {Function} done
 */


Task.createComment = function (taskId, message, done) {
  return this.http.post(this.path + '/' + taskId + '/comment/create', {
    data: {
      message: message
    },
    done: done
  });
};
/**
 * Creates a task
 *
 * @param  {Object}   task   is an object representation of a task
 * @param  {Function} done
 */


Task.create = function (task, done) {
  return this.http.post(this.path + '/create', {
    data: task,
    done: done
  });
};
/**
 * Update a task
 *
 * @param  {Object}   task   is an object representation of a task
 * @param  {Function} done
 */


Task.update = function (task, done) {
  return this.http.put(this.path + '/' + task.id, {
    data: task,
    done: done
  });
}; // /**
//  * Save a task
//  *
//  * @see Task.create
//  * @see Task.update
//  *
//  * @param  {Object}   task   is an object representation of a task, if it has
//  *                             an id property, the task will be updated, otherwise created
//  * @param  {Function} done
//  */
// Task.save = function(task, done) {
//   return Task[task.id ? 'update' : 'create'](task, done);
// };

/**
 * Change the assignee of a task to a specific user.
 *
 * Note: The difference with claim a task is that
 * this method does not check if the task already has a user assigned to it
 *
 * Note: The response of this call is empty.
 *
 * @param  {String}   taskId
 * @param  {String}   userId
 * @param  {Function} done
 */


Task.assignee = function (taskId, userId, done) {
  var data = {
    userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path + '/' + taskId + '/assignee', {
    data: data,
    done: done
  });
};
/**
 * Delegate a task to another user.
 *
 * Note: The response of this call is empty.
 *
 * @param  {String}   taskId
 * @param  {String}   userId
 * @param  {Function} done
 */


Task.delegate = function (taskId, userId, done) {
  var data = {
    userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path + '/' + taskId + '/delegate', {
    data: data,
    done: done
  });
};
/**
 * Claim a task for a specific user.
 *
 * Note: The difference with set a assignee is that
 * here a check is performed to see if the task already has a user assigned to it.
 *
 * Note: The response of this call is empty.
 *
 * @param  {String}   taskId
 * @param  {String}   userId
 * @param  {Function} done
 */


Task.claim = function (taskId, userId, done) {
  var data = {
    userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path + '/' + taskId + '/claim', {
    data: data,
    done: done
  });
};
/**
 * Resets a task's assignee. If successful, the task is not assigned to a user.
 *
 * Note: The response of this call is empty.
 *
 * @param  {String}   taskId
 * @param  {Function} done
 */


Task.unclaim = function (taskId, done) {
  if (typeof taskId !== 'string') {
    taskId = taskId.taskId;
  }

  return this.http.post(this.path + '/' + taskId + '/unclaim', {
    done: done
  });
};
/**
 * Complete a task and update process variables using a form submit.
 * There are two difference between this method and the complete method:
 *
 * If the task is in state PENDING - ie. has been delegated before,
 * it is not completed but resolved. Otherwise it will be completed.
 *
 * If the task has Form Field Metadata defined,
 * the process engine will perform backend validation for any form fields which have validators defined.
 * See the Generated Task Forms section of the User Guide for more information.
 *
 * @param  {Object}   data
 * @param  {Function} done
 */


Task.submitForm = function (data, done) {
  done = done || noop;

  if (!data.id) {
    var err = new Error('Task submitForm needs a task id.');
    done(err);
    return Q.reject(err);
  }

  return this.http.post(this.path + '/' + data.id + '/submit-form', {
    data: {
      variables: data.variables
    },
    done: done
  });
};
/**
 * Complete a task and update process variables.
 *
 * @param  {object}             [params]
 * @param  {uuid}               [params.id]           Id of the task. This value is mandatory.
 * @param  {Object.<String, *>} [params.variables]    Process variables which need to be updated.
 * @param  {Function} done
 */


Task.complete = function (params, done) {
  done = done || noop;

  if (!params.id) {
    var err = new Error('Task complete needs a task id.');
    done(err);
    return Q.reject(err);
  }

  return this.http.post(this.path + '/' + params.id + '/complete', {
    data: {
      variables: params.variables
    },
    done: done
  });
};
/**
 * Reports an escalation in the context of a running task by id.
 *
 * @param  {Object}             [data]
 * @param  {uuid}               [data.id]             Id of the task. This value is mandatory.
 * @param  {String}             [data.escalationCode] An escalation code that indicates the predefined escalation. This value is mandatory.
 * @param  {Object.<String, *>} [data.variables]      Process variables which need to be updated.
 * @param  {Function}           done
 */


Task.bpmnEscalation = function (data, done) {
  done = done || noop;

  if (!data.id || !data.escalationCode) {
    var err = new Error('Task bpmnEscalation needs a task id and escalation code.');
    done(err);
    return Q.reject(err);
  }

  return this.http.post(this.path + '/' + data.id + '/bpmnEscalation', {
    data: {
      escalationCode: data.escalationCode,
      variables: data.variables
    },
    done: done
  });
};
/**
 * Reports an error in the context of a running task by id.
 *
 * @param  {Object}             [data]
 * @param  {uuid}               [data.id]           Id of the task. This value is mandatory.
 * @param  {String}             [data.errorCode]    An error code that indicates the predefined error. This value is mandatory.
 * @param  {String}             [data.errorMessage] An error message that describes the error.
 * @param  {Object.<String, *>} [data.variables]    Process variables which need to be updated.
 * @param  {Function}           done
 */


Task.bpmnError = function (data, done) {
  done = done || noop;

  if (!data.id || !data.errorCode) {
    var err = new Error('Task bpmnError needs a task id and error code.');
    done(err);
    return Q.reject(err);
  }

  return this.http.post(this.path + '/' + data.id + '/bpmnError', {
    data: {
      variables: data.variables,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage
    },
    done: done
  });
};

Task.formVariables = function (data, done) {
  done = done || noop;
  var pointer = '';

  if (data.key) {
    pointer = 'key/' + data.key;
  } else if (data.id) {
    pointer = data.id;
  } else {
    var err = new Error('Task variables needs either a key or an id.');
    done(err);
    return Q.reject(err);
  }

  var queryData = {
    deserializeValues: data.deserializeValues
  };

  if (data.names) {
    queryData.variableNames = data.names.join(',');
  }

  return this.http.get(this.path + '/' + pointer + '/form-variables', {
    data: queryData,
    done: done
  });
};
/**
 * Retrieve the form for a single task
 * @param  {uuid}     taskId   of the task for which the form is requested
 * @param  {Function} done
 */


Task.form = function (taskId, done) {
  return this.http.get(this.path + '/' + taskId + '/form', {
    done: done
  });
};
/**
 * Sets a variable in the context of a given task.
 * @param {Object} [params]
 * @param {String} [params.id]         The id of the task to set the variable for.
 * @param {String} [params.varId]      The name of the variable to set.
 * @param {String} [params.value]      The variable's value. For variables of type Object, the serialized value has to be submitted as a String value.
 * @param {String} [params.type]       The value type of the variable.
 * @param {String} [params.valueInfo]  A JSON object containing additional, value-type-dependent properties.
 * @param {Function} done
 */


Task.localVariable = function (params, done) {
  return this.http.put(this.path + '/' + params.id + '/localVariables/' + params.varId, {
    data: params,
    done: done
  });
};
/**
 * Retrieve the local variables for a single task
 * @param  {uuid}     taskId   of the task for which the variables are requested
 * @param  {Function} done
 */


Task.localVariables = function (taskId, done) {
  return this.http.get(this.path + '/' + taskId + '/localVariables', {
    done: done
  });
};
/**
 * Updates or deletes the variables in the context of a task.
 * Updates precede deletions.
 * So, if a variable is updated AND deleted, the deletion overrides the update.
 */


Task.modifyVariables = function (data, done) {
  return this.http.post(this.path + '/' + data.id + '/localVariables', {
    data: data,
    done: done
  });
};
/**
 * Removes a local variable from a task.
 */


Task.deleteVariable = function (data, done) {
  return this.http.del(this.path + '/' + data.id + '/localVariables/' + utils.escapeUrl(data.varId), {
    done: done
  });
};

module.exports = Task;

},{"../../utils":50,"./../abstract-client-resource":4,"q":53}],33:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Telemetry Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Telemetry = AbstractClientResource.extend();
/**
 * API path for the process definition resource
 * @type {String}
 */

Telemetry.path = 'telemetry';
/**
 * Fetches the telemetry configuration.
 *
 * @param  {Function} done
 */

Telemetry.get = function (done) {
  return this.http.get(this.path + '/configuration', {
    done: done
  });
};
/**
 * Configures whether Camunda receives data collection of the process engine setup and usage.
 *
 * @param  {Object}   payload                  is an object representation of an authorization
 * @param  {Boolean}  payload.enableTelemetry  Specifies if the data collection should be sent or not.
 * @param  {Function} done
 */


Telemetry.configure = function (payload, done) {
  if (typeof payload === 'boolean') {
    payload = {
      'enableTelemetry': payload
    };
  }

  return this.http.post(this.path + '/configuration', {
    data: payload,
    done: done
  });
};

module.exports = Telemetry;

},{"./../abstract-client-resource":4}],34:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * Group Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Tenant = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Tenant.path = 'tenant';
/**
 * Creates a tenant
 *
 * @param  {Object}   tenant       is an object representation of a group
 * @param  {String}   tenant.id
 * @param  {String}   tenant.name
 * @param  {Function} done
 */

Tenant.create = function (options, done) {
  return this.http.post(this.path + '/create', {
    data: options,
    done: done || noop
  });
};
/**
 * Query for tenants using a list of parameters and retrieves the count
 *
 * @param {String} [options.id]           Filter by the id of the tenant.
 * @param {String} [options.name]         Filter by the name of the tenant.
 * @param {String} [options.nameLike]     Filter by the name that the parameter is a substring of.
 * @param {String} [options.userMember]   Only retrieve tenants where the given user id is a member of.
 * @param {String} [options.groupMember]  Only retrieve tenants where the given group id is a member of.
 * @param  {Function} done
 */


Tenant.count = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  return this.http.get(this.path + '/count', {
    data: options,
    done: done || noop
  });
};
/**
 * Retrieves a single tenant
 *
 * @param  {String} [options.id]    The id of the tenant, can be a property (id) of an object
 * @param  {Function} done
 */


Tenant.get = function (options, done) {
  var id;

  if (typeof options === 'string') {
    id = options;
    options = {};
  } else {
    id = options.id;
    delete options.id;
  }

  return this.http.get(this.path + '/' + utils.escapeUrl(id), {
    data: options,
    done: done || noop
  });
};
/**
 * Query for a list of tenants using a list of parameters.
 * The size of the result set can be retrieved by using the get tenants count method
 *
 * @param {String} [options.id]           Filter by the id of the tenant.
 * @param {String} [options.name]         Filter by the name of the tenant.
 * @param {String} [options.nameLike]     Filter by the name that the parameter is a substring of.
 * @param {String} [options.userMember]   Only retrieve tenants where the given user id is a member of.
 * @param {String} [options.grouprMember] Only retrieve tenants where the given group id is a member of.
 * @param {String} [options.sortBy]       Sort the results lexicographically by a given criterion.
 *                                        Valid values are id and name.
 *                                        Must be used in conjunction with the sortOrder parameter.
 * @param {String} [options.sortOrder]    Sort the results in a given order.
 *                                        Values may be asc for ascending order or desc for descending order.
 *                                        Must be used in conjunction with the sortBy parameter.
 * @param {String} [options.firstResult]  Pagination of results.
 *                                        Specifies the index of the first result to return.
 * @param {String} [options.maxResults]   Pagination of results.
 *                                        Specifies the maximum number of results to return.
 *                                        Will return less results if there are no more results left.
 *
 * @param  {Function} done
 */


Tenant.list = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  return this.http.get(this.path, {
    data: options,
    done: done || noop
  });
};
/**
 * Add a user member to a tenant
 *
 * @param {String} [options.id]       The id of the tenant
 * @param {String} [options.userId]   The id of user to add to the tenant
 * @param  {Function} done
 */


Tenant.createUserMember = function (options, done) {
  return this.http.put(this.path + '/' + utils.escapeUrl(options.id) + '/user-members/' + utils.escapeUrl(options.userId), {
    data: options,
    done: done || noop
  });
};
/**
 * Add a group member to a tenant
 *
 * @param {String} [options.id]       The id of the tenant
 * @param {String} [options.groupId]   The id of group to add to the tenant
 * @param  {Function} done
 */


Tenant.createGroupMember = function (options, done) {
  return this.http.put(this.path + '/' + utils.escapeUrl(options.id) + '/group-members/' + utils.escapeUrl(options.groupId), {
    data: options,
    done: done || noop
  });
};
/**
 * Removes a user member of a tenant
 *
 * @param {String} [options.id]       The id of the tenant
 * @param {String} [options.userId]   The id of user to add to the tenant
 * @param  {Function} done
 */


Tenant.deleteUserMember = function (options, done) {
  return this.http.del(this.path + '/' + utils.escapeUrl(options.id) + '/user-members/' + utils.escapeUrl(options.userId), {
    data: options,
    done: done || noop
  });
};
/**
 * Removes a group member of a Tenant
 *
 * @param {String} [options.id]       The id of the tenant
 * @param {String} [options.groupId]   The id of group to add to the tenant
 * @param  {Function} done
 */


Tenant.deleteGroupMember = function (options, done) {
  return this.http.del(this.path + '/' + utils.escapeUrl(options.id) + '/group-members/' + utils.escapeUrl(options.groupId), {
    data: options,
    done: done || noop
  });
};
/**
 * Update a tenant
 *
 * @param  {Object}   tenant   is an object representation of a tenant
 * @param  {Function} done
 */


Tenant.update = function (options, done) {
  return this.http.put(this.path + '/' + utils.escapeUrl(options.id), {
    data: options,
    done: done || noop
  });
};
/**
 * Delete a tenant
 *
 * @param  {Object}   tenant   is an object representation of a tenant
 * @param  {Function} done
 */


Tenant["delete"] = function (options, done) {
  return this.http.del(this.path + '/' + utils.escapeUrl(options.id), {
    data: options,
    done: done || noop
  });
};

Tenant.options = function (options, done) {
  var id;

  if (typeof options === 'function') {
    done = options;
    id = '';
  } else {
    id = typeof options === 'string' ? options : options.id;

    if (id === undefined) {
      id = '';
    }
  }

  return this.http.options(this.path + '/' + utils.escapeUrl(id), {
    done: done || noop,
    headers: {
      Accept: 'application/json'
    }
  });
};

module.exports = Tenant;

},{"../../utils":50,"./../abstract-client-resource":4}],35:[function(require,module,exports){
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
'use strict';

var Q = require('q');

var AbstractClientResource = require('./../abstract-client-resource');

var utils = require('../../utils');
/**
 * No-Op callback
 */


function noop() {}
/**
 * User Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var User = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

User.path = 'user';
/**
 * Check resource access
 * @param  {Object}   options
 * @param  {String}   options.id
 * @param  {Function} done
 */

User.options = function (options, done) {
  var id;

  if (typeof options === 'function') {
    done = options;
    id = '';
  } else {
    id = typeof options === 'string' ? options : options.id;

    if (id === undefined) {
      id = '';
    }
  }

  return this.http.options(this.path + '/' + utils.escapeUrl(id), {
    done: done || noop,
    headers: {
      Accept: 'application/json'
    }
  });
};
/**
 * Creates a user
 * @param  {Object}   options
 * @param  {String}   options.id
 * @param  {String}   options.password
 * @param  {String}   options.firstName
 * @param  {String}   options.lastName
 * @param  {String}   [options.email]
 * @param  {Function} done
 */


User.create = function (options, done) {
  options = options || {};
  done = done || noop;
  var required = ['id', 'firstName', 'lastName', 'password'];

  for (var r in required) {
    var name = required[r];

    if (!options[name]) {
      var err = new Error('Missing ' + name + ' option to create user');
      done(err);
      return Q.reject(err);
    }
  }

  var data = {
    profile: {
      id: options.id,
      firstName: options.firstName,
      lastName: options.lastName
    },
    credentials: {
      password: options.password
    }
  };

  if (options.email) {
    data.profile.email = options.email;
  }

  return this.http.post(this.path + '/create', {
    data: data,
    done: done
  });
};
/**
 * List users
 * @param {Object} [options]
 * @param {String} [options.id]            Filter by the id of the user.
 * @param {String} [options.firstName]     Filter by the firstname of the user.
 * @param {String} [options.firstNameLike] Filter by the firstname that the parameter is a substring of.
 * @param {String} [options.lastName]      Filter by the lastname of the user.
 * @param {String} [options.lastNameLike]  Filter by the lastname that the parameter is a substring of.
 * @param {String} [options.email]         Filter by the email of the user.
 * @param {String} [options.emailLike]     Filter by the email that the parameter is a substring of.
 * @param {String} [options.memberOfGroup] Filter for users which are members of a group.
 * @param {String} [options.sortBy]        Sort the results lexicographically by a given criterion. Valid values are userId, firstName, lastName and email. Must be used in conjunction with the sortOrder parameter.
 * @param {String} [options.sortOrder]     Sort the results in a given order. Values may be asc for ascending order or desc for descending order. Must be used in conjunction with the sortBy parameter.
 * @param {String} [options.firstResult]   Pagination of results. Specifies the index of the first result to return.
 * @param {String} [options.maxResults]    Pagination of results. Specifies the maximum number of results to return. Will return less results if there are no more results left.
 * @param  {Function} done
 */


User.list = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  return this.http.get(this.path, {
    data: options,
    done: done || noop
  });
};
/**
 * Count the amount of users
 * @param {String} [options.id]            id of the user.
 * @param {String} [options.firstName]     firstname of the user.
 * @param {String} [options.firstNameLike] firstname that the parameter is a substring of.
 * @param {String} [options.lastName]      lastname of the user.
 * @param {String} [options.lastNameLike]  lastname that the parameter is a substring of.
 * @param {String} [options.email]         email of the user.
 * @param {String} [options.emailLike]     email that the parameter is a substring of.
 * @param {String} [options.memberOfGroup] users which are members of a group.
 * @param  {Function} done
 */


User.count = function (options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  } else {
    options = options || {};
  }

  return this.http.get(this.path + '/count', {
    data: options,
    done: done || noop
  });
};
/**
 * Get the profile of a user
 * @param  {Object|uuid}  options
 * @param  {uuid}         options.id
 * @param  {Function} done
 */


User.profile = function (options, done) {
  var id = typeof options === 'string' ? options : options.id;
  return this.http.get(this.path + '/' + utils.escapeUrl(id) + '/profile', {
    done: done || noop
  });
};
/**
 * Updates the profile of a user
 * @param  {Object}   options
 * @param  {uuid}     options.id id of the user to be updated
 * @param  {String}   [options.firstName]
 * @param  {String}   [options.lastName]
 * @param  {String}   [options.email]
 * @param  {Function} done
 */


User.updateProfile = function (options, done) {
  options = options || {};
  done = done || noop;

  if (!options.id) {
    var err = new Error('Missing id option to update user profile');
    done(err);
    return Q.reject(err);
  }

  return this.http.put(this.path + '/' + utils.escapeUrl(options.id) + '/profile', {
    data: options,
    done: done
  });
};
/**
 * Update the credentials of a user
 * @param {Object} options
 * @param {uuid} options.id                           The user's (who will be updated) id
 * @param {String} options.password                     The user's new password.
 * @param {String} [options.authenticatedUserPassword]  The password of the authenticated user who changes the password of the user (ie. the user with passed id as path parameter).
 * @param  {Function} done
 */


User.updateCredentials = function (options, done) {
  options = options || {};
  done = done || noop;
  var err;

  if (!options.id) {
    err = new Error('Missing id option to update user credentials');
    done(err);
    return Q.reject(err);
  }

  if (!options.password) {
    err = new Error('Missing password option to update user credentials');
    done(err);
    return Q.reject(err);
  }

  var data = {
    password: options.password
  };

  if (options.authenticatedUserPassword) {
    data.authenticatedUserPassword = options.authenticatedUserPassword;
  }

  return this.http.put(this.path + '/' + utils.escapeUrl(options.id) + '/credentials', {
    data: data,
    done: done
  });
};
/**
 * Delete a user
 * @param  {Object|uuid} options You can either pass an object (with at least a id property) or the id of the user to be deleted
 * @param  {uuid} options.id
 * @param  {Function} done
 */


User["delete"] = function (options, done) {
  var id = typeof options === 'string' ? options : options.id;
  return this.http.del(this.path + '/' + utils.escapeUrl(id), {
    done: done || noop
  });
};
/**
 * Unlock a user
 * @param  {Object|uuid} options You can either pass an object (with at least a id property) or the id of the user to be unlocked
 * @param  {uuid} options.id
 * @param  {Function} done
 */


User.unlock = function (options, done) {
  var id = typeof options === 'string' ? options : options.id;
  return this.http.post(this.path + '/' + utils.escapeUrl(id) + '/unlock', {
    done: done || noop
  });
};

module.exports = User;

},{"../../utils":50,"./../abstract-client-resource":4,"q":53}],36:[function(require,module,exports){
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
'use strict';

var AbstractClientResource = require('./../abstract-client-resource');
/**
 * Variable Resource
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */


var Variable = AbstractClientResource.extend();
/**
 * Path used by the resource to perform HTTP queries
 * @type {String}
 */

Variable.path = 'variable-instance';
/**
 * Get variable instances
 *
 * @param  {Object}           params
 *
 * @param  {String}           [params.variableName]         Filter by variable instance name.
 *
 * @param  {String}           [params.variableNameLike]     Filter by the variable instance name.
 *                                                          The parameter can include the wildcard %
 *                                                          to express like-strategy such as:
 *                                                          - starts with (%name)
 *                                                          - ends with (name%)
 *                                                          - contains (%name%).
 *
 * @param  {String[]}         [params.processInstanceIdIn]  Only include variable instances which
 *                                                          belong to one of the passed and
 *                                                          comma-separated process instance ids.
 *
 * @param  {String[]}         [params.executionIdIn]        Only include variable instances which
 *                                                          belong to one of the passed and
 *                                                          comma-separated execution ids.
 *
 * @param  {String[]}         [params.caseInstanceIdIn]     Only include variable instances which
 *                                                          belong to one of the passed
 *                                                          case instance ids.
 *
 * @param  {String[]}         [params.caseExecutionIdIn]    Only include variable instances which
 *                                                          belong to one of the passed
 *                                                          case execution ids.
 *
 * @param  {String[]}         [params.taskIdIn]             Only include variable instances which
 *                                                          belong to one of the passed and
 *                                                          comma-separated task ids.
 *
 * @param  {String[]}         [params.activityInstanceIdIn] Only include variable instances which
 *                                                          belong to one of the passed and
 *                                                          comma-separated activity instance ids.
 *
 * @param  {String}           [params.variableValues]       Only include variable instances that
 *                                                          have the certain values. Value filtering
 *                                                          expressions are comma-separated and are
 *                                                          structured as follows:
 *                                                          A valid parameter value has the form
 *                                                          key_operator_value.
 *                                                          key is the variable name,
 *                                                          operator is the comparison operator to
 *                                                          be used and value the variable value.
 *                                                          *Note*: Values are always treated as
 *                                                          String objects on server side.
 *                                                          Valid operator values are:
 *                                                          - eq - equal to
 *                                                          - neq - not equal to
 *                                                          - gt - greater than
 *                                                          - gteq - greater than or equal to
 *                                                          - lt - lower than
 *                                                          - lteq - lower than or equal to
 *                                                          key and value may not contain underscore
 *                                                          or comma characters.
 *
 * @param  {String}           [params.sortBy]               Sort the results lexicographically by a
 *                                                          given criterion. Valid values are
 *                                                          variableName, variableType and
 *                                                          activityInstanceId.
 *                                                          Must be used in conjunction with the
 *                                                          sortOrder parameter.
 *
 * @param  {String}           [params.sortOrder]            Sort the results in a given order.
 *                                                          Values may be asc for ascending order or
 *                                                          desc for descending order.
 *                                                          Must be used in conjunction with the
 *                                                          sortBy parameter.
 *
 * @param  {String}           [params.firstResult]          Pagination of results. Specifies the
 *                                                          index of the first result to return.
 *
 * @param  {String}           [params.maxResults]           Pagination of results. Specifies the
 *                                                          maximum number of results to return.
 *                                                          Will return less results if there are no
 *                                                          more results left.
 *
 * @param  {String}           [params.deserializeValues]    Determines whether serializable variable
 *                                                          values (typically variables that store
 *                                                          custom Java objects) should be
 *                                                          deserialized on server side
 *                                                          (default true).
 *                                                          If set to true, a serializable variable
 *                                                          will be deserialized on server side and
 *                                                          transformed to JSON using
 *                                                          Jackson's POJO/bean property
 *                                                          introspection feature.
 *                                                          Note that this requires the Java classes
 *                                                          of the variable value to be on the
 *                                                          REST API's classpath.
 *                                                          If set to false, a serializable variable
 *                                                          will be returned in its serialized
 *                                                          format.
 *                                                          For example, a variable that is
 *                                                          serialized as XML will be returned as a
 *                                                          JSON string containing XML.
 *                                                          Note:While true is the default value for
 *                                                          reasons of backward compatibility, we
 *                                                          recommend setting this parameter to
 *                                                          false when developing web applications
 *                                                          that are independent of the Java process
 *                                                          applications deployed to the engine.
 *
 * @param  {RequestCallback}  done
 */

Variable.instances = function (params, done) {
  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults', 'deserializeValues'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    } else {
      body[p] = params[p];
    }
  }

  return this.http.post(this.path, {
    data: body,
    query: query,
    done: done
  });
};
/**
 * Get a count of variables
 * Same parameters as instances
 */


Variable.count = function (params, done) {
  var path = this.path + '/count';
  return this.http.post(path, {
    data: params,
    done: done
  });
};

module.exports = Variable;

},{"./../abstract-client-resource":4}],37:[function(require,module,exports){
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
'use strict';

var Events = require('./events');

function noop() {}
/**
 * Abstract class for classes
 *
 * @class
 * @memberof CamSDK
 *
 * @borrows CamSDK.Events.on                        as on
 * @borrows CamSDK.Events.once                      as once
 * @borrows CamSDK.Events.off                       as off
 * @borrows CamSDK.Events.trigger                   as trigger
 *
 * @borrows CamSDK.Events.on                        as prototype.on
 * @borrows CamSDK.Events.once                      as prototype.once
 * @borrows CamSDK.Events.off                       as prototype.off
 * @borrows CamSDK.Events.trigger                   as prototype.trigger
 */


function BaseClass() {
  this.initialize();
}
/**
 * Creates a new Resource Class, very much inspired from Backbone.Model.extend.
 * [Backbone helpers]{@link http://backbonejs.org/docs/backbone.html}
 *
 *
 * @param  {?Object.<String, *>} protoProps
 * @param  {Object.<String, *>} [staticProps]
 * @return {CamSDK.BaseClass}
 */


BaseClass.extend = function (protoProps, staticProps) {
  protoProps = protoProps || {};
  staticProps = staticProps || {};
  var parent = this;
  var child, Surrogate, s, i;

  if (protoProps && Object.hasOwnProperty.call(parent, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function child() {
      return parent.apply(this, arguments);
    };
  }

  for (s in parent) {
    child[s] = parent[s];
  }

  for (s in staticProps) {
    child[s] = staticProps[s];
  }

  Surrogate = function Surrogate() {
    this.constructor = child;
  };

  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  for (i in protoProps) {
    child.prototype[i] = protoProps[i];
  }

  return child;
};
/**
 * Aimed to be overriden in order to initialize an instance.
 *
 * @memberof CamSDK.BaseClass.prototype
 * @method initialize
 */


BaseClass.prototype.initialize = noop;
Events.attach(BaseClass);
module.exports = BaseClass;

},{"./events":38}],38:[function(require,module,exports){
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
'use strict';
/**
 * Events handling utility which can be used on
 * any kind of object to provide `on`, `once`, `off`
 * and `trigger` functions.
 *
 * @exports CamSDK.Events
 * @mixin
 *
 * @example
 * var obj = {};
 * Events.attach(obj);
 *
 * obj.on('event:name', function() {});
 * obj.once('event:name', function() {});
 * obj.trigger('event:name', data, moreData, evenMoreData);
 */

var Events = {};
/**
 * Converts an object into array
 * @param  {*} obj
 * @return {Array}
 */

function toArray(obj) {
  var a,
      arr = [];

  for (a in obj) {
    arr.push(obj[a]);
  }

  return arr;
}
/**
 * Returns a function that will be executed
 * at most one time, no matter how often you call it.
 * @param  {Function} func
 * @return {Function}
 */


function once(func) {
  var ran = false,
      memo;
  return function () {
    if (ran) return memo;
    ran = true;
    memo = func.apply(this, arguments);
    func = null;
    return memo;
  };
}
/**
 * Ensure an object to have the needed _events property
 * @param  {*} obj
 * @param  {String} name
 */


function ensureEvents(obj, name) {
  obj._events = obj._events || {};
  obj._events[name] = obj._events[name] || [];
}
/**
 * Add the relevant Events methods to an object
 * @param  {*} obj
 */


Events.attach = function (obj) {
  obj.on = this.on;
  obj.once = this.once;
  obj.off = this.off;
  obj.trigger = this.trigger;
  obj._events = {};
};
/**
 * Bind a callback to `eventName`
 * @param  {String}   eventName
 * @param  {Function} callback
 */


Events.on = function (eventName, callback) {
  ensureEvents(this, eventName);

  this._events[eventName].push(callback);

  return this;
};
/**
 * Bind a callback who will only be called once to `eventName`
 * @param  {String}   eventName
 * @param  {Function} callback
 */


Events.once = function (eventName, callback) {
  var self = this;
  var cb = once(function () {
    self.off(eventName, once);
    callback.apply(this, arguments);
  });
  cb._callback = callback;
  return this.on(eventName, cb);
};
/**
 * Unbind one or all callbacks originally bound to `eventName`
 * @param  {String}   eventName
 * @param  {Function} [callback]
 */


Events.off = function (eventName, callback) {
  ensureEvents(this, eventName);

  if (!callback) {
    delete this._events[eventName];
    return this;
  }

  var e,
      arr = [];

  for (e in this._events[eventName]) {
    if (this._events[eventName][e] !== callback) {
      arr.push(this._events[eventName][e]);
    }
  }

  this._events[eventName] = arr;
  return this;
};
/**
 * Call the functions bound to `eventName`
 * @param  {String} eventName
 * @param {...*} [params]
 */


Events.trigger = function () {
  var args = toArray(arguments);
  var eventName = args.shift();
  ensureEvents(this, eventName);
  var e;

  for (e in this._events[eventName]) {
    this._events[eventName][e](this, args);
  }

  return this;
};

module.exports = Events;

},{}],39:[function(require,module,exports){
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
'use strict';
/* global CamSDK, require, localStorage: false */

/**
 * For all API client related
 * @namespace CamSDK.form
 */

var moment = require('moment');

var $ = require('./dom-lib');

var VariableManager = require('./variable-manager');

var InputFieldHandler = require('./controls/input-field-handler');

var ChoicesFieldHandler = require('./controls/choices-field-handler');

var FileDownloadHandler = require('./controls/file-download-handler');

var ErrorButtonHandler = require('./controls/error-button-handler');

var EscalationButtonHandler = require('./controls/escalation-button-handler');

var BaseClass = require('./../base-class');

var constants = require('./constants');

var Events = require('./../events');

function extend(dest, add) {
  for (var key in add) {
    dest[key] = add[key];
  }

  return dest;
}
/**
 * A class to help handling embedded forms
 *
 * @class
 * @memberof CamSDk.form
 *
 * @param {Object.<String,*>} options
 * @param {Cam}               options.client
 * @param {String}            [options.taskId]
 * @param {String}            [options.processDefinitionId]
 * @param {String}            [options.processDefinitionKey]
 * @param {Element}           [options.formContainer]
 * @param {Element}           [options.formElement]
 * @param {Object}            [options.urlParams]
 * @param {String}            [options.formUrl]
 */


function CamundaForm(options) {
  if (!options) {
    throw new Error('CamundaForm need to be initialized with options.');
  }

  var done = options.done = options.done || function (err) {
    if (err) throw err;
  };

  if (options.client) {
    this.client = options.client;
  } else {
    this.client = new CamSDK.Client(options.clientConfig || {});
  }

  if (!options.taskId && !options.processDefinitionId && !options.processDefinitionKey) {
    return done(new Error("Cannot initialize Taskform: either 'taskId' or 'processDefinitionId' or 'processDefinitionKey' must be provided"));
  }

  this.taskId = options.taskId;

  if (this.taskId) {
    this.taskBasePath = this.client.baseUrl + '/task/' + this.taskId;
  }

  this.processDefinitionId = options.processDefinitionId;
  this.processDefinitionKey = options.processDefinitionKey;
  this.formElement = options.formElement;
  this.containerElement = options.containerElement;
  this.formUrl = options.formUrl;

  if (!this.formElement && !this.containerElement) {
    return done(new Error("CamundaForm needs to be initilized with either 'formElement' or 'containerElement'"));
  }

  if (!this.formElement && !this.formUrl) {
    return done(new Error("Camunda form needs to be intialized with either 'formElement' or 'formUrl'"));
  }
  /**
   * A VariableManager instance
   * @type {VariableManager}
   */


  this.variableManager = new VariableManager({
    client: this.client
  });
  /**
   * An array of FormFieldHandlers
   * @type {FormFieldHandlers[]}
   */

  this.formFieldHandlers = options.formFieldHandlers || [InputFieldHandler, ChoicesFieldHandler, FileDownloadHandler, ErrorButtonHandler, EscalationButtonHandler];
  this.businessKey = null;
  this.fields = [];
  this.scripts = [];
  this.options = options; // init event support

  Events.attach(this);
  this.initialize(done);
}
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.initializeHandler = function (FieldHandler) {
  var self = this;
  var selector = FieldHandler.selector;
  $(selector, self.formElement).each(function () {
    self.fields.push(new FieldHandler(this, self.variableManager, self));
  });
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.initialize = function (_done) {
  _done = _done || function (err) {
    if (err) throw err;
  };

  var self = this; // check whether form needs to be loaded first

  if (this.formUrl) {
    this.client.http.load(this.formUrl, {
      accept: '*/*',
      done: function done(err, result) {
        if (err) {
          return _done(err);
        }

        try {
          self.renderForm(result);
          self.initializeForm(_done);
        } catch (error) {
          _done(error);
        }
      },
      data: extend({
        noCache: Date.now()
      }, this.options.urlParams || {})
    });
  } else {
    try {
      this.initializeForm(_done);
    } catch (error) {
      _done(error);
    }
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.renderForm = function (formHtmlSource) {
  // apppend the form html to the container element,
  // we also wrap the formHtmlSource to limit the risks of breaking
  // the structure of the document
  $(this.containerElement).html('').append('<div class="injected-form-wrapper">' + formHtmlSource + '</div>'); // extract and validate form element

  var formElement = this.formElement = $('form', this.containerElement);

  if (formElement.length !== 1) {
    throw new Error('Form must provide exaclty one element <form ..>');
  }

  if (!formElement.attr('name')) {
    formElement.attr('name', '$$camForm');
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.initializeForm = function (done) {
  var self = this; // handle form scripts

  this.initializeFormScripts(); // initialize field handlers

  this.initializeFieldHandlers(); // execute the scripts

  this.executeFormScripts(); // fire form loaded

  this.fireEvent('form-loaded');
  this.fetchVariables(function (err, result) {
    if (err) {
      throw err;
    } // merge the variables


    self.mergeVariables(result); // retain original server values for dirty checking

    self.storeOriginalValues(result); // fire variables fetched

    self.fireEvent('variables-fetched'); // restore variables from local storage

    self.restore(); // fire variables-restored

    self.fireEvent('variables-restored'); // apply the variables to the form fields

    self.applyVariables(); // fire variables applied

    self.fireEvent('variables-applied'); // invoke callback

    done(null, self);
  });
};

CamundaForm.prototype.initializeFieldHandlers = function () {
  for (var FieldHandler in this.formFieldHandlers) {
    this.initializeHandler(this.formFieldHandlers[FieldHandler]);
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.initializeFormScripts = function () {
  var formScriptElements = $('script[' + constants.DIRECTIVE_CAM_SCRIPT + ']', this.formElement);

  for (var i = 0; i < formScriptElements.length; i++) {
    this.scripts.push(formScriptElements[i].text);
  }
};

CamundaForm.prototype.executeFormScripts = function () {
  for (var i = 0; i < this.scripts.length; i++) {
    this.executeFormScript(this.scripts[i]);
  }
};

CamundaForm.prototype.executeFormScript = function (script) {
  /*eslint-disable */

  /* jshint unused: false */
  (function (camForm) {
    /* jshint evil: true */
    eval(script);
    /* jshint evil: false */
  })(this);
  /*eslint-enable */

};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 *
 * Store the state of the form to localStorage.
 *
 * You can prevent further execution by hooking
 * the `store` event and set `storePrevented` to
 * something truthy.
 */


CamundaForm.prototype.store = function (callback) {
  var formId = this.taskId || this.processDefinitionId || this.caseInstanceId;

  if (!formId) {
    if (typeof callback === 'function') {
      return callback(new Error('Cannot determine the storage ID'));
    } else {
      throw new Error('Cannot determine the storage ID');
    }
  }

  this.storePrevented = false;
  this.fireEvent('store');

  if (this.storePrevented) {
    return;
  }

  try {
    // get values from form fields
    this.retrieveVariables(); // build the local storage object

    var store = {
      date: Date.now(),
      vars: {}
    };

    for (var name in this.variableManager.variables) {
      if (this.variableManager.variables[name].type !== 'Bytes') {
        store.vars[name] = this.variableManager.variables[name].value;
      }
    } // store it


    localStorage.setItem('camForm:' + formId, JSON.stringify(store));
  } catch (error) {
    if (typeof callback === 'function') {
      return callback(error);
    } else {
      throw error;
    }
  }

  this.fireEvent('variables-stored');

  if (typeof callback === 'function') {
    callback();
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 * @return {Boolean} `true` if there is something who can be restored
 */


CamundaForm.prototype.isRestorable = function () {
  var formId = this.taskId || this.processDefinitionId || this.caseInstanceId;

  if (!formId) {
    throw new Error('Cannot determine the storage ID');
  } // verify the presence of an entry


  if (!localStorage.getItem('camForm:' + formId)) {
    return false;
  } // unserialize


  var stored = localStorage.getItem('camForm:' + formId);

  try {
    stored = JSON.parse(stored);
  } catch (error) {
    return false;
  } // check the content


  if (!stored || !Object.keys(stored).length) {
    return false;
  }

  return true;
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 *
 * Restore the state of the form from localStorage.
 *
 * You can prevent further execution by hooking
 * the `restore` event and set `restorePrevented` to
 * something truthy.
 */


CamundaForm.prototype.restore = function (callback) {
  var stored;
  var vars = this.variableManager.variables;
  var formId = this.taskId || this.processDefinitionId || this.caseDefinitionId;

  if (!formId) {
    if (typeof callback === 'function') {
      return callback(new Error('Cannot determine the storage ID'));
    } else {
      throw new Error('Cannot determine the storage ID');
    }
  } // no need to go further if there is nothing to restore


  if (!this.isRestorable()) {
    if (typeof callback === 'function') {
      return callback();
    }

    return;
  }

  try {
    // retrieve the values from localStoarge
    stored = localStorage.getItem('camForm:' + formId);
    stored = JSON.parse(stored).vars;
  } catch (error) {
    if (typeof callback === 'function') {
      return callback(error);
    } else {
      throw error;
    }
  } // merge the stored values on the variableManager.variables


  for (var name in stored) {
    if (vars[name]) {
      vars[name].value = stored[name];
    } else {
      vars[name] = {
        name: name,
        value: stored[name]
      };
    }
  }

  if (typeof callback === 'function') {
    callback();
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.submit = function (callback) {
  var formId = this.taskId || this.processDefinitionId; // fire submit event (event handler may prevent submit from being performed)

  this.submitPrevented = false;
  this.fireEvent('submit');

  if (this.submitPrevented) {
    var err = new Error('camForm submission prevented');
    this.fireEvent('submit-failed', err);
    return callback && callback(err);
  }

  try {
    // get values from form fields
    this.retrieveVariables();
  } catch (error) {
    return callback && callback(error);
  }

  var self = this;
  this.transformFiles(function () {
    // submit the form variables
    self.submitVariables(function (err, result) {
      if (err) {
        self.fireEvent('submit-failed', err);
        return callback && callback(err);
      } // clear the local storage for this form


      localStorage.removeItem('camForm:' + formId);
      self.fireEvent('submit-success');
      return callback && callback(null, result);
    });
  });
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.error = function (errorCode, errorMessage, callback) {
  var formId = this.taskId || this.processDefinitionId;
  this.errorPrevented = false;
  this.fireEvent('error');

  if (this.errorPrevented) {
    var err = new Error('camForm error prevented');
    this.fireEvent('error-failed', err);
    return callback && callback(err);
  }

  try {
    // get values from form fields
    this.retrieveVariables();
  } catch (error) {
    return callback && callback(error);
  }

  var self = this;
  this.transformFiles(function () {
    // submit the form variables
    var data = {
      variables: self.parseVariables(),
      id: self.taskId,
      errorCode: errorCode,
      errorMessage: errorMessage
    };
    self.client.resource('task').bpmnError(data, function (err, result) {
      if (err) {
        self.fireEvent('error-failed', err);
        return callback && callback(err);
      } // clear the local storage for this form


      localStorage.removeItem('camForm:' + formId);
      self.fireEvent('error-success');
      return callback && callback(null, result);
    });
  });
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.escalate = function (escalationCode, callback) {
  var formId = this.taskId || this.processDefinitionId;
  this.escalationPrevented = false;
  this.fireEvent('escalation');

  if (this.escalationPrevented) {
    var err = new Error('camForm escalation prevented');
    this.fireEvent('escalation-failed', err);
    return callback && callback(err);
  }

  try {
    // get values from form fields
    this.retrieveVariables();
  } catch (error) {
    return callback && callback(error);
  }

  var self = this;
  this.transformFiles(function () {
    // submit the form variables
    var data = {
      variables: self.parseVariables(),
      id: self.taskId,
      escalationCode: escalationCode
    };
    self.client.resource('task').bpmnEscalation(data, function (err, result) {
      if (err) {
        self.fireEvent('escalation-failed', err);
        return callback && callback(err);
      } // clear the local storage for this form


      localStorage.removeItem('camForm:' + formId);
      self.fireEvent('escalation-success');
      return callback && callback(null, result);
    });
  });
};

CamundaForm.prototype.transformFiles = function (callback) {
  var that = this;
  var counter = 1;

  var callCallback = function callCallback() {
    if (--counter === 0) {
      callback();
    }
  };

  var bytesToSize = function bytesToSize(bytes) {
    if (bytes === 0) return '0 Byte';
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
  };

  for (var i in this.fields) {
    var element = this.fields[i].element[0];

    if (element.getAttribute('type') === 'file') {
      var fileVar = that.variableManager.variables[that.fields[i].variableName];

      if (typeof FileReader === 'function' && element.files.length > 0) {
        if (element.files[0].size > (parseInt(element.getAttribute('cam-max-filesize'), 10) || 5000000)) {
          throw new Error('Maximum file size of ' + bytesToSize(parseInt(element.getAttribute('cam-max-filesize'), 10) || 5000000) + ' exceeded.');
        }

        var reader = new FileReader();
        /* jshint ignore:start */

        reader.onloadend = function (i, element, fileVar) {
          return function (e) {
            var binary = '';
            var bytes = new Uint8Array(e.target.result);
            var len = bytes.byteLength;

            for (var j = 0; j < len; j++) {
              binary += String.fromCharCode(bytes[j]);
            }

            fileVar.value = btoa(binary); // set file metadata as value info

            if (fileVar.type.toLowerCase() === 'file') {
              fileVar.valueInfo = {
                filename: element.files[0].name,
                mimeType: element.files[0].type
              };
            }

            callCallback();
          };
        }(i, element, fileVar);
        /* jshint ignore:end */


        reader.readAsArrayBuffer(element.files[0]);
        counter++;
      } else {
        fileVar.value = '';
        fileVar.valueInfo = {
          filename: ''
        };
      }
    }
  }

  callCallback();
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.fetchVariables = function (done) {
  done = done || function () {};

  var names = this.variableManager.variableNames();

  if (names.length) {
    var data = {
      names: names,
      deserializeValues: false
    }; // pass either the taskId, processDefinitionId or processDefinitionKey

    if (this.taskId) {
      data.id = this.taskId;
      this.client.resource('task').formVariables(data, done);
    } else {
      data.id = this.processDefinitionId;
      data.key = this.processDefinitionKey;
      this.client.resource('process-definition').formVariables(data, done);
    }
  } else {
    done();
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.parseVariables = function () {
  var varManager = this.variableManager;
  var vars = varManager.variables; // The default display value is different from the original value in varManager

  this.fields.forEach(function (field) {
    if (vars[field.variableName]) {
      vars[field.variableName].defaultValue = field.originalValue;

      if (field.originalValue === '' || typeof field.originalValue === 'undefined') {
        vars[field.variableName].defaultValue = vars[field.variableName].value;
      }
    }
  });
  var variableData = {};

  for (var v in vars) {
    // only submit dirty variables
    // LIMITATION: dirty checking is not performed for complex object variables
    var val = vars[v].value; // We want implicit type conversion in this case, the defaultValue is always a string

    if (varManager.isDirty(v) || vars[v].defaultValue != val) {
      // if variable is JSON, serialize
      if (varManager.isJsonVariable(v)) {
        val = JSON.stringify(val);
      } // if variable is Date, add timezone info


      if (val && varManager.isDateVariable(v)) {
        val = moment(val, moment.ISO_8601).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      }

      variableData[v] = {
        value: val,
        type: vars[v].type,
        valueInfo: vars[v].valueInfo
      };
    }
  }

  return variableData;
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.submitVariables = function (done) {
  done = done || function () {};

  var data = {
    variables: this.parseVariables()
  }; // pass either the taskId, processDefinitionId or processDefinitionKey

  if (this.taskId) {
    data.id = this.taskId;
    this.client.resource('task').submitForm(data, done);
  } else {
    var businessKey = this.businessKey || this.formElement.find('input[type="text"][cam-business-key]').val();

    if (businessKey) {
      data.businessKey = businessKey;
    }

    data.id = this.processDefinitionId;
    data.key = this.processDefinitionKey;
    this.client.resource('process-definition').submitForm(data, done);
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.storeOriginalValues = function (variables) {
  for (var v in variables) {
    this.variableManager.setOriginalValue(v, variables[v].value);
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.mergeVariables = function (variables) {
  var vars = this.variableManager.variables;

  for (var v in variables) {
    if (vars[v]) {
      for (var p in variables[v]) {
        vars[v][p] = vars[v][p] || variables[v][p];
      }
    } else {
      vars[v] = variables[v];
    } // check whether the variable provides JSON payload. If true, deserialize


    if (this.variableManager.isJsonVariable(v)) {
      vars[v].value = JSON.parse(variables[v].value);
    } // generate content url for file and bytes variables


    var type = vars[v].type;

    if (!!this.taskBasePath && (type === 'Bytes' || type === 'File')) {
      vars[v].contentUrl = this.taskBasePath + '/variables/' + vars[v].name + '/data';
    }

    this.variableManager.isVariablesFetched = true;
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.applyVariables = function () {
  for (var i in this.fields) {
    this.fields[i].applyValue();
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.retrieveVariables = function () {
  for (var i in this.fields) {
    this.fields[i].getValue();
  }
};
/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */


CamundaForm.prototype.fireEvent = function (eventName, obj) {
  this.trigger(eventName, obj);
};
/**
 * @memberof CamSDK.form.CamundaForm
 */


CamundaForm.$ = $;
CamundaForm.VariableManager = VariableManager;
CamundaForm.fields = {};
CamundaForm.fields.InputFieldHandler = InputFieldHandler;
CamundaForm.fields.ChoicesFieldHandler = ChoicesFieldHandler;
/**
 * @memberof CamSDK.form.CamundaForm
 */

CamundaForm.cleanLocalStorage = function (timestamp) {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);

    if (key.indexOf('camForm:') === 0) {
      var item = JSON.parse(localStorage.getItem(key));

      if (item.date < timestamp) {
        localStorage.removeItem(key);
        i--;
      }
    }
  }
};
/**
 * @memberof CamSDK.form.CamundaForm
 * @borrows CamSDK.BaseClass.extend as extend
 * @name extend
 * @type {Function}
 */


CamundaForm.extend = BaseClass.extend;
module.exports = CamundaForm;

},{"./../base-class":37,"./../events":38,"./constants":40,"./controls/choices-field-handler":42,"./controls/error-button-handler":43,"./controls/escalation-button-handler":44,"./controls/file-download-handler":45,"./controls/input-field-handler":46,"./dom-lib":47,"./variable-manager":49,"moment":52}],40:[function(require,module,exports){
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
'use strict';

module.exports = {
  DIRECTIVE_CAM_FORM: 'cam-form',
  DIRECTIVE_CAM_VARIABLE_NAME: 'cam-variable-name',
  DIRECTIVE_CAM_VARIABLE_TYPE: 'cam-variable-type',
  DIRECTIVE_CAM_FILE_DOWNLOAD: 'cam-file-download',
  DIRECTIVE_CAM_CHOICES: 'cam-choices',
  DIRECTIVE_CAM_SCRIPT: 'cam-script',
  DIRECTIVE_CAM_ERROR_CODE: 'cam-error-code',
  DIRECTIVE_CAM_ERROR_MESSAGE: 'cam-error-message',
  DIRECTIVE_CAM_ESCALATION_CODE: 'cam-escalation-code'
};

},{}],41:[function(require,module,exports){
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
'use strict';

var BaseClass = require('../../base-class');

var $ = require('./../dom-lib');

function noop() {}
/**
 * An abstract class for the form field controls
 *
 * @class AbstractFormField
 * @abstract
 * @memberof CamSDK.form
 *
 */


function AbstractFormField(element, variableManager, camForm) {
  this.element = $(element);
  this.variableManager = variableManager;
  this.form = camForm;
  this.variableName = null;
  this.initialize();
}
/**
 * @memberof CamSDK.form.AbstractFormField
 * @abstract
 * @name selector
 * @type {String}
 */


AbstractFormField.selector = null;
/**
 * @memberof CamSDK.form.AbstractFormField
 * @borrows CamSDK.BaseClass.extend as extend
 * @name extend
 * @type {Function}
 */

AbstractFormField.extend = BaseClass.extend;
/**
 * @memberof CamSDK.form.AbstractFormField.prototype
 * @abstract
 * @method initialize
 */

AbstractFormField.prototype.initialize = noop;
/**
 * Applies the stored value to a field element.
 *
 * @memberof CamSDK.form.AbstractFormField.prototype
 * @abstract
 * @method applyValue
 *
 * @return {CamSDK.form.AbstractFormField} Chainable method
 */

AbstractFormField.prototype.applyValue = noop;
/**
 * @memberof CamSDK.form.AbstractFormField.prototype
 * @abstract
 * @method getValue
 */

AbstractFormField.prototype.getValue = noop;
module.exports = AbstractFormField;

},{"../../base-class":37,"./../dom-lib":47}],42:[function(require,module,exports){
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
'use strict';

var constants = require('./../constants'),
    AbstractFormField = require('./abstract-form-field'),
    $ = require('./../dom-lib');
/**
 * A field control handler for choices
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */


var ChoicesFieldHandler = AbstractFormField.extend(
/** @lends CamSDK.form.ChoicesFieldHandler.prototype */
{
  /**
   * Prepares an instance
   */
  initialize: function initialize() {
    // read variable definitions from markup
    var variableName = this.variableName = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_NAME);
    var variableType = this.variableType = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE);
    var choicesVariableName = this.choicesVariableName = this.element.attr(constants.DIRECTIVE_CAM_CHOICES); // crate variable

    this.variableManager.createVariable({
      name: variableName,
      type: variableType,
      value: this.element.val() || null
    }); // fetch choices variable

    if (choicesVariableName) {
      this.variableManager.fetchVariable(choicesVariableName);
    } // remember the original value found in the element for later checks


    this.originalValue = this.element.val() || null;
    this.previousValue = this.originalValue; // remember variable name

    this.variableName = variableName;
  },

  /**
   * Applies the stored value to a field element.
   *
   * @return {CamSDK.form.ChoicesFieldHandler} Chainable method.
   */
  applyValue: function applyValue() {
    var selectedIndex = this.element[0].selectedIndex; // if cam-choices variable is defined, apply options

    if (this.choicesVariableName) {
      var choicesVariableValue = this.variableManager.variableValue(this.choicesVariableName);

      if (choicesVariableValue) {
        // array
        if (choicesVariableValue instanceof Array) {
          for (var i = 0; i < choicesVariableValue.length; i++) {
            var val = choicesVariableValue[i];

            if (!this.element.find('option[text="' + val + '"]').length) {
              this.element.append($('<option>', {
                value: val,
                text: val
              }));
            }
          } // object aka map

        } else {
          for (var p in choicesVariableValue) {
            if (!this.element.find('option[value="' + p + '"]').length) {
              this.element.append($('<option>', {
                value: p,
                text: choicesVariableValue[p]
              }));
            }
          }
        }
      }
    } // make sure selected index is retained


    this.element[0].selectedIndex = selectedIndex; // select option referenced in cam-variable-name (if any)

    this.previousValue = this.element.val() || '';
    var variableValue = this.variableManager.variableValue(this.variableName); // check if variable is defined before writing values to the html
    // variableValue can be the Number 0 or negative, so `|| ''` does not work here

    variableValue = variableValue === null ? '' : variableValue;

    if (variableValue !== this.previousValue) {
      // write value to html control
      this.element.val(variableValue);
      this.element.trigger('camFormVariableApplied', variableValue); // Update the ui after the current digest cycle

      var that = this;
      window.setTimeout(function () {
        that.element.change();
      }, 0);
    }

    return this;
  },

  /**
   * Retrieves the value from a field element and stores it
   *
   * @return {*} when multiple choices are possible an array of values, otherwise a single value
   */
  getValue: function getValue() {
    // read value from html control
    var value;
    var multiple = this.element.prop('multiple');

    if (multiple) {
      value = [];
      this.element.find('option:selected').each(function () {
        value.push($(this).val());
      });
    } else {
      value = this.element.find('option:selected').attr('value');
    } // write value to variable


    this.variableManager.variableValue(this.variableName, value);
    return value;
  }
},
/** @lends CamSDK.form.ChoicesFieldHandler */
{
  selector: 'select[' + constants.DIRECTIVE_CAM_VARIABLE_NAME + ']'
});
module.exports = ChoicesFieldHandler;

},{"./../constants":40,"./../dom-lib":47,"./abstract-form-field":41}],43:[function(require,module,exports){
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
'use strict';

var constants = require('../constants'),
    AbstractFormField = require('./abstract-form-field');
/**
 * A field control handler for file downloads
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */


var ErrorButtonHandler = AbstractFormField.extend({
  /**
   * Prepares an instance
   */
  initialize: function initialize() {
    this.errorCode = this.element.attr(constants.DIRECTIVE_CAM_ERROR_CODE);
    this.errorMessage = this.element.attr(constants.DIRECTIVE_CAM_ERROR_MESSAGE);
  },
  applyValue: function applyValue() {
    var self = this;
    this.element.on('click', function () {
      self.form.error(self.errorCode, self.errorMessage);
    });
    return this;
  }
}, {
  selector: 'button[' + constants.DIRECTIVE_CAM_ERROR_CODE + ']'
});
module.exports = ErrorButtonHandler;

},{"../constants":40,"./abstract-form-field":41}],44:[function(require,module,exports){
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
'use strict';

var constants = require('../constants'),
    AbstractFormField = require('./abstract-form-field');
/**
 * A field control handler for file downloads
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */


var ErrorButtonHandler = AbstractFormField.extend({
  /**
   * Prepares an instance
   */
  initialize: function initialize() {
    this.escalationCode = this.element.attr(constants.DIRECTIVE_CAM_ESCALATION_CODE);
  },
  applyValue: function applyValue() {
    var self = this;
    this.element.on('click', function () {
      self.form.escalate(self.escalationCode);
    });
    return this;
  }
}, {
  selector: 'button[' + constants.DIRECTIVE_CAM_ESCALATION_CODE + ']'
});
module.exports = ErrorButtonHandler;

},{"../constants":40,"./abstract-form-field":41}],45:[function(require,module,exports){
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
'use strict';

var constants = require('./../constants'),
    AbstractFormField = require('./abstract-form-field');
/**
 * A field control handler for file downloads
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */


var InputFieldHandler = AbstractFormField.extend({
  /**
   * Prepares an instance
   */
  initialize: function initialize() {
    this.variableName = this.element.attr(constants.DIRECTIVE_CAM_FILE_DOWNLOAD); // fetch the variable

    this.variableManager.fetchVariable(this.variableName);
  },
  applyValue: function applyValue() {
    var variable = this.variableManager.variable(this.variableName); // set the download url of the link

    this.element.attr('href', variable.contentUrl); // sets the text content of the link to the filename it the textcontent is empty

    if (this.element.text().trim().length === 0) {
      this.element.text(variable.valueInfo.filename);
    }

    return this;
  }
}, {
  selector: 'a[' + constants.DIRECTIVE_CAM_FILE_DOWNLOAD + ']'
});
module.exports = InputFieldHandler;

},{"./../constants":40,"./abstract-form-field":41}],46:[function(require,module,exports){
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
'use strict';

var constants = require('./../constants'),
    AbstractFormField = require('./abstract-form-field'),
    convertToType = require('../type-util').convertToType;

var isBooleanCheckbox = function isBooleanCheckbox(element) {
  return element.attr('type') === 'checkbox' && element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE) === 'Boolean';
};
/**
 * A field control handler for simple text / string values
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */


var InputFieldHandler = AbstractFormField.extend(
/** @lends CamSDK.form.InputFieldHandler.prototype */
{
  /**
   * Prepares an instance
   */
  initialize: function initialize() {
    // read variable definitions from markup
    var variableName = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_NAME);
    var variableType = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE); // crate variable

    this.variableManager.createVariable({
      name: variableName,
      type: variableType
    }); // remember the original value found in the element for later checks

    this.originalValue = this.element.val();
    this.previousValue = this.originalValue; // remember variable name

    this.variableName = variableName;
    this.getValue();
  },

  /**
   * Applies the stored value to a field element.
   *
   * @return {CamSDK.form.InputFieldHandler} Chainable method
   */
  applyValue: function applyValue() {
    this.previousValue = this.getValueFromHtmlControl() || '';
    var variableValue = this.variableManager.variableValue(this.variableName);

    if (variableValue && this.variableManager.isDateVariable(this.variableName)) {
      var dateValue = new Date(variableValue);
      variableValue = convertToType(dateValue, 'Date');
    }

    if (variableValue !== this.previousValue) {
      // write value to html control
      this.applyValueToHtmlControl(variableValue);
      this.element.trigger('camFormVariableApplied', variableValue);
    }

    return this;
  },

  /**
   * Retrieves the value from an <input>
   * element and stores it in the Variable Manager
   *
   * @return {*}
   */
  getValue: function getValue() {
    var value = this.getValueFromHtmlControl(); // write value to variable

    this.variableManager.variableValue(this.variableName, value);
    return value;
  },
  getValueFromHtmlControl: function getValueFromHtmlControl() {
    if (isBooleanCheckbox(this.element)) {
      return this.element.prop('checked');
    } else {
      return this.element.val();
    }
  },
  applyValueToHtmlControl: function applyValueToHtmlControl(variableValue) {
    if (isBooleanCheckbox(this.element)) {
      this.element.prop('checked', variableValue);
    } else if (this.element[0].type !== 'file') {
      this.element.val(variableValue);
    }
  }
},
/** @lends CamSDK.form.InputFieldHandler */
{
  selector: 'input[' + constants.DIRECTIVE_CAM_VARIABLE_NAME + ']' + ',textarea[' + constants.DIRECTIVE_CAM_VARIABLE_NAME + ']'
});
module.exports = InputFieldHandler;

},{"../type-util":48,"./../constants":40,"./abstract-form-field":41}],47:[function(require,module,exports){
(function (global){
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
'use strict';

(function (factory) {
  /* global global: false */
  factory(typeof window !== 'undefined' ? window : global);
})(function (root) {
  root = root || {};
  module.exports = root.jQuery || (root.angular ? root.angular.element : false) || root.Zepto;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(require,module,exports){
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
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var INTEGER_PATTERN = /^-?[\d]+$/;
var FLOAT_PATTERN = /^(0|(-?(((0|[1-9]\d*)\.\d+)|([1-9]\d*))))([eE][-+]?[0-9]+)?$/;
var BOOLEAN_PATTERN = /^(true|false)$/;
var DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(|\.[0-9]{0,4})$/;

var xmlParser = require('fast-xml-parser');

var isValidXML = function isValidXML(value) {
  return value ? xmlParser.validate(value) : false;
};

var isValidJSON = function isValidJSON(value) {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

var isType = function isType(value, type) {
  switch (type) {
    case 'Integer':
    case 'Long':
    case 'Short':
      return INTEGER_PATTERN.test(value);

    case 'Float':
    case 'Double':
      return FLOAT_PATTERN.test(value);

    case 'Boolean':
      return BOOLEAN_PATTERN.test(value);

    case 'Date':
      return DATE_PATTERN.test(dateToString(value));

    case 'Xml':
      return isValidXML(value);

    case 'Json':
      return isValidJSON(value);
  }
};

var convertToType = function convertToType(value, type) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  if (type === 'String' || type === 'Bytes' || type === 'File') {
    return value;
  } else if (isType(value, type)) {
    switch (type) {
      case 'Integer':
      case 'Long':
      case 'Short':
        return parseInt(value, 10);

      case 'Float':
      case 'Double':
        return parseFloat(value);

      case 'Boolean':
        return 'true' === value;

      case 'Date':
        return dateToString(value);
    }
  } else {
    throw new Error("Value '" + value + "' is not of type " + type);
  }
};
/**
 * This reformates the date into a ISO8601 conform string which will mirror the selected date in local format.
 * TODO: Remove this when it is fixed by angularjs
 *
 * @see https://app.camunda.com/jira/browse/CAM-4746
 *
 */


var pad = function pad(number) {
  return number < 10 ? '0' + number : number;
};

var dateToString = function dateToString(date) {
  if (_typeof(date) === 'object' && typeof date.getFullYear === 'function') {
    var year = date.getFullYear(),
        month = pad(date.getMonth() + 1),
        day = pad(date.getDate()),
        hour = pad(date.getHours()),
        min = pad(date.getMinutes()),
        sec = pad(date.getSeconds());
    return year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec;
  } else {
    return date;
  }
};

module.exports = {
  convertToType: convertToType,
  isType: isType,
  dateToString: dateToString
};

},{"fast-xml-parser":123}],49:[function(require,module,exports){
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
'use strict';

var moment = require('moment');

var convertToType = require('./type-util').convertToType;
/**
 * @class
 * the variable manager is responsible for managing access to variables.
 *
 * Variable Datatype
 *
 * A variable has the following properties:
 *
 *   name: the name of the variable
 *
 *   type: the type of the variable. The type is a "backend type"
 *
 *
 */


function VariableManager() {
  /** @member object containing the form fields. Initially empty. */
  this.variables = {};
  /** @member boolean indicating whether the variables are fetched */

  this.isVariablesFetched = false;
}

VariableManager.prototype.fetchVariable = function (variable) {
  if (this.isVariablesFetched) {
    throw new Error('Illegal State: cannot call fetchVariable(), variables already fetched.');
  }

  this.createVariable({
    name: variable
  });
};

VariableManager.prototype.createVariable = function (variable) {
  if (!this.variables[variable.name]) {
    this.variables[variable.name] = variable;
  } else {
    throw new Error('Cannot add variable with name ' + variable.name + ': already exists.');
  }
};

VariableManager.prototype.destroyVariable = function (variableName) {
  if (this.variables[variableName]) {
    delete this.variables[variableName];
  } else {
    throw new Error('Cannot remove variable with name ' + variableName + ': variable does not exist.');
  }
};

VariableManager.prototype.setOriginalValue = function (variableName, value) {
  if (this.variables[variableName]) {
    this.variables[variableName].originalValue = value;
  } else {
    throw new Error('Cannot set original value of variable with name ' + variableName + ': variable does not exist.');
  }
};

VariableManager.prototype.variable = function (variableName) {
  return this.variables[variableName];
};

VariableManager.prototype.variableValue = function (variableName, value) {
  var variable = this.variable(variableName);

  if (typeof value === 'undefined' || value === null) {
    value = null;
  } else if (value === '' && variable.type !== 'String') {
    // convert empty string to null for all types except String
    value = null;
  } else if (typeof value === 'string' && variable.type !== 'String') {
    // convert string value into model value
    value = convertToType(value, variable.type);
  }

  if (arguments.length === 2) {
    variable.value = value;
  }

  return variable.value;
};

VariableManager.prototype.isDirty = function (name) {
  var variable = this.variable(name);

  if (this.isJsonVariable(name)) {
    return variable.originalValue !== JSON.stringify(variable.value);
  } else if (this.isDateVariable(name) && variable.originalValue && variable.value) {
    // check, if it is the same moment
    return !moment(variable.originalValue, moment.ISO_8601).isSame(variable.value);
  } else {
    return variable.originalValue !== variable.value || variable.type === 'Object';
  }
};

VariableManager.prototype.isJsonVariable = function (name) {
  var variable = this.variable(name);
  var type = variable.type;
  var supportedTypes = ['Object', 'json', 'Json'];
  var idx = supportedTypes.indexOf(type);

  if (idx === 0) {
    return variable.valueInfo.serializationDataFormat.indexOf('application/json') !== -1;
  }

  return idx !== -1;
};

VariableManager.prototype.isDateVariable = function (name) {
  var variable = this.variable(name);
  return variable.type === 'Date';
};

VariableManager.prototype.variableNames = function () {
  // since we support IE 8+ (http://kangax.github.io/compat-table/es5/)
  return Object.keys(this.variables);
};

module.exports = VariableManager;

},{"./type-util":48,"moment":52}],50:[function(require,module,exports){
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
'use strict';
/**
 * @exports CamSDK.utils
 */

require("core-js/modules/es.string.replace");

var utils = module.exports = {
  typeUtils: require('./forms/type-util')
};

utils.solveHALEmbedded = function (results) {
  function isId(str) {
    if (str.slice(-2) !== 'Id') {
      return false;
    }

    var prop = str.slice(0, -2);
    var embedded = results._embedded;
    return !!(embedded[prop] && !!embedded[prop].length);
  }

  function keys(obj) {
    var arr = Object.keys(obj);

    for (var a in arr) {
      if (arr[a][0] === '_' || !isId(arr[a])) {
        arr.splice(a, 1);
      }
    }

    return arr;
  }

  var _embeddedRessources = Object.keys(results._embedded || {});

  for (var r in _embeddedRessources) {
    var name = _embeddedRessources[r];

    for (var i in results._embedded[name]) {
      results._embedded[name][i]._embedded = results._embedded[name][i]._embedded || {};
      var properties = keys(results._embedded[name][i]);

      for (var p in properties) {
        var prop = properties[p];

        if (results._embedded[name][i][prop]) {
          var embedded = results._embedded[prop.slice(0, -2)];

          for (var e in embedded) {
            if (embedded[e].id === results._embedded[name][i][prop]) {
              results._embedded[name][i]._embedded[prop.slice(0, -2)] = [embedded[e]];
            }
          }
        }
      }
    }
  }

  return results;
}; // the 2 folowing functions were borrowed from async.js
// https://github.com/caolan/async/blob/master/lib/async.js


function _eachSeries(arr, iterator, callback) {
  callback = callback || function () {};

  if (!arr.length) {
    return callback();
  }

  var completed = 0;

  var iterate = function iterate() {
    iterator(arr[completed], function (err) {
      if (err) {
        callback(err);

        callback = function callback() {};
      } else {
        completed += 1;

        if (completed >= arr.length) {
          callback();
        } else {
          iterate();
        }
      }
    });
  };

  iterate();
}
/**
 * Executes functions in serie
 *
 * @param  {(Object.<String, Function>|Array.<Function>)} tasks object or array of functions
 *                                                              taking a callback
 *
 * @param  {Function} callback                                  executed at the end, first argument
 *                                                              will be an error (if error occured),
 *                                                              the second depends on "tasks" type
 *
 * @example
 * CamSDK.utils.series({
 *   a: function(cb) { setTimeout(function() { cb(null, 1); }, 1); },
 *   b: function(cb) { setTimeout(function() { cb(new Error('Bang!')); }, 1); },
 *   c: function(cb) { setTimeout(function() { cb(null, 3); }, 1); }
 * }, function(err, result) {
 *   // err will be passed
 *   // result will be { a: 1, b: undefined }
 * });
 */


utils.series = function (tasks, callback) {
  callback = callback || function () {};

  var results = {};

  _eachSeries(Object.keys(tasks), function (k, callback) {
    tasks[k](function (err) {
      var args = Array.prototype.slice.call(arguments, 1);

      if (args.length <= 1) {
        args = args[0];
      }

      results[k] = args;
      callback(err);
    });
  }, function (err) {
    callback(err, results);
  });
};
/**
 * Escapes url string
 *
 * @param {string} string
 * @returns {string}
 */


utils.escapeUrl = function (string) {
  return encodeURIComponent(string).replace(/\//g, '%2F').replace(/%2F/g, '%252F').replace(/\*/g, '%2A').replace(/%5C/g, '%255C');
};

},{"./forms/type-util":48,"core-js/modules/es.string.replace":117}],51:[function(require,module,exports){
"use strict";

/**
 * Expose `Emitter`.
 */
if (typeof module !== 'undefined') {
  module.exports = Emitter;
}
/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */


function Emitter(obj) {
  if (obj) return mixin(obj);
}

;
/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }

  return obj;
}
/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};
/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};
/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {}; // all

  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  } // specific event


  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this; // remove all handlers

  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  } // remove specific handler


  var cb;

  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];

    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  } // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.


  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};
/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */


Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};
  var args = new Array(arguments.length - 1),
      callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);

    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};
/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */


Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};
/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */


Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};

},{}],52:[function(require,module,exports){
"use strict";

require("core-js/modules/es.string.replace");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//! moment.js
;

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.moment = factory();
})(void 0, function () {
  'use strict';

  var hookCallback;

  function hooks() {
    return hookCallback.apply(null, arguments);
  } // This is done to register the method called with moment()
  // without creating circular dependencies.


  function setHookCallback(callback) {
    hookCallback = callback;
  }

  function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
  }

  function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
  }

  function isObjectEmpty(obj) {
    if (Object.getOwnPropertyNames) {
      return Object.getOwnPropertyNames(obj).length === 0;
    } else {
      var k;

      for (k in obj) {
        if (obj.hasOwnProperty(k)) {
          return false;
        }
      }

      return true;
    }
  }

  function isUndefined(input) {
    return input === void 0;
  }

  function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
  }

  function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
  }

  function map(arr, fn) {
    var res = [],
        i;

    for (i = 0; i < arr.length; ++i) {
      res.push(fn(arr[i], i));
    }

    return res;
  }

  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }

  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }

    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }

    return a;
  }

  function createUTC(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
  }

  function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false,
      parsedDateParts: [],
      meridiem: null,
      rfc2822: false,
      weekdayMismatch: false
    };
  }

  function getParsingFlags(m) {
    if (m._pf == null) {
      m._pf = defaultParsingFlags();
    }

    return m._pf;
  }

  var some;

  if (Array.prototype.some) {
    some = Array.prototype.some;
  } else {
    some = function some(fun) {
      var t = Object(this);
      var len = t.length >>> 0;

      for (var i = 0; i < len; i++) {
        if (i in t && fun.call(this, t[i], i, t)) {
          return true;
        }
      }

      return false;
    };
  }

  function isValid(m) {
    if (m._isValid == null) {
      var flags = getParsingFlags(m);
      var parsedParts = some.call(flags.parsedDateParts, function (i) {
        return i != null;
      });
      var isNowValid = !isNaN(m._d.getTime()) && flags.overflow < 0 && !flags.empty && !flags.invalidMonth && !flags.invalidWeekday && !flags.weekdayMismatch && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts);

      if (m._strict) {
        isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === undefined;
      }

      if (Object.isFrozen == null || !Object.isFrozen(m)) {
        m._isValid = isNowValid;
      } else {
        return isNowValid;
      }
    }

    return m._isValid;
  }

  function createInvalid(flags) {
    var m = createUTC(NaN);

    if (flags != null) {
      extend(getParsingFlags(m), flags);
    } else {
      getParsingFlags(m).userInvalidated = true;
    }

    return m;
  } // Plugins that add properties should also add the key here (null value),
  // so we can properly clone ourselves.


  var momentProperties = hooks.momentProperties = [];

  function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
      to._isAMomentObject = from._isAMomentObject;
    }

    if (!isUndefined(from._i)) {
      to._i = from._i;
    }

    if (!isUndefined(from._f)) {
      to._f = from._f;
    }

    if (!isUndefined(from._l)) {
      to._l = from._l;
    }

    if (!isUndefined(from._strict)) {
      to._strict = from._strict;
    }

    if (!isUndefined(from._tzm)) {
      to._tzm = from._tzm;
    }

    if (!isUndefined(from._isUTC)) {
      to._isUTC = from._isUTC;
    }

    if (!isUndefined(from._offset)) {
      to._offset = from._offset;
    }

    if (!isUndefined(from._pf)) {
      to._pf = getParsingFlags(from);
    }

    if (!isUndefined(from._locale)) {
      to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
      for (i = 0; i < momentProperties.length; i++) {
        prop = momentProperties[i];
        val = from[prop];

        if (!isUndefined(val)) {
          to[prop] = val;
        }
      }
    }

    return to;
  }

  var updateInProgress = false; // Moment prototype object

  function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);

    if (!this.isValid()) {
      this._d = new Date(NaN);
    } // Prevent infinite loop in case updateOffset creates new moment
    // objects.


    if (updateInProgress === false) {
      updateInProgress = true;
      hooks.updateOffset(this);
      updateInProgress = false;
    }
  }

  function isMoment(obj) {
    return obj instanceof Moment || obj != null && obj._isAMomentObject != null;
  }

  function absFloor(number) {
    if (number < 0) {
      // -0 -> 0
      return Math.ceil(number) || 0;
    } else {
      return Math.floor(number);
    }
  }

  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      value = absFloor(coercedNumber);
    }

    return value;
  } // compare two arrays, return the number of differences


  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;

    for (i = 0; i < len; i++) {
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }

    return diffs + lengthDiff;
  }

  function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
      console.warn('Deprecation warning: ' + msg);
    }
  }

  function deprecate(msg, fn) {
    var firstTime = true;
    return extend(function () {
      if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(null, msg);
      }

      if (firstTime) {
        var args = [];
        var arg;

        for (var i = 0; i < arguments.length; i++) {
          arg = '';

          if (_typeof(arguments[i]) === 'object') {
            arg += '\n[' + i + '] ';

            for (var key in arguments[0]) {
              arg += key + ': ' + arguments[0][key] + ', ';
            }

            arg = arg.slice(0, -2); // Remove trailing comma and space
          } else {
            arg = arguments[i];
          }

          args.push(arg);
        }

        warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + new Error().stack);
        firstTime = false;
      }

      return fn.apply(this, arguments);
    }, fn);
  }

  var deprecations = {};

  function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
      hooks.deprecationHandler(name, msg);
    }

    if (!deprecations[name]) {
      warn(msg);
      deprecations[name] = true;
    }
  }

  hooks.suppressDeprecationWarnings = false;
  hooks.deprecationHandler = null;

  function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
  }

  function set(config) {
    var prop, i;

    for (i in config) {
      prop = config[i];

      if (isFunction(prop)) {
        this[i] = prop;
      } else {
        this['_' + i] = prop;
      }
    }

    this._config = config; // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    // TODO: Remove "ordinalParse" fallback in next major release.

    this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + '|' + /\d{1,2}/.source);
  }

  function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig),
        prop;

    for (prop in childConfig) {
      if (hasOwnProp(childConfig, prop)) {
        if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
          res[prop] = {};
          extend(res[prop], parentConfig[prop]);
          extend(res[prop], childConfig[prop]);
        } else if (childConfig[prop] != null) {
          res[prop] = childConfig[prop];
        } else {
          delete res[prop];
        }
      }
    }

    for (prop in parentConfig) {
      if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
        // make sure changes to properties don't modify parent config
        res[prop] = extend({}, res[prop]);
      }
    }

    return res;
  }

  function Locale(config) {
    if (config != null) {
      this.set(config);
    }
  }

  var keys;

  if (Object.keys) {
    keys = Object.keys;
  } else {
    keys = function keys(obj) {
      var i,
          res = [];

      for (i in obj) {
        if (hasOwnProp(obj, i)) {
          res.push(i);
        }
      }

      return res;
    };
  }

  var defaultCalendar = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow at] LT',
    nextWeek: 'dddd [at] LT',
    lastDay: '[Yesterday at] LT',
    lastWeek: '[Last] dddd [at] LT',
    sameElse: 'L'
  };

  function calendar(key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
  }

  var defaultLongDateFormat = {
    LTS: 'h:mm:ss A',
    LT: 'h:mm A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A'
  };

  function longDateFormat(key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
      return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
      return val.slice(1);
    });
    return this._longDateFormat[key];
  }

  var defaultInvalidDate = 'Invalid date';

  function invalidDate() {
    return this._invalidDate;
  }

  var defaultOrdinal = '%d';
  var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

  function ordinal(number) {
    return this._ordinal.replace('%d', number);
  }

  var defaultRelativeTime = {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  };

  function relativeTime(number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
  }

  function pastFuture(diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
  }

  var aliases = {};

  function addUnitAlias(unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
  }

  function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
  }

  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);

        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }

    return normalizedInput;
  }

  var priorities = {};

  function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
  }

  function getPrioritizedUnits(unitsObj) {
    var units = [];

    for (var u in unitsObj) {
      units.push({
        unit: u,
        priority: priorities[u]
      });
    }

    units.sort(function (a, b) {
      return a.priority - b.priority;
    });
    return units;
  }

  function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? forceSign ? '+' : '' : '-') + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }

  var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;
  var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;
  var formatFunctions = {};
  var formatTokenFunctions = {}; // token:    'M'
  // padded:   ['MM', 2]
  // ordinal:  'Mo'
  // callback: function () { this.month() + 1 }

  function addFormatToken(token, padded, ordinal, callback) {
    var func = callback;

    if (typeof callback === 'string') {
      func = function func() {
        return this[callback]();
      };
    }

    if (token) {
      formatTokenFunctions[token] = func;
    }

    if (padded) {
      formatTokenFunctions[padded[0]] = function () {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      };
    }

    if (ordinal) {
      formatTokenFunctions[ordinal] = function () {
        return this.localeData().ordinal(func.apply(this, arguments), token);
      };
    }
  }

  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }

    return input.replace(/\\/g, '');
  }

  function makeFormatFunction(format) {
    var array = format.match(formattingTokens),
        i,
        length;

    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }

    return function (mom) {
      var output = '',
          i;

      for (i = 0; i < length; i++) {
        output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
      }

      return output;
    };
  } // format date using native date object


  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);
    return formatFunctions[format](m);
  }

  function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;

    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }

    return format;
  }

  var match1 = /\d/; //       0 - 9

  var match2 = /\d\d/; //      00 - 99

  var match3 = /\d{3}/; //     000 - 999

  var match4 = /\d{4}/; //    0000 - 9999

  var match6 = /[+-]?\d{6}/; // -999999 - 999999

  var match1to2 = /\d\d?/; //       0 - 99

  var match3to4 = /\d\d\d\d?/; //     999 - 9999

  var match5to6 = /\d\d\d\d\d\d?/; //   99999 - 999999

  var match1to3 = /\d{1,3}/; //       0 - 999

  var match1to4 = /\d{1,4}/; //       0 - 9999

  var match1to6 = /[+-]?\d{1,6}/; // -999999 - 999999

  var matchUnsigned = /\d+/; //       0 - inf

  var matchSigned = /[+-]?\d+/; //    -inf - inf

  var matchOffset = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z

  var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

  var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123
  // any word (or two) characters or numbers including two/three word month in arabic.
  // includes scottish gaelic two word and hyphenated months

  var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;
  var regexes = {};

  function addRegexToken(token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
      return isStrict && strictRegex ? strictRegex : regex;
    };
  }

  function getParseRegexForToken(token, config) {
    if (!hasOwnProp(regexes, token)) {
      return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
  } // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript


  function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    }));
  }

  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  var tokens = {};

  function addParseToken(token, callback) {
    var i,
        func = callback;

    if (typeof token === 'string') {
      token = [token];
    }

    if (isNumber(callback)) {
      func = function func(input, array) {
        array[callback] = toInt(input);
      };
    }

    for (i = 0; i < token.length; i++) {
      tokens[token[i]] = func;
    }
  }

  function addWeekParseToken(token, callback) {
    addParseToken(token, function (input, array, config, token) {
      config._w = config._w || {};
      callback(input, config._w, config, token);
    });
  }

  function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
      tokens[token](input, config._a, config, token);
    }
  }

  var YEAR = 0;
  var MONTH = 1;
  var DATE = 2;
  var HOUR = 3;
  var MINUTE = 4;
  var SECOND = 5;
  var MILLISECOND = 6;
  var WEEK = 7;
  var WEEKDAY = 8; // FORMATTING

  addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
  });
  addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
  });
  addFormatToken(0, ['YYYY', 4], 0, 'year');
  addFormatToken(0, ['YYYYY', 5], 0, 'year');
  addFormatToken(0, ['YYYYYY', 6, true], 0, 'year'); // ALIASES

  addUnitAlias('year', 'y'); // PRIORITIES

  addUnitPriority('year', 1); // PARSING

  addRegexToken('Y', matchSigned);
  addRegexToken('YY', match1to2, match2);
  addRegexToken('YYYY', match1to4, match4);
  addRegexToken('YYYYY', match1to6, match6);
  addRegexToken('YYYYYY', match1to6, match6);
  addParseToken(['YYYYY', 'YYYYYY'], YEAR);
  addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
  });
  addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
  });
  addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
  }); // HELPERS

  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }

  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  } // HOOKS


  hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
  }; // MOMENTS


  var getSetYear = makeGetSet('FullYear', true);

  function getIsLeapYear() {
    return isLeapYear(this.year());
  }

  function makeGetSet(unit, keepTime) {
    return function (value) {
      if (value != null) {
        set$1(this, unit, value);
        hooks.updateOffset(this, keepTime);
        return this;
      } else {
        return get(this, unit);
      }
    };
  }

  function get(mom, unit) {
    return mom.isValid() ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
  }

  function set$1(mom, unit, value) {
    if (mom.isValid() && !isNaN(value)) {
      if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
      } else {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
      }
    }
  } // MOMENTS


  function stringGet(units) {
    units = normalizeUnits(units);

    if (isFunction(this[units])) {
      return this[units]();
    }

    return this;
  }

  function stringSet(units, value) {
    if (_typeof(units) === 'object') {
      units = normalizeObjectUnits(units);
      var prioritized = getPrioritizedUnits(units);

      for (var i = 0; i < prioritized.length; i++) {
        this[prioritized[i].unit](units[prioritized[i].unit]);
      }
    } else {
      units = normalizeUnits(units);

      if (isFunction(this[units])) {
        return this[units](value);
      }
    }

    return this;
  }

  function mod(n, x) {
    return (n % x + x) % x;
  }

  var indexOf;

  if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function indexOf(o) {
      // I know
      var i;

      for (i = 0; i < this.length; ++i) {
        if (this[i] === o) {
          return i;
        }
      }

      return -1;
    };
  }

  function daysInMonth(year, month) {
    if (isNaN(year) || isNaN(month)) {
      return NaN;
    }

    var modMonth = mod(month, 12);
    year += (month - modMonth) / 12;
    return modMonth === 1 ? isLeapYear(year) ? 29 : 28 : 31 - modMonth % 7 % 2;
  } // FORMATTING


  addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
  });
  addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
  });
  addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
  }); // ALIASES

  addUnitAlias('month', 'M'); // PRIORITY

  addUnitPriority('month', 8); // PARSING

  addRegexToken('M', match1to2);
  addRegexToken('MM', match1to2, match2);
  addRegexToken('MMM', function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
  });
  addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
  });
  addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
  });
  addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict); // if we didn't find a month name, mark the date as invalid.


    if (month != null) {
      array[MONTH] = month;
    } else {
      getParsingFlags(config).invalidMonth = input;
    }
  }); // LOCALES

  var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
  var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');

  function localeMonths(m, format) {
    if (!m) {
      return isArray(this._months) ? this._months : this._months['standalone'];
    }

    return isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
  }

  var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');

  function localeMonthsShort(m, format) {
    if (!m) {
      return isArray(this._monthsShort) ? this._monthsShort : this._monthsShort['standalone'];
    }

    return isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
  }

  function handleStrictParse(monthName, format, strict) {
    var i,
        ii,
        mom,
        llc = monthName.toLocaleLowerCase();

    if (!this._monthsParse) {
      // this is not used
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];

      for (i = 0; i < 12; ++i) {
        mom = createUTC([2000, i]);
        this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
        this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
      }
    }

    if (strict) {
      if (format === 'MMM') {
        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'MMM') {
        ii = indexOf.call(this._shortMonthsParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }

  function localeMonthsParse(monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
      return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
    } // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse


    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, i]);

      if (strict && !this._longMonthsParse[i]) {
        this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
        this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
      }

      if (!strict && !this._monthsParse[i]) {
        regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
        this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
      } // test the regex


      if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
        return i;
      } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
        return i;
      } else if (!strict && this._monthsParse[i].test(monthName)) {
        return i;
      }
    }
  } // MOMENTS


  function setMonth(mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
      // No op
      return mom;
    }

    if (typeof value === 'string') {
      if (/^\d+$/.test(value)) {
        value = toInt(value);
      } else {
        value = mom.localeData().monthsParse(value); // TODO: Another silent failure?

        if (!isNumber(value)) {
          return mom;
        }
      }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));

    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);

    return mom;
  }

  function getSetMonth(value) {
    if (value != null) {
      setMonth(this, value);
      hooks.updateOffset(this, true);
      return this;
    } else {
      return get(this, 'Month');
    }
  }

  function getDaysInMonth() {
    return daysInMonth(this.year(), this.month());
  }

  var defaultMonthsShortRegex = matchWord;

  function monthsShortRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }

      if (isStrict) {
        return this._monthsShortStrictRegex;
      } else {
        return this._monthsShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsShortRegex')) {
        this._monthsShortRegex = defaultMonthsShortRegex;
      }

      return this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex;
    }
  }

  var defaultMonthsRegex = matchWord;

  function monthsRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }

      if (isStrict) {
        return this._monthsStrictRegex;
      } else {
        return this._monthsRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsRegex')) {
        this._monthsRegex = defaultMonthsRegex;
      }

      return this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex;
    }
  }

  function computeMonthsParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }

    var shortPieces = [],
        longPieces = [],
        mixedPieces = [],
        i,
        mom;

    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, i]);
      shortPieces.push(this.monthsShort(mom, ''));
      longPieces.push(this.months(mom, ''));
      mixedPieces.push(this.months(mom, ''));
      mixedPieces.push(this.monthsShort(mom, ''));
    } // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.


    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);

    for (i = 0; i < 12; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
    }

    for (i = 0; i < 24; i++) {
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
  }

  function createDate(y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date; // the date constructor remaps years 0-99 to 1900-1999

    if (y < 100 && y >= 0) {
      // preserve leap years using a full 400 year cycle, then reset
      date = new Date(y + 400, m, d, h, M, s, ms);

      if (isFinite(date.getFullYear())) {
        date.setFullYear(y);
      }
    } else {
      date = new Date(y, m, d, h, M, s, ms);
    }

    return date;
  }

  function createUTCDate(y) {
    var date; // the Date.UTC function remaps years 0-99 to 1900-1999

    if (y < 100 && y >= 0) {
      var args = Array.prototype.slice.call(arguments); // preserve leap years using a full 400 year cycle, then reset

      args[0] = y + 400;
      date = new Date(Date.UTC.apply(null, args));

      if (isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
      }
    } else {
      date = new Date(Date.UTC.apply(null, arguments));
    }

    return date;
  } // start-of-first-week - start-of-year


  function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
    fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
    fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;
    return -fwdlw + fwd - 1;
  } // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday


  function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear,
        resDayOfYear;

    if (dayOfYear <= 0) {
      resYear = year - 1;
      resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
      resYear = year + 1;
      resDayOfYear = dayOfYear - daysInYear(year);
    } else {
      resYear = year;
      resDayOfYear = dayOfYear;
    }

    return {
      year: resYear,
      dayOfYear: resDayOfYear
    };
  }

  function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek,
        resYear;

    if (week < 1) {
      resYear = mom.year() - 1;
      resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
      resWeek = week - weeksInYear(mom.year(), dow, doy);
      resYear = mom.year() + 1;
    } else {
      resYear = mom.year();
      resWeek = week;
    }

    return {
      week: resWeek,
      year: resYear
    };
  }

  function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
  } // FORMATTING


  addFormatToken('w', ['ww', 2], 'wo', 'week');
  addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek'); // ALIASES

  addUnitAlias('week', 'w');
  addUnitAlias('isoWeek', 'W'); // PRIORITIES

  addUnitPriority('week', 5);
  addUnitPriority('isoWeek', 5); // PARSING

  addRegexToken('w', match1to2);
  addRegexToken('ww', match1to2, match2);
  addRegexToken('W', match1to2);
  addRegexToken('WW', match1to2, match2);
  addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
  }); // HELPERS
  // LOCALES

  function localeWeek(mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
  }

  var defaultLocaleWeek = {
    dow: 0,
    // Sunday is the first day of the week.
    doy: 6 // The week that contains Jan 6th is the first week of the year.

  };

  function localeFirstDayOfWeek() {
    return this._week.dow;
  }

  function localeFirstDayOfYear() {
    return this._week.doy;
  } // MOMENTS


  function getSetWeek(input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
  }

  function getSetISOWeek(input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
  } // FORMATTING


  addFormatToken('d', 0, 'do', 'day');
  addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
  });
  addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
  });
  addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
  });
  addFormatToken('e', 0, 0, 'weekday');
  addFormatToken('E', 0, 0, 'isoWeekday'); // ALIASES

  addUnitAlias('day', 'd');
  addUnitAlias('weekday', 'e');
  addUnitAlias('isoWeekday', 'E'); // PRIORITY

  addUnitPriority('day', 11);
  addUnitPriority('weekday', 11);
  addUnitPriority('isoWeekday', 11); // PARSING

  addRegexToken('d', match1to2);
  addRegexToken('e', match1to2);
  addRegexToken('E', match1to2);
  addRegexToken('dd', function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
  });
  addRegexToken('ddd', function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
  });
  addRegexToken('dddd', function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
  });
  addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict); // if we didn't get a weekday name, mark the date as invalid


    if (weekday != null) {
      week.d = weekday;
    } else {
      getParsingFlags(config).invalidWeekday = input;
    }
  });
  addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
  }); // HELPERS

  function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
      return input;
    }

    if (!isNaN(input)) {
      return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);

    if (typeof input === 'number') {
      return input;
    }

    return null;
  }

  function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
      return locale.weekdaysParse(input) % 7 || 7;
    }

    return isNaN(input) ? null : input;
  } // LOCALES


  function shiftWeekdays(ws, n) {
    return ws.slice(n, 7).concat(ws.slice(0, n));
  }

  var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');

  function localeWeekdays(m, format) {
    var weekdays = isArray(this._weekdays) ? this._weekdays : this._weekdays[m && m !== true && this._weekdays.isFormat.test(format) ? 'format' : 'standalone'];
    return m === true ? shiftWeekdays(weekdays, this._week.dow) : m ? weekdays[m.day()] : weekdays;
  }

  var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');

  function localeWeekdaysShort(m) {
    return m === true ? shiftWeekdays(this._weekdaysShort, this._week.dow) : m ? this._weekdaysShort[m.day()] : this._weekdaysShort;
  }

  var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');

  function localeWeekdaysMin(m) {
    return m === true ? shiftWeekdays(this._weekdaysMin, this._week.dow) : m ? this._weekdaysMin[m.day()] : this._weekdaysMin;
  }

  function handleStrictParse$1(weekdayName, format, strict) {
    var i,
        ii,
        mom,
        llc = weekdayName.toLocaleLowerCase();

    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._minWeekdaysParse = [];

      for (i = 0; i < 7; ++i) {
        mom = createUTC([2000, 1]).day(i);
        this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
        this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
        this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
      }
    }

    if (strict) {
      if (format === 'dddd') {
        ii = indexOf.call(this._weekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'dddd') {
        ii = indexOf.call(this._weekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._shortWeekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf.call(this._shortWeekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._weekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._weekdaysParse, llc);

        if (ii !== -1) {
          return ii;
        }

        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }

  function localeWeekdaysParse(weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
      return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._minWeekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, 1]).day(i);

      if (strict && !this._fullWeekdaysParse[i]) {
        this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
        this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
        this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
      }

      if (!this._weekdaysParse[i]) {
        regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
        this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
      } // test the regex


      if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
        return i;
      }
    }
  } // MOMENTS


  function getSetDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }

    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();

    if (input != null) {
      input = parseWeekday(input, this.localeData());
      return this.add(input - day, 'd');
    } else {
      return day;
    }
  }

  function getSetLocaleDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }

    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
  }

  function getSetISODayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    } // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.


    if (input != null) {
      var weekday = parseIsoWeekday(input, this.localeData());
      return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
      return this.day() || 7;
    }
  }

  var defaultWeekdaysRegex = matchWord;

  function weekdaysRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }

      if (isStrict) {
        return this._weekdaysStrictRegex;
      } else {
        return this._weekdaysRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        this._weekdaysRegex = defaultWeekdaysRegex;
      }

      return this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex;
    }
  }

  var defaultWeekdaysShortRegex = matchWord;

  function weekdaysShortRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }

      if (isStrict) {
        return this._weekdaysShortStrictRegex;
      } else {
        return this._weekdaysShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysShortRegex')) {
        this._weekdaysShortRegex = defaultWeekdaysShortRegex;
      }

      return this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
  }

  var defaultWeekdaysMinRegex = matchWord;

  function weekdaysMinRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }

      if (isStrict) {
        return this._weekdaysMinStrictRegex;
      } else {
        return this._weekdaysMinRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysMinRegex')) {
        this._weekdaysMinRegex = defaultWeekdaysMinRegex;
      }

      return this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
  }

  function computeWeekdaysParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }

    var minPieces = [],
        shortPieces = [],
        longPieces = [],
        mixedPieces = [],
        i,
        mom,
        minp,
        shortp,
        longp;

    for (i = 0; i < 7; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, 1]).day(i);
      minp = this.weekdaysMin(mom, '');
      shortp = this.weekdaysShort(mom, '');
      longp = this.weekdays(mom, '');
      minPieces.push(minp);
      shortPieces.push(shortp);
      longPieces.push(longp);
      mixedPieces.push(minp);
      mixedPieces.push(shortp);
      mixedPieces.push(longp);
    } // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.


    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);

    for (i = 0; i < 7; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;
    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
  } // FORMATTING


  function hFormat() {
    return this.hours() % 12 || 12;
  }

  function kFormat() {
    return this.hours() || 24;
  }

  addFormatToken('H', ['HH', 2], 0, 'hour');
  addFormatToken('h', ['hh', 2], 0, hFormat);
  addFormatToken('k', ['kk', 2], 0, kFormat);
  addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
  });
  addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });
  addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
  });
  addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });

  function meridiem(token, lowercase) {
    addFormatToken(token, 0, 0, function () {
      return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
  }

  meridiem('a', true);
  meridiem('A', false); // ALIASES

  addUnitAlias('hour', 'h'); // PRIORITY

  addUnitPriority('hour', 13); // PARSING

  function matchMeridiem(isStrict, locale) {
    return locale._meridiemParse;
  }

  addRegexToken('a', matchMeridiem);
  addRegexToken('A', matchMeridiem);
  addRegexToken('H', match1to2);
  addRegexToken('h', match1to2);
  addRegexToken('k', match1to2);
  addRegexToken('HH', match1to2, match2);
  addRegexToken('hh', match1to2, match2);
  addRegexToken('kk', match1to2, match2);
  addRegexToken('hmm', match3to4);
  addRegexToken('hmmss', match5to6);
  addRegexToken('Hmm', match3to4);
  addRegexToken('Hmmss', match5to6);
  addParseToken(['H', 'HH'], HOUR);
  addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
  });
  addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
  });
  addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
  });
  addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
  }); // LOCALES

  function localeIsPM(input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return (input + '').toLowerCase().charAt(0) === 'p';
  }

  var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;

  function localeMeridiem(hours, minutes, isLower) {
    if (hours > 11) {
      return isLower ? 'pm' : 'PM';
    } else {
      return isLower ? 'am' : 'AM';
    }
  } // MOMENTS
  // Setting the hour should keep the time, because the user explicitly
  // specified which hour they want. So trying to maintain the same hour (in
  // a new timezone) makes sense. Adding/subtracting hours does not follow
  // this rule.


  var getSetHour = makeGetSet('Hours', true);
  var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,
    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,
    week: defaultLocaleWeek,
    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,
    meridiemParse: defaultLocaleMeridiemParse
  }; // internal storage for locale config files

  var locales = {};
  var localeFamilies = {};
  var globalLocale;

  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  } // pick the locale from the array
  // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
  // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root


  function chooseLocale(names) {
    var i = 0,
        j,
        next,
        locale,
        split;

    while (i < names.length) {
      split = normalizeLocale(names[i]).split('-');
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split('-') : null;

      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join('-'));

        if (locale) {
          return locale;
        }

        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          //the next array item is better than a shallower substring of this one
          break;
        }

        j--;
      }

      i++;
    }

    return globalLocale;
  }

  function loadLocale(name) {
    var oldLocale = null; // TODO: Find a better way to register and load all the locales in Node

    if (!locales[name] && typeof module !== 'undefined' && module && module.exports) {
      try {
        oldLocale = globalLocale._abbr;
        var aliasedRequire = require;
        aliasedRequire('./locale/' + name);
        getSetGlobalLocale(oldLocale);
      } catch (e) {}
    }

    return locales[name];
  } // This function will load locale and then set the global locale.  If
  // no arguments are passed in, it will simply return the current global
  // locale key.


  function getSetGlobalLocale(key, values) {
    var data;

    if (key) {
      if (isUndefined(values)) {
        data = getLocale(key);
      } else {
        data = defineLocale(key, values);
      }

      if (data) {
        // moment.duration._locale = moment._locale = data;
        globalLocale = data;
      } else {
        if (typeof console !== 'undefined' && console.warn) {
          //warn user if arguments are passed but the locale could not be set
          console.warn('Locale ' + key + ' not found. Did you forget to load it?');
        }
      }
    }

    return globalLocale._abbr;
  }

  function defineLocale(name, config) {
    if (config !== null) {
      var locale,
          parentConfig = baseConfig;
      config.abbr = name;

      if (locales[name] != null) {
        deprecateSimple('defineLocaleOverride', 'use moment.updateLocale(localeName, config) to change ' + 'an existing locale. moment.defineLocale(localeName, ' + 'config) should only be used for creating a new locale ' + 'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
        parentConfig = locales[name]._config;
      } else if (config.parentLocale != null) {
        if (locales[config.parentLocale] != null) {
          parentConfig = locales[config.parentLocale]._config;
        } else {
          locale = loadLocale(config.parentLocale);

          if (locale != null) {
            parentConfig = locale._config;
          } else {
            if (!localeFamilies[config.parentLocale]) {
              localeFamilies[config.parentLocale] = [];
            }

            localeFamilies[config.parentLocale].push({
              name: name,
              config: config
            });
            return null;
          }
        }
      }

      locales[name] = new Locale(mergeConfigs(parentConfig, config));

      if (localeFamilies[name]) {
        localeFamilies[name].forEach(function (x) {
          defineLocale(x.name, x.config);
        });
      } // backwards compat for now: also set the locale
      // make sure we set the locale AFTER all child locales have been
      // created, so we won't end up with the child locale set.


      getSetGlobalLocale(name);
      return locales[name];
    } else {
      // useful for testing
      delete locales[name];
      return null;
    }
  }

  function updateLocale(name, config) {
    if (config != null) {
      var locale,
          tmpLocale,
          parentConfig = baseConfig; // MERGE

      tmpLocale = loadLocale(name);

      if (tmpLocale != null) {
        parentConfig = tmpLocale._config;
      }

      config = mergeConfigs(parentConfig, config);
      locale = new Locale(config);
      locale.parentLocale = locales[name];
      locales[name] = locale; // backwards compat for now: also set the locale

      getSetGlobalLocale(name);
    } else {
      // pass null for config to unupdate, useful for tests
      if (locales[name] != null) {
        if (locales[name].parentLocale != null) {
          locales[name] = locales[name].parentLocale;
        } else if (locales[name] != null) {
          delete locales[name];
        }
      }
    }

    return locales[name];
  } // returns locale data


  function getLocale(key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }

    if (!key) {
      return globalLocale;
    }

    if (!isArray(key)) {
      //short-circuit everything else
      locale = loadLocale(key);

      if (locale) {
        return locale;
      }

      key = [key];
    }

    return chooseLocale(key);
  }

  function listLocales() {
    return keys(locales);
  }

  function checkOverflow(m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
      overflow = a[MONTH] < 0 || a[MONTH] > 11 ? MONTH : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE : a[HOUR] < 0 || a[HOUR] > 24 || a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0) ? HOUR : a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE : a[SECOND] < 0 || a[SECOND] > 59 ? SECOND : a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND : -1;

      if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }

      if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
        overflow = WEEK;
      }

      if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
        overflow = WEEKDAY;
      }

      getParsingFlags(m).overflow = overflow;
    }

    return m;
  } // Pick the first defined of two or three arguments.


  function defaults(a, b, c) {
    if (a != null) {
      return a;
    }

    if (b != null) {
      return b;
    }

    return c;
  }

  function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());

    if (config._useUTC) {
      return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }

    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
  } // convert an array to a date.
  // the array should mirror the parameters below
  // note: all values past the year are optional and will default to the lowest possible value.
  // [year, month, day , hour, minute, second, millisecond]


  function configFromArray(config) {
    var i,
        date,
        input = [],
        currentDate,
        expectedWeekday,
        yearToUse;

    if (config._d) {
      return;
    }

    currentDate = currentDateArray(config); //compute day of the year from weeks and weekdays

    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      dayOfYearFromWeekInfo(config);
    } //if the day of the year is set, figure out what it is


    if (config._dayOfYear != null) {
      yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

      if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
        getParsingFlags(config)._overflowDayOfYear = true;
      }

      date = createUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    } // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything


    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    } // Zero out whatever was not defaulted, including time


    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    } // Check for 24:00:00.000


    if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0) {
      config._nextDay = true;
      config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay(); // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.

    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
      config._a[HOUR] = 24;
    } // check for mismatching day of week


    if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
      getParsingFlags(config).weekdayMismatch = true;
    }
  }

  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;
    w = config._w;

    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4; // TODO: We need to take the current isoWeekYear, but that depends on
      // how we interpret now (local, utc, fixed offset). So create
      // a now version of current config (take local/utc/offset flags, and
      // create now).

      weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
      week = defaults(w.W, 1);
      weekday = defaults(w.E, 1);

      if (weekday < 1 || weekday > 7) {
        weekdayOverflow = true;
      }
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;
      var curWeek = weekOfYear(createLocal(), dow, doy);
      weekYear = defaults(w.gg, config._a[YEAR], curWeek.year); // Default to current week.

      week = defaults(w.w, curWeek.week);

      if (w.d != null) {
        // weekday -- low day numbers are considered next week
        weekday = w.d;

        if (weekday < 0 || weekday > 6) {
          weekdayOverflow = true;
        }
      } else if (w.e != null) {
        // local weekday -- counting starts from beginning of week
        weekday = w.e + dow;

        if (w.e < 0 || w.e > 6) {
          weekdayOverflow = true;
        }
      } else {
        // default to beginning of week
        weekday = dow;
      }
    }

    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
      getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
      getParsingFlags(config)._overflowWeekday = true;
    } else {
      temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
  } // iso 8601 regex
  // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)


  var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
  var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
  var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;
  var isoDates = [['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/], ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/], ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/], ['GGGG-[W]WW', /\d{4}-W\d\d/, false], ['YYYY-DDD', /\d{4}-\d{3}/], ['YYYY-MM', /\d{4}-\d\d/, false], ['YYYYYYMMDD', /[+-]\d{10}/], ['YYYYMMDD', /\d{8}/], // YYYYMM is NOT allowed by the standard
  ['GGGG[W]WWE', /\d{4}W\d{3}/], ['GGGG[W]WW', /\d{4}W\d{2}/, false], ['YYYYDDD', /\d{7}/]]; // iso time formats and regexes

  var isoTimes = [['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/], ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/], ['HH:mm:ss', /\d\d:\d\d:\d\d/], ['HH:mm', /\d\d:\d\d/], ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/], ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/], ['HHmmss', /\d\d\d\d\d\d/], ['HHmm', /\d\d\d\d/], ['HH', /\d\d/]];
  var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i; // date from iso format

  function configFromISO(config) {
    var i,
        l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime,
        dateFormat,
        timeFormat,
        tzFormat;

    if (match) {
      getParsingFlags(config).iso = true;

      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(match[1])) {
          dateFormat = isoDates[i][0];
          allowTime = isoDates[i][2] !== false;
          break;
        }
      }

      if (dateFormat == null) {
        config._isValid = false;
        return;
      }

      if (match[3]) {
        for (i = 0, l = isoTimes.length; i < l; i++) {
          if (isoTimes[i][1].exec(match[3])) {
            // match[2] should be 'T' or space
            timeFormat = (match[2] || ' ') + isoTimes[i][0];
            break;
          }
        }

        if (timeFormat == null) {
          config._isValid = false;
          return;
        }
      }

      if (!allowTime && timeFormat != null) {
        config._isValid = false;
        return;
      }

      if (match[4]) {
        if (tzRegex.exec(match[4])) {
          tzFormat = 'Z';
        } else {
          config._isValid = false;
          return;
        }
      }

      config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
      configFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  } // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3


  var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

  function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
    var result = [untruncateYear(yearStr), defaultLocaleMonthsShort.indexOf(monthStr), parseInt(dayStr, 10), parseInt(hourStr, 10), parseInt(minuteStr, 10)];

    if (secondStr) {
      result.push(parseInt(secondStr, 10));
    }

    return result;
  }

  function untruncateYear(yearStr) {
    var year = parseInt(yearStr, 10);

    if (year <= 49) {
      return 2000 + year;
    } else if (year <= 999) {
      return 1900 + year;
    }

    return year;
  }

  function preprocessRFC2822(s) {
    // Remove comments and folding whitespace and replace multiple-spaces with a single space
    return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }

  function checkWeekday(weekdayStr, parsedInput, config) {
    if (weekdayStr) {
      // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
      var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
          weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();

      if (weekdayProvided !== weekdayActual) {
        getParsingFlags(config).weekdayMismatch = true;
        config._isValid = false;
        return false;
      }
    }

    return true;
  }

  var obsOffsets = {
    UT: 0,
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
  };

  function calculateOffset(obsOffset, militaryOffset, numOffset) {
    if (obsOffset) {
      return obsOffsets[obsOffset];
    } else if (militaryOffset) {
      // the only allowed military tz is Z
      return 0;
    } else {
      var hm = parseInt(numOffset, 10);
      var m = hm % 100,
          h = (hm - m) / 100;
      return h * 60 + m;
    }
  } // date and time from ref 2822 format


  function configFromRFC2822(config) {
    var match = rfc2822.exec(preprocessRFC2822(config._i));

    if (match) {
      var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);

      if (!checkWeekday(match[1], parsedArray, config)) {
        return;
      }

      config._a = parsedArray;
      config._tzm = calculateOffset(match[8], match[9], match[10]);
      config._d = createUTCDate.apply(null, config._a);

      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

      getParsingFlags(config).rfc2822 = true;
    } else {
      config._isValid = false;
    }
  } // date from iso format or fallback


  function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
      config._d = new Date(+matched[1]);
      return;
    }

    configFromISO(config);

    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }

    configFromRFC2822(config);

    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    } // Final attempt, use Input Fallback


    hooks.createFromInputFallback(config);
  }

  hooks.createFromInputFallback = deprecate('value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' + 'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' + 'discouraged and will be removed in an upcoming major release. Please refer to ' + 'http://momentjs.com/guides/#/warnings/js-date/ for more info.', function (config) {
    config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
  }); // constant that refers to the ISO standard

  hooks.ISO_8601 = function () {}; // constant that refers to the RFC 2822 form


  hooks.RFC_2822 = function () {}; // date from string and format string


  function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
      configFromISO(config);
      return;
    }

    if (config._f === hooks.RFC_2822) {
      configFromRFC2822(config);
      return;
    }

    config._a = [];
    getParsingFlags(config).empty = true; // This array is used to make a Date, either with `new Date` or `Date.UTC`

    var string = '' + config._i,
        i,
        parsedInput,
        tokens,
        token,
        skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;
    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0]; // console.log('token', token, 'parsedInput', parsedInput,
      //         'regex', getParseRegexForToken(token, config));

      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));

        if (skipped.length > 0) {
          getParsingFlags(config).unusedInput.push(skipped);
        }

        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      } // don't parse if it's not a known token


      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          getParsingFlags(config).empty = false;
        } else {
          getParsingFlags(config).unusedTokens.push(token);
        }

        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        getParsingFlags(config).unusedTokens.push(token);
      }
    } // add remaining unparsed input length to the string


    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;

    if (string.length > 0) {
      getParsingFlags(config).unusedInput.push(string);
    } // clear _12h flag if hour is <= 12


    if (config._a[HOUR] <= 12 && getParsingFlags(config).bigHour === true && config._a[HOUR] > 0) {
      getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem; // handle meridiem

    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);
    configFromArray(config);
    checkOverflow(config);
  }

  function meridiemFixWrap(locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
      // nothing to do
      return hour;
    }

    if (locale.meridiemHour != null) {
      return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
      // Fallback
      isPm = locale.isPM(meridiem);

      if (isPm && hour < 12) {
        hour += 12;
      }

      if (!isPm && hour === 12) {
        hour = 0;
      }

      return hour;
    } else {
      // this is not supposed to happen
      return hour;
    }
  } // date from string and array of format strings


  function configFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;

    if (config._f.length === 0) {
      getParsingFlags(config).invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }

    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = copyConfig({}, config);

      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }

      tempConfig._f = config._f[i];
      configFromStringAndFormat(tempConfig);

      if (!isValid(tempConfig)) {
        continue;
      } // if there is any input that was not parsed add a penalty for that format


      currentScore += getParsingFlags(tempConfig).charsLeftOver; //or tokens

      currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;
      getParsingFlags(tempConfig).score = currentScore;

      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }

    extend(config, bestMoment || tempConfig);
  }

  function configFromObject(config) {
    if (config._d) {
      return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
      return obj && parseInt(obj, 10);
    });
    configFromArray(config);
  }

  function createFromConfig(config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));

    if (res._nextDay) {
      // Adding is smart enough around DST
      res.add(1, 'd');
      res._nextDay = undefined;
    }

    return res;
  }

  function prepareConfig(config) {
    var input = config._i,
        format = config._f;
    config._locale = config._locale || getLocale(config._l);

    if (input === null || format === undefined && input === '') {
      return createInvalid({
        nullInput: true
      });
    }

    if (typeof input === 'string') {
      config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
      return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
      config._d = input;
    } else if (isArray(format)) {
      configFromStringAndArray(config);
    } else if (format) {
      configFromStringAndFormat(config);
    } else {
      configFromInput(config);
    }

    if (!isValid(config)) {
      config._d = null;
    }

    return config;
  }

  function configFromInput(config) {
    var input = config._i;

    if (isUndefined(input)) {
      config._d = new Date(hooks.now());
    } else if (isDate(input)) {
      config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
      configFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function (obj) {
        return parseInt(obj, 10);
      });
      configFromArray(config);
    } else if (isObject(input)) {
      configFromObject(config);
    } else if (isNumber(input)) {
      // from milliseconds
      config._d = new Date(input);
    } else {
      hooks.createFromInputFallback(config);
    }
  }

  function createLocalOrUTC(input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
      strict = locale;
      locale = undefined;
    }

    if (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) {
      input = undefined;
    } // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423


    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;
    return createFromConfig(c);
  }

  function createLocal(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
  }

  var prototypeMin = deprecate('moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);

    if (this.isValid() && other.isValid()) {
      return other < this ? this : other;
    } else {
      return createInvalid();
    }
  });
  var prototypeMax = deprecate('moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);

    if (this.isValid() && other.isValid()) {
      return other > this ? this : other;
    } else {
      return createInvalid();
    }
  }); // Pick a moment m from moments so that m[fn](other) is true for all
  // other. This relies on the function fn to be transitive.
  //
  // moments should either be an array of moment objects or an array, whose
  // first element is an array of moment objects.

  function pickBy(fn, moments) {
    var res, i;

    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }

    if (!moments.length) {
      return createLocal();
    }

    res = moments[0];

    for (i = 1; i < moments.length; ++i) {
      if (!moments[i].isValid() || moments[i][fn](res)) {
        res = moments[i];
      }
    }

    return res;
  } // TODO: Use [].sort instead?


  function min() {
    var args = [].slice.call(arguments, 0);
    return pickBy('isBefore', args);
  }

  function max() {
    var args = [].slice.call(arguments, 0);
    return pickBy('isAfter', args);
  }

  var now = function now() {
    return Date.now ? Date.now() : +new Date();
  };

  var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

  function isDurationValid(m) {
    for (var key in m) {
      if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
        return false;
      }
    }

    var unitHasDecimal = false;

    for (var i = 0; i < ordering.length; ++i) {
      if (m[ordering[i]]) {
        if (unitHasDecimal) {
          return false; // only allow non-integers for smallest unit
        }

        if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
          unitHasDecimal = true;
        }
      }
    }

    return true;
  }

  function isValid$1() {
    return this._isValid;
  }

  function createInvalid$1() {
    return createDuration(NaN);
  }

  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;
    this._isValid = isDurationValid(normalizedInput); // representation for dateAddRemove

    this._milliseconds = +milliseconds + seconds * 1e3 + // 1000
    minutes * 6e4 + // 1000 * 60
    hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately

    this._days = +days + weeks * 7; // It is impossible to translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.

    this._months = +months + quarters * 3 + years * 12;
    this._data = {};
    this._locale = getLocale();

    this._bubble();
  }

  function isDuration(obj) {
    return obj instanceof Duration;
  }

  function absRound(number) {
    if (number < 0) {
      return Math.round(-1 * number) * -1;
    } else {
      return Math.round(number);
    }
  } // FORMATTING


  function offset(token, separator) {
    addFormatToken(token, 0, 0, function () {
      var offset = this.utcOffset();
      var sign = '+';

      if (offset < 0) {
        offset = -offset;
        sign = '-';
      }

      return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~offset % 60, 2);
    });
  }

  offset('Z', ':');
  offset('ZZ', ''); // PARSING

  addRegexToken('Z', matchShortOffset);
  addRegexToken('ZZ', matchShortOffset);
  addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
  }); // HELPERS
  // timezone chunker
  // '+10:00' > ['10',  '00']
  // '-1530'  > ['-15', '30']

  var chunkOffset = /([\+\-]|\d\d)/gi;

  function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
      return null;
    }

    var chunk = matches[matches.length - 1] || [];
    var parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);
    return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
  } // Return a moment from input, that is local/utc/zone equivalent to model.


  function cloneWithOffset(input, model) {
    var res, diff;

    if (model._isUTC) {
      res = model.clone();
      diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf(); // Use low-level api, because this fn is low-level api.

      res._d.setTime(res._d.valueOf() + diff);

      hooks.updateOffset(res, false);
      return res;
    } else {
      return createLocal(input).local();
    }
  }

  function getDateOffset(m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
  } // HOOKS
  // This function will be called whenever a moment is mutated.
  // It is intended to keep the offset in sync with the timezone.


  hooks.updateOffset = function () {}; // MOMENTS
  // keepLocalTime = true means only change the timezone, without
  // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
  // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
  // +0200, so we adjust the time as needed, to be valid.
  //
  // Keeping the time actually adds/subtracts (one hour)
  // from the actual represented time. That is why we call updateOffset
  // a second time. In case it wants us to change the offset again
  // _changeInProgress == true case, then we have to adjust, because
  // there is no such time in the given timezone.


  function getSetOffset(input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0,
        localAdjust;

    if (!this.isValid()) {
      return input != null ? this : NaN;
    }

    if (input != null) {
      if (typeof input === 'string') {
        input = offsetFromString(matchShortOffset, input);

        if (input === null) {
          return this;
        }
      } else if (Math.abs(input) < 16 && !keepMinutes) {
        input = input * 60;
      }

      if (!this._isUTC && keepLocalTime) {
        localAdjust = getDateOffset(this);
      }

      this._offset = input;
      this._isUTC = true;

      if (localAdjust != null) {
        this.add(localAdjust, 'm');
      }

      if (offset !== input) {
        if (!keepLocalTime || this._changeInProgress) {
          addSubtract(this, createDuration(input - offset, 'm'), 1, false);
        } else if (!this._changeInProgress) {
          this._changeInProgress = true;
          hooks.updateOffset(this, true);
          this._changeInProgress = null;
        }
      }

      return this;
    } else {
      return this._isUTC ? offset : getDateOffset(this);
    }
  }

  function getSetZone(input, keepLocalTime) {
    if (input != null) {
      if (typeof input !== 'string') {
        input = -input;
      }

      this.utcOffset(input, keepLocalTime);
      return this;
    } else {
      return -this.utcOffset();
    }
  }

  function setOffsetToUTC(keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
  }

  function setOffsetToLocal(keepLocalTime) {
    if (this._isUTC) {
      this.utcOffset(0, keepLocalTime);
      this._isUTC = false;

      if (keepLocalTime) {
        this.subtract(getDateOffset(this), 'm');
      }
    }

    return this;
  }

  function setOffsetToParsedOffset() {
    if (this._tzm != null) {
      this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
      var tZone = offsetFromString(matchOffset, this._i);

      if (tZone != null) {
        this.utcOffset(tZone);
      } else {
        this.utcOffset(0, true);
      }
    }

    return this;
  }

  function hasAlignedHourOffset(input) {
    if (!this.isValid()) {
      return false;
    }

    input = input ? createLocal(input).utcOffset() : 0;
    return (this.utcOffset() - input) % 60 === 0;
  }

  function isDaylightSavingTime() {
    return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
  }

  function isDaylightSavingTimeShifted() {
    if (!isUndefined(this._isDSTShifted)) {
      return this._isDSTShifted;
    }

    var c = {};
    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
      var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
      this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0;
    } else {
      this._isDSTShifted = false;
    }

    return this._isDSTShifted;
  }

  function isLocal() {
    return this.isValid() ? !this._isUTC : false;
  }

  function isUtcOffset() {
    return this.isValid() ? this._isUTC : false;
  }

  function isUtc() {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
  } // ASP.NET json date format regex


  var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/; // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
  // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
  // and further modified to allow for strings containing both week and day

  var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

  function createDuration(input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
    match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (isNumber(input)) {
      duration = {};

      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match

      };
    } else if (!!(match = isoRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: parseIso(match[2], sign),
        M: parseIso(match[3], sign),
        w: parseIso(match[4], sign),
        d: parseIso(match[5], sign),
        h: parseIso(match[6], sign),
        m: parseIso(match[7], sign),
        s: parseIso(match[8], sign)
      };
    } else if (duration == null) {
      // checks for null or undefined
      duration = {};
    } else if (_typeof(duration) === 'object' && ('from' in duration || 'to' in duration)) {
      diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));
      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
      ret._locale = input._locale;
    }

    return ret;
  }

  createDuration.fn = Duration.prototype;
  createDuration.invalid = createInvalid$1;

  function parseIso(inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.')); // apply sign while we're at it

    return (isNaN(res) ? 0 : res) * sign;
  }

  function positiveMomentsDifference(base, other) {
    var res = {};
    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;

    if (base.clone().add(res.months, 'M').isAfter(other)) {
      --res.months;
    }

    res.milliseconds = +other - +base.clone().add(res.months, 'M');
    return res;
  }

  function momentsDifference(base, other) {
    var res;

    if (!(base.isValid() && other.isValid())) {
      return {
        milliseconds: 0,
        months: 0
      };
    }

    other = cloneWithOffset(other, base);

    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }

    return res;
  } // TODO: remove 'name' arg after deprecation is removed


  function createAdder(direction, name) {
    return function (val, period) {
      var dur, tmp; //invert the arguments, but complain about it

      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' + 'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
        tmp = val;
        val = period;
        period = tmp;
      }

      val = typeof val === 'string' ? +val : val;
      dur = createDuration(val, period);
      addSubtract(this, dur, direction);
      return this;
    };
  }

  function addSubtract(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
      // No op
      return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (months) {
      setMonth(mom, get(mom, 'Month') + months * isAdding);
    }

    if (days) {
      set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }

    if (milliseconds) {
      mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }

    if (updateOffset) {
      hooks.updateOffset(mom, days || months);
    }
  }

  var add = createAdder(1, 'add');
  var subtract = createAdder(-1, 'subtract');

  function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
  }

  function calendar$1(time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';
    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);
    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
  }

  function clone() {
    return new Moment(this);
  }

  function isAfter(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);

    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }

    units = normalizeUnits(units) || 'millisecond';

    if (units === 'millisecond') {
      return this.valueOf() > localInput.valueOf();
    } else {
      return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
  }

  function isBefore(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);

    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }

    units = normalizeUnits(units) || 'millisecond';

    if (units === 'millisecond') {
      return this.valueOf() < localInput.valueOf();
    } else {
      return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
  }

  function isBetween(from, to, units, inclusivity) {
    var localFrom = isMoment(from) ? from : createLocal(from),
        localTo = isMoment(to) ? to : createLocal(to);

    if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
      return false;
    }

    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) && (inclusivity[1] === ')' ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
  }

  function isSame(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;

    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }

    units = normalizeUnits(units) || 'millisecond';

    if (units === 'millisecond') {
      return this.valueOf() === localInput.valueOf();
    } else {
      inputMs = localInput.valueOf();
      return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
  }

  function isSameOrAfter(input, units) {
    return this.isSame(input, units) || this.isAfter(input, units);
  }

  function isSameOrBefore(input, units) {
    return this.isSame(input, units) || this.isBefore(input, units);
  }

  function diff(input, units, asFloat) {
    var that, zoneDelta, output;

    if (!this.isValid()) {
      return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
      return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;
    units = normalizeUnits(units);

    switch (units) {
      case 'year':
        output = monthDiff(this, that) / 12;
        break;

      case 'month':
        output = monthDiff(this, that);
        break;

      case 'quarter':
        output = monthDiff(this, that) / 3;
        break;

      case 'second':
        output = (this - that) / 1e3;
        break;
      // 1000

      case 'minute':
        output = (this - that) / 6e4;
        break;
      // 1000 * 60

      case 'hour':
        output = (this - that) / 36e5;
        break;
      // 1000 * 60 * 60

      case 'day':
        output = (this - that - zoneDelta) / 864e5;
        break;
      // 1000 * 60 * 60 * 24, negate dst

      case 'week':
        output = (this - that - zoneDelta) / 6048e5;
        break;
      // 1000 * 60 * 60 * 24 * 7, negate dst

      default:
        output = this - that;
    }

    return asFloat ? output : absFloor(output);
  }

  function monthDiff(a, b) {
    // difference in months
    var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
    anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2,
        adjust;

    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, 'months'); // linear across the month

      adjust = (b - anchor) / (anchor - anchor2);
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, 'months'); // linear across the month

      adjust = (b - anchor) / (anchor2 - anchor);
    } //check for negative zero, return zero if negative zero


    return -(wholeMonthDiff + adjust) || 0;
  }

  hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
  hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

  function toString() {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
  }

  function toISOString(keepOffset) {
    if (!this.isValid()) {
      return null;
    }

    var utc = keepOffset !== true;
    var m = utc ? this.clone().utc() : this;

    if (m.year() < 0 || m.year() > 9999) {
      return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }

    if (isFunction(Date.prototype.toISOString)) {
      // native implementation is ~50x faster, use it when we can
      if (utc) {
        return this.toDate().toISOString();
      } else {
        return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
      }
    }

    return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
  }
  /**
   * Return a human readable representation of a moment that can
   * also be evaluated to get a new moment which is the same
   *
   * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
   */


  function inspect() {
    if (!this.isValid()) {
      return 'moment.invalid(/* ' + this._i + ' */)';
    }

    var func = 'moment';
    var zone = '';

    if (!this.isLocal()) {
      func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
      zone = 'Z';
    }

    var prefix = '[' + func + '("]';
    var year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';
    return this.format(prefix + year + datetime + suffix);
  }

  function format(inputString) {
    if (!inputString) {
      inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }

    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
  }

  function from(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({
        to: this,
        from: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function fromNow(withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
  }

  function to(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({
        from: this,
        to: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function toNow(withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
  } // If passed a locale key, it will set the locale for this
  // instance.  Otherwise, it will return the locale configuration
  // variables for this instance.


  function locale(key) {
    var newLocaleData;

    if (key === undefined) {
      return this._locale._abbr;
    } else {
      newLocaleData = getLocale(key);

      if (newLocaleData != null) {
        this._locale = newLocaleData;
      }

      return this;
    }
  }

  var lang = deprecate('moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.', function (key) {
    if (key === undefined) {
      return this.localeData();
    } else {
      return this.locale(key);
    }
  });

  function localeData() {
    return this._locale;
  }

  var MS_PER_SECOND = 1000;
  var MS_PER_MINUTE = 60 * MS_PER_SECOND;
  var MS_PER_HOUR = 60 * MS_PER_MINUTE;
  var MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR; // actual modulo - handles negative numbers (for dates before 1970):

  function mod$1(dividend, divisor) {
    return (dividend % divisor + divisor) % divisor;
  }

  function localStartOfDate(y, m, d) {
    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0) {
      // preserve leap years using a full 400 year cycle, then reset
      return new Date(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return new Date(y, m, d).valueOf();
    }
  }

  function utcStartOfDate(y, m, d) {
    // Date.UTC remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0) {
      // preserve leap years using a full 400 year cycle, then reset
      return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return Date.UTC(y, m, d);
    }
  }

  function startOf(units) {
    var time;
    units = normalizeUnits(units);

    if (units === undefined || units === 'millisecond' || !this.isValid()) {
      return this;
    }

    var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

    switch (units) {
      case 'year':
        time = startOfDate(this.year(), 0, 1);
        break;

      case 'quarter':
        time = startOfDate(this.year(), this.month() - this.month() % 3, 1);
        break;

      case 'month':
        time = startOfDate(this.year(), this.month(), 1);
        break;

      case 'week':
        time = startOfDate(this.year(), this.month(), this.date() - this.weekday());
        break;

      case 'isoWeek':
        time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
        break;

      case 'day':
      case 'date':
        time = startOfDate(this.year(), this.month(), this.date());
        break;

      case 'hour':
        time = this._d.valueOf();
        time -= mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR);
        break;

      case 'minute':
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_MINUTE);
        break;

      case 'second':
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_SECOND);
        break;
    }

    this._d.setTime(time);

    hooks.updateOffset(this, true);
    return this;
  }

  function endOf(units) {
    var time;
    units = normalizeUnits(units);

    if (units === undefined || units === 'millisecond' || !this.isValid()) {
      return this;
    }

    var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

    switch (units) {
      case 'year':
        time = startOfDate(this.year() + 1, 0, 1) - 1;
        break;

      case 'quarter':
        time = startOfDate(this.year(), this.month() - this.month() % 3 + 3, 1) - 1;
        break;

      case 'month':
        time = startOfDate(this.year(), this.month() + 1, 1) - 1;
        break;

      case 'week':
        time = startOfDate(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
        break;

      case 'isoWeek':
        time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
        break;

      case 'day':
      case 'date':
        time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
        break;

      case 'hour':
        time = this._d.valueOf();
        time += MS_PER_HOUR - mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR) - 1;
        break;

      case 'minute':
        time = this._d.valueOf();
        time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
        break;

      case 'second':
        time = this._d.valueOf();
        time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
        break;
    }

    this._d.setTime(time);

    hooks.updateOffset(this, true);
    return this;
  }

  function valueOf() {
    return this._d.valueOf() - (this._offset || 0) * 60000;
  }

  function unix() {
    return Math.floor(this.valueOf() / 1000);
  }

  function toDate() {
    return new Date(this.valueOf());
  }

  function toArray() {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
  }

  function toObject() {
    var m = this;
    return {
      years: m.year(),
      months: m.month(),
      date: m.date(),
      hours: m.hours(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      milliseconds: m.milliseconds()
    };
  }

  function toJSON() {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
  }

  function isValid$2() {
    return isValid(this);
  }

  function parsingFlags() {
    return extend({}, getParsingFlags(this));
  }

  function invalidAt() {
    return getParsingFlags(this).overflow;
  }

  function creationData() {
    return {
      input: this._i,
      format: this._f,
      locale: this._locale,
      isUTC: this._isUTC,
      strict: this._strict
    };
  } // FORMATTING


  addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
  });
  addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
  });

  function addWeekYearFormatToken(token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
  }

  addWeekYearFormatToken('gggg', 'weekYear');
  addWeekYearFormatToken('ggggg', 'weekYear');
  addWeekYearFormatToken('GGGG', 'isoWeekYear');
  addWeekYearFormatToken('GGGGG', 'isoWeekYear'); // ALIASES

  addUnitAlias('weekYear', 'gg');
  addUnitAlias('isoWeekYear', 'GG'); // PRIORITY

  addUnitPriority('weekYear', 1);
  addUnitPriority('isoWeekYear', 1); // PARSING

  addRegexToken('G', matchSigned);
  addRegexToken('g', matchSigned);
  addRegexToken('GG', match1to2, match2);
  addRegexToken('gg', match1to2, match2);
  addRegexToken('GGGG', match1to4, match4);
  addRegexToken('gggg', match1to4, match4);
  addRegexToken('GGGGG', match1to6, match6);
  addRegexToken('ggggg', match1to6, match6);
  addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
  });
  addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
  }); // MOMENTS

  function getSetWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy);
  }

  function getSetISOWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.isoWeek(), this.isoWeekday(), 1, 4);
  }

  function getISOWeeksInYear() {
    return weeksInYear(this.year(), 1, 4);
  }

  function getWeeksInYear() {
    var weekInfo = this.localeData()._week;

    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
  }

  function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;

    if (input == null) {
      return weekOfYear(this, dow, doy).year;
    } else {
      weeksTarget = weeksInYear(input, dow, doy);

      if (week > weeksTarget) {
        week = weeksTarget;
      }

      return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
  }

  function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);
    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
  } // FORMATTING


  addFormatToken('Q', 0, 'Qo', 'quarter'); // ALIASES

  addUnitAlias('quarter', 'Q'); // PRIORITY

  addUnitPriority('quarter', 7); // PARSING

  addRegexToken('Q', match1);
  addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
  }); // MOMENTS

  function getSetQuarter(input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
  } // FORMATTING


  addFormatToken('D', ['DD', 2], 'Do', 'date'); // ALIASES

  addUnitAlias('date', 'D'); // PRIORITY

  addUnitPriority('date', 9); // PARSING

  addRegexToken('D', match1to2);
  addRegexToken('DD', match1to2, match2);
  addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ? locale._dayOfMonthOrdinalParse || locale._ordinalParse : locale._dayOfMonthOrdinalParseLenient;
  });
  addParseToken(['D', 'DD'], DATE);
  addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0]);
  }); // MOMENTS

  var getSetDayOfMonth = makeGetSet('Date', true); // FORMATTING

  addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear'); // ALIASES

  addUnitAlias('dayOfYear', 'DDD'); // PRIORITY

  addUnitPriority('dayOfYear', 4); // PARSING

  addRegexToken('DDD', match1to3);
  addRegexToken('DDDD', match3);
  addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
  }); // HELPERS
  // MOMENTS

  function getSetDayOfYear(input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
  } // FORMATTING


  addFormatToken('m', ['mm', 2], 0, 'minute'); // ALIASES

  addUnitAlias('minute', 'm'); // PRIORITY

  addUnitPriority('minute', 14); // PARSING

  addRegexToken('m', match1to2);
  addRegexToken('mm', match1to2, match2);
  addParseToken(['m', 'mm'], MINUTE); // MOMENTS

  var getSetMinute = makeGetSet('Minutes', false); // FORMATTING

  addFormatToken('s', ['ss', 2], 0, 'second'); // ALIASES

  addUnitAlias('second', 's'); // PRIORITY

  addUnitPriority('second', 15); // PARSING

  addRegexToken('s', match1to2);
  addRegexToken('ss', match1to2, match2);
  addParseToken(['s', 'ss'], SECOND); // MOMENTS

  var getSetSecond = makeGetSet('Seconds', false); // FORMATTING

  addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
  });
  addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
  });
  addFormatToken(0, ['SSS', 3], 0, 'millisecond');
  addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
  });
  addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
  });
  addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
  });
  addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
  });
  addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
  });
  addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
  }); // ALIASES

  addUnitAlias('millisecond', 'ms'); // PRIORITY

  addUnitPriority('millisecond', 16); // PARSING

  addRegexToken('S', match1to3, match1);
  addRegexToken('SS', match1to3, match2);
  addRegexToken('SSS', match1to3, match3);
  var token;

  for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
  }

  function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
  }

  for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
  } // MOMENTS


  var getSetMillisecond = makeGetSet('Milliseconds', false); // FORMATTING

  addFormatToken('z', 0, 0, 'zoneAbbr');
  addFormatToken('zz', 0, 0, 'zoneName'); // MOMENTS

  function getZoneAbbr() {
    return this._isUTC ? 'UTC' : '';
  }

  function getZoneName() {
    return this._isUTC ? 'Coordinated Universal Time' : '';
  }

  var proto = Moment.prototype;
  proto.add = add;
  proto.calendar = calendar$1;
  proto.clone = clone;
  proto.diff = diff;
  proto.endOf = endOf;
  proto.format = format;
  proto.from = from;
  proto.fromNow = fromNow;
  proto.to = to;
  proto.toNow = toNow;
  proto.get = stringGet;
  proto.invalidAt = invalidAt;
  proto.isAfter = isAfter;
  proto.isBefore = isBefore;
  proto.isBetween = isBetween;
  proto.isSame = isSame;
  proto.isSameOrAfter = isSameOrAfter;
  proto.isSameOrBefore = isSameOrBefore;
  proto.isValid = isValid$2;
  proto.lang = lang;
  proto.locale = locale;
  proto.localeData = localeData;
  proto.max = prototypeMax;
  proto.min = prototypeMin;
  proto.parsingFlags = parsingFlags;
  proto.set = stringSet;
  proto.startOf = startOf;
  proto.subtract = subtract;
  proto.toArray = toArray;
  proto.toObject = toObject;
  proto.toDate = toDate;
  proto.toISOString = toISOString;
  proto.inspect = inspect;
  proto.toJSON = toJSON;
  proto.toString = toString;
  proto.unix = unix;
  proto.valueOf = valueOf;
  proto.creationData = creationData;
  proto.year = getSetYear;
  proto.isLeapYear = getIsLeapYear;
  proto.weekYear = getSetWeekYear;
  proto.isoWeekYear = getSetISOWeekYear;
  proto.quarter = proto.quarters = getSetQuarter;
  proto.month = getSetMonth;
  proto.daysInMonth = getDaysInMonth;
  proto.week = proto.weeks = getSetWeek;
  proto.isoWeek = proto.isoWeeks = getSetISOWeek;
  proto.weeksInYear = getWeeksInYear;
  proto.isoWeeksInYear = getISOWeeksInYear;
  proto.date = getSetDayOfMonth;
  proto.day = proto.days = getSetDayOfWeek;
  proto.weekday = getSetLocaleDayOfWeek;
  proto.isoWeekday = getSetISODayOfWeek;
  proto.dayOfYear = getSetDayOfYear;
  proto.hour = proto.hours = getSetHour;
  proto.minute = proto.minutes = getSetMinute;
  proto.second = proto.seconds = getSetSecond;
  proto.millisecond = proto.milliseconds = getSetMillisecond;
  proto.utcOffset = getSetOffset;
  proto.utc = setOffsetToUTC;
  proto.local = setOffsetToLocal;
  proto.parseZone = setOffsetToParsedOffset;
  proto.hasAlignedHourOffset = hasAlignedHourOffset;
  proto.isDST = isDaylightSavingTime;
  proto.isLocal = isLocal;
  proto.isUtcOffset = isUtcOffset;
  proto.isUtc = isUtc;
  proto.isUTC = isUtc;
  proto.zoneAbbr = getZoneAbbr;
  proto.zoneName = getZoneName;
  proto.dates = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
  proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
  proto.years = deprecate('years accessor is deprecated. Use year instead', getSetYear);
  proto.zone = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
  proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

  function createUnix(input) {
    return createLocal(input * 1000);
  }

  function createInZone() {
    return createLocal.apply(null, arguments).parseZone();
  }

  function preParsePostFormat(string) {
    return string;
  }

  var proto$1 = Locale.prototype;
  proto$1.calendar = calendar;
  proto$1.longDateFormat = longDateFormat;
  proto$1.invalidDate = invalidDate;
  proto$1.ordinal = ordinal;
  proto$1.preparse = preParsePostFormat;
  proto$1.postformat = preParsePostFormat;
  proto$1.relativeTime = relativeTime;
  proto$1.pastFuture = pastFuture;
  proto$1.set = set;
  proto$1.months = localeMonths;
  proto$1.monthsShort = localeMonthsShort;
  proto$1.monthsParse = localeMonthsParse;
  proto$1.monthsRegex = monthsRegex;
  proto$1.monthsShortRegex = monthsShortRegex;
  proto$1.week = localeWeek;
  proto$1.firstDayOfYear = localeFirstDayOfYear;
  proto$1.firstDayOfWeek = localeFirstDayOfWeek;
  proto$1.weekdays = localeWeekdays;
  proto$1.weekdaysMin = localeWeekdaysMin;
  proto$1.weekdaysShort = localeWeekdaysShort;
  proto$1.weekdaysParse = localeWeekdaysParse;
  proto$1.weekdaysRegex = weekdaysRegex;
  proto$1.weekdaysShortRegex = weekdaysShortRegex;
  proto$1.weekdaysMinRegex = weekdaysMinRegex;
  proto$1.isPM = localeIsPM;
  proto$1.meridiem = localeMeridiem;

  function get$1(format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
  }

  function listMonthsImpl(format, index, field) {
    if (isNumber(format)) {
      index = format;
      format = undefined;
    }

    format = format || '';

    if (index != null) {
      return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];

    for (i = 0; i < 12; i++) {
      out[i] = get$1(format, i, field, 'month');
    }

    return out;
  } // ()
  // (5)
  // (fmt, 5)
  // (fmt)
  // (true)
  // (true, 5)
  // (true, fmt, 5)
  // (true, fmt)


  function listWeekdaysImpl(localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
      if (isNumber(format)) {
        index = format;
        format = undefined;
      }

      format = format || '';
    } else {
      format = localeSorted;
      index = format;
      localeSorted = false;

      if (isNumber(format)) {
        index = format;
        format = undefined;
      }

      format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
      return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];

    for (i = 0; i < 7; i++) {
      out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }

    return out;
  }

  function listMonths(format, index) {
    return listMonthsImpl(format, index, 'months');
  }

  function listMonthsShort(format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
  }

  function listWeekdays(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
  }

  function listWeekdaysShort(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
  }

  function listWeekdaysMin(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
  }

  getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function ordinal(number) {
      var b = number % 10,
          output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
      return number + output;
    }
  }); // Side effect imports

  hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
  hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);
  var mathAbs = Math.abs;

  function abs() {
    var data = this._data;
    this._milliseconds = mathAbs(this._milliseconds);
    this._days = mathAbs(this._days);
    this._months = mathAbs(this._months);
    data.milliseconds = mathAbs(data.milliseconds);
    data.seconds = mathAbs(data.seconds);
    data.minutes = mathAbs(data.minutes);
    data.hours = mathAbs(data.hours);
    data.months = mathAbs(data.months);
    data.years = mathAbs(data.years);
    return this;
  }

  function addSubtract$1(duration, input, value, direction) {
    var other = createDuration(input, value);
    duration._milliseconds += direction * other._milliseconds;
    duration._days += direction * other._days;
    duration._months += direction * other._months;
    return duration._bubble();
  } // supports only 2.0-style add(1, 's') or add(duration)


  function add$1(input, value) {
    return addSubtract$1(this, input, value, 1);
  } // supports only 2.0-style subtract(1, 's') or subtract(duration)


  function subtract$1(input, value) {
    return addSubtract$1(this, input, value, -1);
  }

  function absCeil(number) {
    if (number < 0) {
      return Math.floor(number);
    } else {
      return Math.ceil(number);
    }
  }

  function bubble() {
    var milliseconds = this._milliseconds;
    var days = this._days;
    var months = this._months;
    var data = this._data;
    var seconds, minutes, hours, years, monthsFromDays; // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166

    if (!(milliseconds >= 0 && days >= 0 && months >= 0 || milliseconds <= 0 && days <= 0 && months <= 0)) {
      milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
      days = 0;
      months = 0;
    } // The following code bubbles up values, see the tests for
    // examples of what that means.


    data.milliseconds = milliseconds % 1000;
    seconds = absFloor(milliseconds / 1000);
    data.seconds = seconds % 60;
    minutes = absFloor(seconds / 60);
    data.minutes = minutes % 60;
    hours = absFloor(minutes / 60);
    data.hours = hours % 24;
    days += absFloor(hours / 24); // convert days to months

    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays)); // 12 months -> 1 year

    years = absFloor(months / 12);
    months %= 12;
    data.days = days;
    data.months = months;
    data.years = years;
    return this;
  }

  function daysToMonths(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
  }

  function monthsToDays(months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
  }

  function as(units) {
    if (!this.isValid()) {
      return NaN;
    }

    var days;
    var months;
    var milliseconds = this._milliseconds;
    units = normalizeUnits(units);

    if (units === 'month' || units === 'quarter' || units === 'year') {
      days = this._days + milliseconds / 864e5;
      months = this._months + daysToMonths(days);

      switch (units) {
        case 'month':
          return months;

        case 'quarter':
          return months / 3;

        case 'year':
          return months / 12;
      }
    } else {
      // handle milliseconds separately because of floating point math errors (issue #1867)
      days = this._days + Math.round(monthsToDays(this._months));

      switch (units) {
        case 'week':
          return days / 7 + milliseconds / 6048e5;

        case 'day':
          return days + milliseconds / 864e5;

        case 'hour':
          return days * 24 + milliseconds / 36e5;

        case 'minute':
          return days * 1440 + milliseconds / 6e4;

        case 'second':
          return days * 86400 + milliseconds / 1000;
        // Math.floor prevents floating point math errors here

        case 'millisecond':
          return Math.floor(days * 864e5) + milliseconds;

        default:
          throw new Error('Unknown unit ' + units);
      }
    }
  } // TODO: Use this.as('ms')?


  function valueOf$1() {
    if (!this.isValid()) {
      return NaN;
    }

    return this._milliseconds + this._days * 864e5 + this._months % 12 * 2592e6 + toInt(this._months / 12) * 31536e6;
  }

  function makeAs(alias) {
    return function () {
      return this.as(alias);
    };
  }

  var asMilliseconds = makeAs('ms');
  var asSeconds = makeAs('s');
  var asMinutes = makeAs('m');
  var asHours = makeAs('h');
  var asDays = makeAs('d');
  var asWeeks = makeAs('w');
  var asMonths = makeAs('M');
  var asQuarters = makeAs('Q');
  var asYears = makeAs('y');

  function clone$1() {
    return createDuration(this);
  }

  function get$2(units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
  }

  function makeGetter(name) {
    return function () {
      return this.isValid() ? this._data[name] : NaN;
    };
  }

  var milliseconds = makeGetter('milliseconds');
  var seconds = makeGetter('seconds');
  var minutes = makeGetter('minutes');
  var hours = makeGetter('hours');
  var days = makeGetter('days');
  var months = makeGetter('months');
  var years = makeGetter('years');

  function weeks() {
    return absFloor(this.days() / 7);
  }

  var round = Math.round;
  var thresholds = {
    ss: 44,
    // a few seconds to seconds
    s: 45,
    // seconds to minute
    m: 45,
    // minutes to hour
    h: 22,
    // hours to day
    d: 26,
    // days to month
    M: 11 // months to year

  }; // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize

  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }

  function relativeTime$1(posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds = round(duration.as('s'));
    var minutes = round(duration.as('m'));
    var hours = round(duration.as('h'));
    var days = round(duration.as('d'));
    var months = round(duration.as('M'));
    var years = round(duration.as('y'));
    var a = seconds <= thresholds.ss && ['s', seconds] || seconds < thresholds.s && ['ss', seconds] || minutes <= 1 && ['m'] || minutes < thresholds.m && ['mm', minutes] || hours <= 1 && ['h'] || hours < thresholds.h && ['hh', hours] || days <= 1 && ['d'] || days < thresholds.d && ['dd', days] || months <= 1 && ['M'] || months < thresholds.M && ['MM', months] || years <= 1 && ['y'] || ['yy', years];
    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
  } // This function allows you to set the rounding function for relative time strings


  function getSetRelativeTimeRounding(roundingFunction) {
    if (roundingFunction === undefined) {
      return round;
    }

    if (typeof roundingFunction === 'function') {
      round = roundingFunction;
      return true;
    }

    return false;
  } // This function allows you to set a threshold for relative time strings


  function getSetRelativeTimeThreshold(threshold, limit) {
    if (thresholds[threshold] === undefined) {
      return false;
    }

    if (limit === undefined) {
      return thresholds[threshold];
    }

    thresholds[threshold] = limit;

    if (threshold === 's') {
      thresholds.ss = limit - 1;
    }

    return true;
  }

  function humanize(withSuffix) {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }

    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
      output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
  }

  var abs$1 = Math.abs;

  function sign(x) {
    return (x > 0) - (x < 0) || +x;
  }

  function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }

    var seconds = abs$1(this._milliseconds) / 1000;
    var days = abs$1(this._days);
    var months = abs$1(this._months);
    var minutes, hours, years; // 3600 seconds -> 60 minutes -> 1 hour

    minutes = absFloor(seconds / 60);
    hours = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60; // 12 months -> 1 year

    years = absFloor(months / 12);
    months %= 12; // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js

    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
    var total = this.asSeconds();

    if (!total) {
      // this is the same as C#'s (Noda) and python (isodate)...
      // but not other JS (goog.date)
      return 'P0D';
    }

    var totalSign = total < 0 ? '-' : '';
    var ymSign = sign(this._months) !== sign(total) ? '-' : '';
    var daysSign = sign(this._days) !== sign(total) ? '-' : '';
    var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';
    return totalSign + 'P' + (Y ? ymSign + Y + 'Y' : '') + (M ? ymSign + M + 'M' : '') + (D ? daysSign + D + 'D' : '') + (h || m || s ? 'T' : '') + (h ? hmsSign + h + 'H' : '') + (m ? hmsSign + m + 'M' : '') + (s ? hmsSign + s + 'S' : '');
  }

  var proto$2 = Duration.prototype;
  proto$2.isValid = isValid$1;
  proto$2.abs = abs;
  proto$2.add = add$1;
  proto$2.subtract = subtract$1;
  proto$2.as = as;
  proto$2.asMilliseconds = asMilliseconds;
  proto$2.asSeconds = asSeconds;
  proto$2.asMinutes = asMinutes;
  proto$2.asHours = asHours;
  proto$2.asDays = asDays;
  proto$2.asWeeks = asWeeks;
  proto$2.asMonths = asMonths;
  proto$2.asQuarters = asQuarters;
  proto$2.asYears = asYears;
  proto$2.valueOf = valueOf$1;
  proto$2._bubble = bubble;
  proto$2.clone = clone$1;
  proto$2.get = get$2;
  proto$2.milliseconds = milliseconds;
  proto$2.seconds = seconds;
  proto$2.minutes = minutes;
  proto$2.hours = hours;
  proto$2.days = days;
  proto$2.weeks = weeks;
  proto$2.months = months;
  proto$2.years = years;
  proto$2.humanize = humanize;
  proto$2.toISOString = toISOString$1;
  proto$2.toString = toISOString$1;
  proto$2.toJSON = toISOString$1;
  proto$2.locale = locale;
  proto$2.localeData = localeData;
  proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
  proto$2.lang = lang; // Side effect imports
  // FORMATTING

  addFormatToken('X', 0, 0, 'unix');
  addFormatToken('x', 0, 0, 'valueOf'); // PARSING

  addRegexToken('x', matchSigned);
  addRegexToken('X', matchTimestamp);
  addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
  });
  addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
  }); // Side effect imports

  hooks.version = '2.24.0';
  setHookCallback(createLocal);
  hooks.fn = proto;
  hooks.min = min;
  hooks.max = max;
  hooks.now = now;
  hooks.utc = createUTC;
  hooks.unix = createUnix;
  hooks.months = listMonths;
  hooks.isDate = isDate;
  hooks.locale = getSetGlobalLocale;
  hooks.invalid = createInvalid;
  hooks.duration = createDuration;
  hooks.isMoment = isMoment;
  hooks.weekdays = listWeekdays;
  hooks.parseZone = createInZone;
  hooks.localeData = getLocale;
  hooks.isDuration = isDuration;
  hooks.monthsShort = listMonthsShort;
  hooks.weekdaysMin = listWeekdaysMin;
  hooks.defineLocale = defineLocale;
  hooks.updateLocale = updateLocale;
  hooks.locales = listLocales;
  hooks.weekdaysShort = listWeekdaysShort;
  hooks.normalizeUnits = normalizeUnits;
  hooks.relativeTimeRounding = getSetRelativeTimeRounding;
  hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
  hooks.calendarFormat = getCalendarFormat;
  hooks.prototype = proto; // currently HTML5 input type only supports 24-hour formats

  hooks.HTML5_FMT = {
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',
    // <input type="datetime-local" />
    DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',
    // <input type="datetime-local" step="1" />
    DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',
    // <input type="datetime-local" step="0.001" />
    DATE: 'YYYY-MM-DD',
    // <input type="date" />
    TIME: 'HH:mm',
    // <input type="time" />
    TIME_SECONDS: 'HH:mm:ss',
    // <input type="time" step="1" />
    TIME_MS: 'HH:mm:ss.SSS',
    // <input type="time" step="0.001" />
    WEEK: 'GGGG-[W]WW',
    // <input type="week" />
    MONTH: 'YYYY-MM' // <input type="month" />

  };
  return hooks;
});

},{"core-js/modules/es.string.replace":117}],53:[function(require,module,exports){
(function (process,setImmediate){
"use strict";

require("core-js/modules/web.immediate");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// vim:ts=4:sts=4:sw=4:

/*!
 *
 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
(function (definition) {
  "use strict"; // This file will function properly as a <script> tag, or a module
  // using CommonJS and NodeJS or RequireJS module formats.  In
  // Common/Node/RequireJS, the module exports the Q API and when
  // executed as a simple <script>, it creates a Q global instead.
  // Montage Require

  if (typeof bootstrap === "function") {
    bootstrap("promise", definition); // CommonJS
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && (typeof module === "undefined" ? "undefined" : _typeof(module)) === "object") {
    module.exports = definition(); // RequireJS
  } else if (typeof define === "function" && define.amd) {
    define(definition); // SES (Secure EcmaScript)
  } else if (typeof ses !== "undefined") {
    if (!ses.ok()) {
      return;
    } else {
      ses.makeQ = definition;
    } // <script>

  } else if (typeof window !== "undefined" || typeof self !== "undefined") {
    // Prefer window over self for add-on scripts. Use self for
    // non-windowed contexts.
    var global = typeof window !== "undefined" ? window : self; // Get the `window` object, save the previous Q global
    // and initialize Q as a global.

    var previousQ = global.Q;
    global.Q = definition(); // Add a noConflict function so Q can be removed from the
    // global namespace.

    global.Q.noConflict = function () {
      global.Q = previousQ;
      return this;
    };
  } else {
    throw new Error("This environment was not anticipated by Q. Please file a bug.");
  }
})(function () {
  "use strict";

  var hasStacks = false;

  try {
    throw new Error();
  } catch (e) {
    hasStacks = !!e.stack;
  } // All code after this point will be filtered from stack traces reported
  // by Q.


  var qStartingLine = captureLine();
  var qFileName; // shims
  // used for fallback in "allResolved"

  var noop = function noop() {}; // Use the fastest possible means to execute a task in a future turn
  // of the event loop.


  var nextTick = function () {
    // linked list of tasks (single, with head node)
    var head = {
      task: void 0,
      next: null
    };
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false; // queue for late tasks, used by unhandled rejection tracking

    var laterQueue = [];

    function flush() {
      /* jshint loopfunc: true */
      var task, domain;

      while (head.next) {
        head = head.next;
        task = head.task;
        head.task = void 0;
        domain = head.domain;

        if (domain) {
          head.domain = void 0;
          domain.enter();
        }

        runSingle(task, domain);
      }

      while (laterQueue.length) {
        task = laterQueue.pop();
        runSingle(task);
      }

      flushing = false;
    } // runs a single function in the async queue


    function runSingle(task, domain) {
      try {
        task();
      } catch (e) {
        if (isNodeJS) {
          // In node, uncaught exceptions are considered fatal errors.
          // Re-throw them synchronously to interrupt flushing!
          // Ensure continuation if the uncaught exception is suppressed
          // listening "uncaughtException" events (as domains does).
          // Continue in next event to avoid tick recursion.
          if (domain) {
            domain.exit();
          }

          setTimeout(flush, 0);

          if (domain) {
            domain.enter();
          }

          throw e;
        } else {
          // In browsers, uncaught exceptions are not fatal.
          // Re-throw them asynchronously to avoid slow-downs.
          setTimeout(function () {
            throw e;
          }, 0);
        }
      }

      if (domain) {
        domain.exit();
      }
    }

    nextTick = function nextTick(task) {
      tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
      };

      if (!flushing) {
        flushing = true;
        requestTick();
      }
    };

    if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process.toString() === "[object process]" && process.nextTick) {
      // Ensure Q is in a real Node environment, with a `process.nextTick`.
      // To see through fake Node environments:
      // * Mocha test runner - exposes a `process` global without a `nextTick`
      // * Browserify - exposes a `process.nexTick` function that uses
      //   `setTimeout`. In this case `setImmediate` is preferred because
      //    it is faster. Browserify's `process.toString()` yields
      //   "[object Object]", while in a real Node environment
      //   `process.toString()` yields "[object process]".
      isNodeJS = true;

      requestTick = function requestTick() {
        process.nextTick(flush);
      };
    } else if (typeof setImmediate === "function") {
      // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
      if (typeof window !== "undefined") {
        requestTick = setImmediate.bind(window, flush);
      } else {
        requestTick = function requestTick() {
          setImmediate(flush);
        };
      }
    } else if (typeof MessageChannel !== "undefined") {
      // modern browsers
      // http://www.nonblocking.io/2011/06/windownexttick.html
      var channel = new MessageChannel(); // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
      // working message ports the first time a page loads.

      channel.port1.onmessage = function () {
        requestTick = requestPortTick;
        channel.port1.onmessage = flush;
        flush();
      };

      var requestPortTick = function requestPortTick() {
        // Opera requires us to provide a message payload, regardless of
        // whether we use it.
        channel.port2.postMessage(0);
      };

      requestTick = function requestTick() {
        setTimeout(flush, 0);
        requestPortTick();
      };
    } else {
      // old browsers
      requestTick = function requestTick() {
        setTimeout(flush, 0);
      };
    } // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.


    nextTick.runAfter = function (task) {
      laterQueue.push(task);

      if (!flushing) {
        flushing = true;
        requestTick();
      }
    };

    return nextTick;
  }(); // Attempt to make generics safe in the face of downstream
  // modifications.
  // There is no situation where this is necessary.
  // If you need a security guarantee, these primordials need to be
  // deeply frozen anyway, and if you don’t need a security guarantee,
  // this is just plain paranoid.
  // However, this **might** have the nice side-effect of reducing the size of
  // the minified code by reducing x.call() to merely x()
  // See Mark Miller’s explanation of what this does.
  // http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming


  var call = Function.call;

  function uncurryThis(f) {
    return function () {
      return call.apply(f, arguments);
    };
  } // This is equivalent, but slower:
  // uncurryThis = Function_bind.bind(Function_bind.call);
  // http://jsperf.com/uncurrythis


  var array_slice = uncurryThis(Array.prototype.slice);
  var array_reduce = uncurryThis(Array.prototype.reduce || function (callback, basis) {
    var index = 0,
        length = this.length; // concerning the initial value, if one is not provided

    if (arguments.length === 1) {
      // seek to the first value in the array, accounting
      // for the possibility that is is a sparse array
      do {
        if (index in this) {
          basis = this[index++];
          break;
        }

        if (++index >= length) {
          throw new TypeError();
        }
      } while (1);
    } // reduce


    for (; index < length; index++) {
      // account for the possibility that the array is sparse
      if (index in this) {
        basis = callback(basis, this[index], index);
      }
    }

    return basis;
  });
  var array_indexOf = uncurryThis(Array.prototype.indexOf || function (value) {
    // not a very good shim, but good enough for our one use of it
    for (var i = 0; i < this.length; i++) {
      if (this[i] === value) {
        return i;
      }
    }

    return -1;
  });
  var array_map = uncurryThis(Array.prototype.map || function (callback, thisp) {
    var self = this;
    var collect = [];
    array_reduce(self, function (undefined, value, index) {
      collect.push(callback.call(thisp, value, index, self));
    }, void 0);
    return collect;
  });

  var object_create = Object.create || function (prototype) {
    function Type() {}

    Type.prototype = prototype;
    return new Type();
  };

  var object_defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
    obj[prop] = descriptor.value;
    return obj;
  };

  var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

  var object_keys = Object.keys || function (object) {
    var keys = [];

    for (var key in object) {
      if (object_hasOwnProperty(object, key)) {
        keys.push(key);
      }
    }

    return keys;
  };

  var object_toString = uncurryThis(Object.prototype.toString);

  function isObject(value) {
    return value === Object(value);
  } // generator related shims
  // FIXME: Remove this function once ES6 generators are in SpiderMonkey.


  function isStopIteration(exception) {
    return object_toString(exception) === "[object StopIteration]" || exception instanceof QReturnValue;
  } // FIXME: Remove this helper and Q.return once ES6 generators are in
  // SpiderMonkey.


  var QReturnValue;

  if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
  } else {
    QReturnValue = function QReturnValue(value) {
      this.value = value;
    };
  } // long stack traces


  var STACK_JUMP_SEPARATOR = "From previous event:";

  function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks && promise.stack && _typeof(error) === "object" && error !== null && error.stack) {
      var stacks = [];

      for (var p = promise; !!p; p = p.source) {
        if (p.stack && (!error.__minimumStackCounter__ || error.__minimumStackCounter__ > p.stackCounter)) {
          object_defineProperty(error, "__minimumStackCounter__", {
            value: p.stackCounter,
            configurable: true
          });
          stacks.unshift(p.stack);
        }
      }

      stacks.unshift(error.stack);
      var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
      var stack = filterStackString(concatedStacks);
      object_defineProperty(error, "stack", {
        value: stack,
        configurable: true
      });
    }
  }

  function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];

    for (var i = 0; i < lines.length; ++i) {
      var line = lines[i];

      if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
        desiredLines.push(line);
      }
    }

    return desiredLines.join("\n");
  }

  function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 || stackLine.indexOf("(node.js:") !== -1;
  }

  function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);

    if (attempt1) {
      return [attempt1[1], Number(attempt1[2])];
    } // Anonymous functions: "at filename:lineNumber:columnNumber"


    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);

    if (attempt2) {
      return [attempt2[1], Number(attempt2[2])];
    } // Firefox style: "function@filename:lineNumber or @filename:lineNumber"


    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);

    if (attempt3) {
      return [attempt3[1], Number(attempt3[2])];
    }
  }

  function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
      return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];
    return fileName === qFileName && lineNumber >= qStartingLine && lineNumber <= qEndingLine;
  } // discover own file name and line number range for filtering stack
  // traces


  function captureLine() {
    if (!hasStacks) {
      return;
    }

    try {
      throw new Error();
    } catch (e) {
      var lines = e.stack.split("\n");
      var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
      var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);

      if (!fileNameAndLineNumber) {
        return;
      }

      qFileName = fileNameAndLineNumber[0];
      return fileNameAndLineNumber[1];
    }
  }

  function deprecate(callback, name, alternative) {
    return function () {
      if (typeof console !== "undefined" && typeof console.warn === "function") {
        console.warn(name + " is deprecated, use " + alternative + " instead.", new Error("").stack);
      }

      return callback.apply(callback, arguments);
    };
  } // end of shims
  // beginning of real work

  /**
   * Constructs a promise for an immediate reference, passes promises through, or
   * coerces promises from different systems.
   * @param value immediate reference or promise
   */


  function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
      return value;
    } // assimilate thenables


    if (isPromiseAlike(value)) {
      return coerce(value);
    } else {
      return fulfill(value);
    }
  }

  Q.resolve = Q;
  /**
   * Performs a task in a future turn of the event loop.
   * @param {Function} task
   */

  Q.nextTick = nextTick;
  /**
   * Controls whether or not long stack traces will be on
   */

  Q.longStackSupport = false;
  /**
   * The counter is used to determine the stopping point for building
   * long stack traces. In makeStackTraceLong we walk backwards through
   * the linked list of promises, only stacks which were created before
   * the rejection are concatenated.
   */

  var longStackCounter = 1; // enable long stacks if Q_DEBUG is set

  if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
  }
  /**
   * Constructs a {promise, resolve, reject} object.
   *
   * `resolve` is a callback to invoke with a more resolved value for the
   * promise. To fulfill the promise, invoke `resolve` with any value that is
   * not a thenable. To reject the promise, invoke `resolve` with a rejected
   * thenable, or invoke `reject` with the reason directly. To resolve the
   * promise to another thenable, thus putting it in the same state, invoke
   * `resolve` with that other thenable.
   */


  Q.defer = defer;

  function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [],
        progressListeners = [],
        resolvedPromise;
    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
      var args = array_slice(arguments);

      if (messages) {
        messages.push(args);

        if (op === "when" && operands[1]) {
          // progress operand
          progressListeners.push(operands[1]);
        }
      } else {
        Q.nextTick(function () {
          resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
        });
      }
    }; // XXX deprecated


    promise.valueOf = function () {
      if (messages) {
        return promise;
      }

      var nearerValue = nearer(resolvedPromise);

      if (isPromise(nearerValue)) {
        resolvedPromise = nearerValue; // shorten chain
      }

      return nearerValue;
    };

    promise.inspect = function () {
      if (!resolvedPromise) {
        return {
          state: "pending"
        };
      }

      return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
      try {
        throw new Error();
      } catch (e) {
        // NOTE: don't try to use `Error.captureStackTrace` or transfer the
        // accessor around; that causes memory leaks as per GH-111. Just
        // reify the stack trace as a string ASAP.
        //
        // At the same time, cut off the first line; it's always just
        // "[object Promise]\n", as per the `toString`.
        promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        promise.stackCounter = longStackCounter++;
      }
    } // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.


    function become(newPromise) {
      resolvedPromise = newPromise;

      if (Q.longStackSupport && hasStacks) {
        // Only hold a reference to the new promise if long stacks
        // are enabled to reduce memory usage
        promise.source = newPromise;
      }

      array_reduce(messages, function (undefined, message) {
        Q.nextTick(function () {
          newPromise.promiseDispatch.apply(newPromise, message);
        });
      }, void 0);
      messages = void 0;
      progressListeners = void 0;
    }

    deferred.promise = promise;

    deferred.resolve = function (value) {
      if (resolvedPromise) {
        return;
      }

      become(Q(value));
    };

    deferred.fulfill = function (value) {
      if (resolvedPromise) {
        return;
      }

      become(fulfill(value));
    };

    deferred.reject = function (reason) {
      if (resolvedPromise) {
        return;
      }

      become(reject(reason));
    };

    deferred.notify = function (progress) {
      if (resolvedPromise) {
        return;
      }

      array_reduce(progressListeners, function (undefined, progressListener) {
        Q.nextTick(function () {
          progressListener(progress);
        });
      }, void 0);
    };

    return deferred;
  }
  /**
   * Creates a Node-style callback that will resolve or reject the deferred
   * promise.
   * @returns a nodeback
   */


  defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
      if (error) {
        self.reject(error);
      } else if (arguments.length > 2) {
        self.resolve(array_slice(arguments, 1));
      } else {
        self.resolve(value);
      }
    };
  };
  /**
   * @param resolver {Function} a function that returns nothing and accepts
   * the resolve, reject, and notify functions for a deferred.
   * @returns a promise that may be resolved with the given resolve and reject
   * functions, or rejected by a thrown exception in resolver
   */


  Q.Promise = promise; // ES6

  Q.promise = promise;

  function promise(resolver) {
    if (typeof resolver !== "function") {
      throw new TypeError("resolver must be a function.");
    }

    var deferred = defer();

    try {
      resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
      deferred.reject(reason);
    }

    return deferred.promise;
  }

  promise.race = race; // ES6

  promise.all = all; // ES6

  promise.reject = reject; // ES6

  promise.resolve = Q; // ES6
  // XXX experimental.  This method is a way to denote that a local value is
  // serializable and should be immediately dispatched to a remote upon request,
  // instead of passing a reference.

  Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
  };

  Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
  };
  /**
   * If two promises eventually fulfill to the same value, promises that value,
   * but otherwise rejects.
   * @param x {Any*}
   * @param y {Any*}
   * @returns {Any*} a promise for x and y if they are the same, but a rejection
   * otherwise.
   *
   */


  Q.join = function (x, y) {
    return Q(x).join(y);
  };

  Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
      if (x === y) {
        // TODO: "===" should be Object.is or equiv
        return x;
      } else {
        throw new Error("Q can't join: not the same: " + x + " " + y);
      }
    });
  };
  /**
   * Returns a promise for the first of an array of promises to become settled.
   * @param answers {Array[Any*]} promises to race
   * @returns {Any*} the first promise to be settled
   */


  Q.race = race;

  function race(answerPs) {
    return promise(function (resolve, reject) {
      // Switch to this once we can assume at least ES5
      // answerPs.forEach(function (answerP) {
      //     Q(answerP).then(resolve, reject);
      // });
      // Use this in the meantime
      for (var i = 0, len = answerPs.length; i < len; i++) {
        Q(answerPs[i]).then(resolve, reject);
      }
    });
  }

  Promise.prototype.race = function () {
    return this.then(Q.race);
  };
  /**
   * Constructs a Promise with a promise descriptor object and optional fallback
   * function.  The descriptor contains methods like when(rejected), get(name),
   * set(name, value), post(name, args), and delete(name), which all
   * return either a value, a promise for a value, or a rejection.  The fallback
   * accepts the operation name, a resolver, and any further arguments that would
   * have been forwarded to the appropriate method above had a method been
   * provided with the proper name.  The API makes no guarantees about the nature
   * of the returned object, apart from that it is usable whereever promises are
   * bought and sold.
   */


  Q.makePromise = Promise;

  function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
      fallback = function fallback(op) {
        return reject(new Error("Promise does not support operation: " + op));
      };
    }

    if (inspect === void 0) {
      inspect = function inspect() {
        return {
          state: "unknown"
        };
      };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
      var result;

      try {
        if (descriptor[op]) {
          result = descriptor[op].apply(promise, args);
        } else {
          result = fallback.call(promise, op, args);
        }
      } catch (exception) {
        result = reject(exception);
      }

      if (resolve) {
        resolve(result);
      }
    };

    promise.inspect = inspect; // XXX deprecated `valueOf` and `exception` support

    if (inspect) {
      var inspected = inspect();

      if (inspected.state === "rejected") {
        promise.exception = inspected.reason;
      }

      promise.valueOf = function () {
        var inspected = inspect();

        if (inspected.state === "pending" || inspected.state === "rejected") {
          return promise;
        }

        return inspected.value;
      };
    }

    return promise;
  }

  Promise.prototype.toString = function () {
    return "[object Promise]";
  };

  Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false; // ensure the untrusted promise makes at most a
    // single call to one of the callbacks

    function _fulfilled(value) {
      try {
        return typeof fulfilled === "function" ? fulfilled(value) : value;
      } catch (exception) {
        return reject(exception);
      }
    }

    function _rejected(exception) {
      if (typeof rejected === "function") {
        makeStackTraceLong(exception, self);

        try {
          return rejected(exception);
        } catch (newException) {
          return reject(newException);
        }
      }

      return reject(exception);
    }

    function _progressed(value) {
      return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
      self.promiseDispatch(function (value) {
        if (done) {
          return;
        }

        done = true;
        deferred.resolve(_fulfilled(value));
      }, "when", [function (exception) {
        if (done) {
          return;
        }

        done = true;
        deferred.resolve(_rejected(exception));
      }]);
    }); // Progress propagator need to be attached in the current tick.

    self.promiseDispatch(void 0, "when", [void 0, function (value) {
      var newValue;
      var threw = false;

      try {
        newValue = _progressed(value);
      } catch (e) {
        threw = true;

        if (Q.onerror) {
          Q.onerror(e);
        } else {
          throw e;
        }
      }

      if (!threw) {
        deferred.notify(newValue);
      }
    }]);
    return deferred.promise;
  };

  Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
  };
  /**
   * Works almost like "finally", but not called for rejections.
   * Original resolution value is passed through callback unaffected.
   * Callback may return a promise that will be awaited for.
   * @param {Function} callback
   * @returns {Q.Promise}
   * @example
   * doSomething()
   *   .then(...)
   *   .tap(console.log)
   *   .then(...);
   */


  Promise.prototype.tap = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
      return callback.fcall(value).thenResolve(value);
    });
  };
  /**
   * Registers an observer on a promise.
   *
   * Guarantees:
   *
   * 1. that fulfilled and rejected will be called only once.
   * 2. that either the fulfilled callback or the rejected callback will be
   *    called, but not both.
   * 3. that fulfilled and rejected will not be called in this turn.
   *
   * @param value      promise or immediate reference to observe
   * @param fulfilled  function to be called with the fulfilled value
   * @param rejected   function to be called with the rejection exception
   * @param progressed function to be called on any progress notifications
   * @return promise for the return value from the invoked callback
   */


  Q.when = when;

  function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
  }

  Promise.prototype.thenResolve = function (value) {
    return this.then(function () {
      return value;
    });
  };

  Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
  };

  Promise.prototype.thenReject = function (reason) {
    return this.then(function () {
      throw reason;
    });
  };

  Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
  };
  /**
   * If an object is not a promise, it is as "near" as possible.
   * If a promise is rejected, it is as "near" as possible too.
   * If it’s a fulfilled promise, the fulfillment value is nearer.
   * If it’s a deferred promise and the deferred has been resolved, the
   * resolution is "nearer".
   * @param object
   * @returns most resolved (nearest) form of the object
   */
  // XXX should we re-do this?


  Q.nearer = nearer;

  function nearer(value) {
    if (isPromise(value)) {
      var inspected = value.inspect();

      if (inspected.state === "fulfilled") {
        return inspected.value;
      }
    }

    return value;
  }
  /**
   * @returns whether the given object is a promise.
   * Otherwise it is a fulfilled value.
   */


  Q.isPromise = isPromise;

  function isPromise(object) {
    return object instanceof Promise;
  }

  Q.isPromiseAlike = isPromiseAlike;

  function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
  }
  /**
   * @returns whether the given object is a pending promise, meaning not
   * fulfilled or rejected.
   */


  Q.isPending = isPending;

  function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
  }

  Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
  };
  /**
   * @returns whether the given object is a value or fulfilled
   * promise.
   */


  Q.isFulfilled = isFulfilled;

  function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
  }

  Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
  };
  /**
   * @returns whether the given object is a rejected promise.
   */


  Q.isRejected = isRejected;

  function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
  }

  Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
  }; //// BEGIN UNHANDLED REJECTION TRACKING
  // This promise library consumes exceptions thrown in handlers so they can be
  // handled by a subsequent promise.  The exceptions get added to this array when
  // they are created, and removed when they are handled.  Note that in ES6 or
  // shimmed environments, this would naturally be a `Set`.


  var unhandledReasons = [];
  var unhandledRejections = [];
  var reportedUnhandledRejections = [];
  var trackUnhandledRejections = true;

  function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
      trackUnhandledRejections = true;
    }
  }

  function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
      return;
    }

    if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && typeof process.emit === "function") {
      Q.nextTick.runAfter(function () {
        if (array_indexOf(unhandledRejections, promise) !== -1) {
          process.emit("unhandledRejection", reason, promise);
          reportedUnhandledRejections.push(promise);
        }
      });
    }

    unhandledRejections.push(promise);

    if (reason && typeof reason.stack !== "undefined") {
      unhandledReasons.push(reason.stack);
    } else {
      unhandledReasons.push("(no stack) " + reason);
    }
  }

  function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
      return;
    }

    var at = array_indexOf(unhandledRejections, promise);

    if (at !== -1) {
      if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
          var atReport = array_indexOf(reportedUnhandledRejections, promise);

          if (atReport !== -1) {
            process.emit("rejectionHandled", unhandledReasons[at], promise);
            reportedUnhandledRejections.splice(atReport, 1);
          }
        });
      }

      unhandledRejections.splice(at, 1);
      unhandledReasons.splice(at, 1);
    }
  }

  Q.resetUnhandledRejections = resetUnhandledRejections;

  Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
  };

  Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
  };

  resetUnhandledRejections(); //// END UNHANDLED REJECTION TRACKING

  /**
   * Constructs a rejected promise.
   * @param reason value describing the failure
   */

  Q.reject = reject;

  function reject(reason) {
    var rejection = Promise({
      "when": function when(rejected) {
        // note that the error has been handled
        if (rejected) {
          untrackRejection(this);
        }

        return rejected ? rejected(reason) : this;
      }
    }, function fallback() {
      return this;
    }, function inspect() {
      return {
        state: "rejected",
        reason: reason
      };
    }); // Note that the reason has not been handled.

    trackRejection(rejection, reason);
    return rejection;
  }
  /**
   * Constructs a fulfilled promise for an immediate reference.
   * @param value immediate reference
   */


  Q.fulfill = fulfill;

  function fulfill(value) {
    return Promise({
      "when": function when() {
        return value;
      },
      "get": function get(name) {
        return value[name];
      },
      "set": function set(name, rhs) {
        value[name] = rhs;
      },
      "delete": function _delete(name) {
        delete value[name];
      },
      "post": function post(name, args) {
        // Mark Miller proposes that post with no name should apply a
        // promised function.
        if (name === null || name === void 0) {
          return value.apply(void 0, args);
        } else {
          return value[name].apply(value, args);
        }
      },
      "apply": function apply(thisp, args) {
        return value.apply(thisp, args);
      },
      "keys": function keys() {
        return object_keys(value);
      }
    }, void 0, function inspect() {
      return {
        state: "fulfilled",
        value: value
      };
    });
  }
  /**
   * Converts thenables to Q promises.
   * @param promise thenable promise
   * @returns a Q promise
   */


  function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
      try {
        promise.then(deferred.resolve, deferred.reject, deferred.notify);
      } catch (exception) {
        deferred.reject(exception);
      }
    });
    return deferred.promise;
  }
  /**
   * Annotates an object such that it will never be
   * transferred away from this process over any promise
   * communication channel.
   * @param object
   * @returns promise a wrapping of that object that
   * additionally responds to the "isDef" message
   * without a rejection.
   */


  Q.master = master;

  function master(object) {
    return Promise({
      "isDef": function isDef() {}
    }, function fallback(op, args) {
      return dispatch(object, op, args);
    }, function () {
      return Q(object).inspect();
    });
  }
  /**
   * Spreads the values of a promised array of arguments into the
   * fulfillment callback.
   * @param fulfilled callback that receives variadic arguments from the
   * promised array
   * @param rejected callback that receives the exception if the promise
   * is rejected.
   * @returns a promise for the return value or thrown exception of
   * either callback.
   */


  Q.spread = spread;

  function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
  }

  Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
      return fulfilled.apply(void 0, array);
    }, rejected);
  };
  /**
   * The async function is a decorator for generator functions, turning
   * them into asynchronous generators.  Although generators are only part
   * of the newest ECMAScript 6 drafts, this code does not cause syntax
   * errors in older engines.  This code should continue to work and will
   * in fact improve over time as the language improves.
   *
   * ES6 generators are currently part of V8 version 3.19 with the
   * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
   * for longer, but under an older Python-inspired form.  This function
   * works on both kinds of generators.
   *
   * Decorates a generator function such that:
   *  - it may yield promises
   *  - execution will continue when that promise is fulfilled
   *  - the value of the yield expression will be the fulfilled value
   *  - it returns a promise for the return value (when the generator
   *    stops iterating)
   *  - the decorated function returns a promise for the return value
   *    of the generator or the first rejected promise among those
   *    yielded.
   *  - if an error is thrown in the generator, it propagates through
   *    every following yield until it is caught, or until it escapes
   *    the generator function altogether, and is translated into a
   *    rejection for the promise returned by the decorated generator.
   */


  Q.async = async;

  function async(makeGenerator) {
    return function () {
      // when verb is "send", arg is a value
      // when verb is "throw", arg is an exception
      function continuer(verb, arg) {
        var result; // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
        // engine that has a deployed base of browsers that support generators.
        // However, SM's generators use the Python-inspired semantics of
        // outdated ES6 drafts.  We would like to support ES6, but we'd also
        // like to make it possible to use generators in deployed browsers, so
        // we also support Python-style generators.  At some point we can remove
        // this block.

        if (typeof StopIteration === "undefined") {
          // ES6 Generators
          try {
            result = generator[verb](arg);
          } catch (exception) {
            return reject(exception);
          }

          if (result.done) {
            return Q(result.value);
          } else {
            return when(result.value, callback, errback);
          }
        } else {
          // SpiderMonkey Generators
          // FIXME: Remove this case when SM does ES6 generators.
          try {
            result = generator[verb](arg);
          } catch (exception) {
            if (isStopIteration(exception)) {
              return Q(exception.value);
            } else {
              return reject(exception);
            }
          }

          return when(result, callback, errback);
        }
      }

      var generator = makeGenerator.apply(this, arguments);
      var callback = continuer.bind(continuer, "next");
      var errback = continuer.bind(continuer, "throw");
      return callback();
    };
  }
  /**
   * The spawn function is a small wrapper around async that immediately
   * calls the generator and also ends the promise chain, so that any
   * unhandled errors are thrown instead of forwarded to the error
   * handler. This is useful because it's extremely common to run
   * generators at the top-level to work with libraries.
   */


  Q.spawn = spawn;

  function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
  } // FIXME: Remove this interface once ES6 generators are in SpiderMonkey.

  /**
   * Throws a ReturnValue exception to stop an asynchronous generator.
   *
   * This interface is a stop-gap measure to support generator return
   * values in older Firefox/SpiderMonkey.  In browsers that support ES6
   * generators like Chromium 29, just use "return" in your generator
   * functions.
   *
   * @param value the return value for the surrounding generator
   * @throws ReturnValue exception with the value.
   * @example
   * // ES6 style
   * Q.async(function* () {
   *      var foo = yield getFooPromise();
   *      var bar = yield getBarPromise();
   *      return foo + bar;
   * })
   * // Older SpiderMonkey style
   * Q.async(function () {
   *      var foo = yield getFooPromise();
   *      var bar = yield getBarPromise();
   *      Q.return(foo + bar);
   * })
   */


  Q["return"] = _return;

  function _return(value) {
    throw new QReturnValue(value);
  }
  /**
   * The promised function decorator ensures that any promise arguments
   * are settled and passed as values (`this` is also settled and passed
   * as a value).  It will also ensure that the result of a function is
   * always a promise.
   *
   * @example
   * var add = Q.promised(function (a, b) {
   *     return a + b;
   * });
   * add(Q(a), Q(B));
   *
   * @param {function} callback The function to decorate
   * @returns {function} a function that has been decorated.
   */


  Q.promised = promised;

  function promised(callback) {
    return function () {
      return spread([this, all(arguments)], function (self, args) {
        return callback.apply(self, args);
      });
    };
  }
  /**
   * sends a message to a value in a future turn
   * @param object* the recipient
   * @param op the name of the message operation, e.g., "when",
   * @param args further arguments to be forwarded to the operation
   * @returns result {Promise} a promise for the result of the operation
   */


  Q.dispatch = dispatch;

  function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
  }

  Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
      self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
  };
  /**
   * Gets the value of a property in a future turn.
   * @param object    promise or immediate reference for target object
   * @param name      name of property to get
   * @return promise for the property value
   */


  Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
  };

  Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
  };
  /**
   * Sets the value of a property in a future turn.
   * @param object    promise or immediate reference for object object
   * @param name      name of property to set
   * @param value     new value of property
   * @return promise for the return value
   */


  Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
  };

  Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
  };
  /**
   * Deletes a property in a future turn.
   * @param object    promise or immediate reference for target object
   * @param name      name of property to delete
   * @return promise for the return value
   */


  Q.del = // XXX legacy
  Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
  };

  Promise.prototype.del = // XXX legacy
  Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
  };
  /**
   * Invokes a method in a future turn.
   * @param object    promise or immediate reference for target object
   * @param name      name of method to invoke
   * @param value     a value to post, typically an array of
   *                  invocation arguments for promises that
   *                  are ultimately backed with `resolve` values,
   *                  as opposed to those backed with URLs
   *                  wherein the posted value can be any
   *                  JSON serializable object.
   * @return promise for the return value
   */
  // bound locally because it is used by other methods


  Q.mapply = // XXX As proposed by "Redsandro"
  Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
  };

  Promise.prototype.mapply = // XXX As proposed by "Redsandro"
  Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
  };
  /**
   * Invokes a method in a future turn.
   * @param object    promise or immediate reference for target object
   * @param name      name of method to invoke
   * @param ...args   array of invocation arguments
   * @return promise for the return value
   */


  Q.send = // XXX Mark Miller's proposed parlance
  Q.mcall = // XXX As proposed by "Redsandro"
  Q.invoke = function (object, name
  /*...args*/
  ) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
  };

  Promise.prototype.send = // XXX Mark Miller's proposed parlance
  Promise.prototype.mcall = // XXX As proposed by "Redsandro"
  Promise.prototype.invoke = function (name
  /*...args*/
  ) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
  };
  /**
   * Applies the promised function in a future turn.
   * @param object    promise or immediate reference for target function
   * @param args      array of application arguments
   */


  Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
  };

  Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
  };
  /**
   * Calls the promised function in a future turn.
   * @param object    promise or immediate reference for target function
   * @param ...args   array of application arguments
   */


  Q["try"] = Q.fcall = function (object
  /* ...args*/
  ) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
  };

  Promise.prototype.fcall = function ()
  /*...args*/
  {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
  };
  /**
   * Binds the promised function, transforming return values into a fulfilled
   * promise and thrown errors into a rejected one.
   * @param object    promise or immediate reference for target function
   * @param ...args   array of application arguments
   */


  Q.fbind = function (object
  /*...args*/
  ) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
      return promise.dispatch("apply", [this, args.concat(array_slice(arguments))]);
    };
  };

  Promise.prototype.fbind = function ()
  /*...args*/
  {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
      return promise.dispatch("apply", [this, args.concat(array_slice(arguments))]);
    };
  };
  /**
   * Requests the names of the owned properties of a promised
   * object in a future turn.
   * @param object    promise or immediate reference for target object
   * @return promise for the keys of the eventually settled object
   */


  Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
  };

  Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
  };
  /**
   * Turns an array of promises into a promise for an array.  If any of
   * the promises gets rejected, the whole array is rejected immediately.
   * @param {Array*} an array (or promise for an array) of values (or
   * promises for values)
   * @returns a promise for an array of the corresponding values
   */
  // By Mark Miller
  // http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled


  Q.all = all;

  function all(promises) {
    return when(promises, function (promises) {
      var pendingCount = 0;
      var deferred = defer();
      array_reduce(promises, function (undefined, promise, index) {
        var snapshot;

        if (isPromise(promise) && (snapshot = promise.inspect()).state === "fulfilled") {
          promises[index] = snapshot.value;
        } else {
          ++pendingCount;
          when(promise, function (value) {
            promises[index] = value;

            if (--pendingCount === 0) {
              deferred.resolve(promises);
            }
          }, deferred.reject, function (progress) {
            deferred.notify({
              index: index,
              value: progress
            });
          });
        }
      }, void 0);

      if (pendingCount === 0) {
        deferred.resolve(promises);
      }

      return deferred.promise;
    });
  }

  Promise.prototype.all = function () {
    return all(this);
  };
  /**
   * Returns the first resolved promise of an array. Prior rejected promises are
   * ignored.  Rejects only if all promises are rejected.
   * @param {Array*} an array containing values or promises for values
   * @returns a promise fulfilled with the value of the first resolved promise,
   * or a rejected promise if all promises are rejected.
   */


  Q.any = any;

  function any(promises) {
    if (promises.length === 0) {
      return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
      var promise = promises[index];
      pendingCount++;
      when(promise, onFulfilled, onRejected, onProgress);

      function onFulfilled(result) {
        deferred.resolve(result);
      }

      function onRejected(err) {
        pendingCount--;

        if (pendingCount === 0) {
          var rejection = err || new Error("" + err);
          rejection.message = "Q can't get fulfillment value from any promise, all " + "promises were rejected. Last error message: " + rejection.message;
          deferred.reject(rejection);
        }
      }

      function onProgress(progress) {
        deferred.notify({
          index: index,
          value: progress
        });
      }
    }, undefined);
    return deferred.promise;
  }

  Promise.prototype.any = function () {
    return any(this);
  };
  /**
   * Waits for all promises to be settled, either fulfilled or
   * rejected.  This is distinct from `all` since that would stop
   * waiting at the first rejection.  The promise returned by
   * `allResolved` will never be rejected.
   * @param promises a promise for an array (or an array) of promises
   * (or values)
   * @return a promise for an array of promises
   */


  Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");

  function allResolved(promises) {
    return when(promises, function (promises) {
      promises = array_map(promises, Q);
      return when(all(array_map(promises, function (promise) {
        return when(promise, noop, noop);
      })), function () {
        return promises;
      });
    });
  }

  Promise.prototype.allResolved = function () {
    return allResolved(this);
  };
  /**
   * @see Promise#allSettled
   */


  Q.allSettled = allSettled;

  function allSettled(promises) {
    return Q(promises).allSettled();
  }
  /**
   * Turns an array of promises into a promise for an array of their states (as
   * returned by `inspect`) when they have all settled.
   * @param {Array[Any*]} values an array (or promise for an array) of values (or
   * promises for values)
   * @returns {Array[State]} an array of states for the respective values.
   */


  Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
      return all(array_map(promises, function (promise) {
        promise = Q(promise);

        function regardless() {
          return promise.inspect();
        }

        return promise.then(regardless, regardless);
      }));
    });
  };
  /**
   * Captures the failure of a promise, giving an oportunity to recover
   * with a callback.  If the given promise is fulfilled, the returned
   * promise is fulfilled.
   * @param {Any*} promise for something
   * @param {Function} callback to fulfill the returned promise if the
   * given promise is rejected
   * @returns a promise for the return value of the callback
   */


  Q.fail = // XXX legacy
  Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
  };

  Promise.prototype.fail = // XXX legacy
  Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
  };
  /**
   * Attaches a listener that can respond to progress notifications from a
   * promise's originating deferred. This listener receives the exact arguments
   * passed to ``deferred.notify``.
   * @param {Any*} promise for something
   * @param {Function} callback to receive any progress notifications
   * @returns the given promise, unchanged
   */


  Q.progress = progress;

  function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
  }

  Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
  };
  /**
   * Provides an opportunity to observe the settling of a promise,
   * regardless of whether the promise is fulfilled or rejected.  Forwards
   * the resolution to the returned promise when the callback is done.
   * The callback can return a promise to defer completion.
   * @param {Any*} promise
   * @param {Function} callback to observe the resolution of the given
   * promise, takes no arguments.
   * @returns a promise for the resolution of the given promise when
   * ``fin`` is done.
   */


  Q.fin = // XXX legacy
  Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
  };

  Promise.prototype.fin = // XXX legacy
  Promise.prototype["finally"] = function (callback) {
    if (!callback || typeof callback.apply !== "function") {
      throw new Error("Q can't apply finally callback");
    }

    callback = Q(callback);
    return this.then(function (value) {
      return callback.fcall().then(function () {
        return value;
      });
    }, function (reason) {
      // TODO attempt to recycle the rejection with "this".
      return callback.fcall().then(function () {
        throw reason;
      });
    });
  };
  /**
   * Terminates a chain of promises, forcing rejections to be
   * thrown as exceptions.
   * @param {Any*} promise at the end of a chain of promises
   * @returns nothing
   */


  Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
  };

  Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function onUnhandledError(error) {
      // forward to a future turn so that ``when``
      // does not catch it and turn it into a rejection.
      Q.nextTick(function () {
        makeStackTraceLong(error, promise);

        if (Q.onerror) {
          Q.onerror(error);
        } else {
          throw error;
        }
      });
    }; // Avoid unnecessary `nextTick`ing via an unnecessary `when`.


    var promise = fulfilled || rejected || progress ? this.then(fulfilled, rejected, progress) : this;

    if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process && process.domain) {
      onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
  };
  /**
   * Causes a promise to be rejected if it does not get fulfilled before
   * some milliseconds time out.
   * @param {Any*} promise
   * @param {Number} milliseconds timeout
   * @param {Any*} custom error message or Error object (optional)
   * @returns a promise for the resolution of the given promise if it is
   * fulfilled before the timeout, otherwise rejected.
   */


  Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
  };

  Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
      if (!error || "string" === typeof error) {
        error = new Error(error || "Timed out after " + ms + " ms");
        error.code = "ETIMEDOUT";
      }

      deferred.reject(error);
    }, ms);
    this.then(function (value) {
      clearTimeout(timeoutId);
      deferred.resolve(value);
    }, function (exception) {
      clearTimeout(timeoutId);
      deferred.reject(exception);
    }, deferred.notify);
    return deferred.promise;
  };
  /**
   * Returns a promise for the given value (or promised value), some
   * milliseconds after it resolved. Passes rejections immediately.
   * @param {Any*} promise
   * @param {Number} milliseconds
   * @returns a promise for the resolution of the given promise after milliseconds
   * time has elapsed since the resolution of the given promise.
   * If the given promise rejects, that is passed immediately.
   */


  Q.delay = function (object, timeout) {
    if (timeout === void 0) {
      timeout = object;
      object = void 0;
    }

    return Q(object).delay(timeout);
  };

  Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
      var deferred = defer();
      setTimeout(function () {
        deferred.resolve(value);
      }, timeout);
      return deferred.promise;
    });
  };
  /**
   * Passes a continuation to a Node function, which is called with the given
   * arguments provided as an array, and returns a promise.
   *
   *      Q.nfapply(FS.readFile, [__filename])
   *      .then(function (content) {
   *      })
   *
   */


  Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
  };

  Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
  };
  /**
   * Passes a continuation to a Node function, which is called with the given
   * arguments provided individually, and returns a promise.
   * @example
   * Q.nfcall(FS.readFile, __filename)
   * .then(function (content) {
   * })
   *
   */


  Q.nfcall = function (callback
  /*...args*/
  ) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
  };

  Promise.prototype.nfcall = function ()
  /*...args*/
  {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
  };
  /**
   * Wraps a NodeJS continuation passing function and returns an equivalent
   * version that returns a promise.
   * @example
   * Q.nfbind(FS.readFile, __filename)("utf-8")
   * .then(console.log)
   * .done()
   */


  Q.nfbind = Q.denodeify = function (callback
  /*...args*/
  ) {
    if (callback === undefined) {
      throw new Error("Q can't wrap an undefined function");
    }

    var baseArgs = array_slice(arguments, 1);
    return function () {
      var nodeArgs = baseArgs.concat(array_slice(arguments));
      var deferred = defer();
      nodeArgs.push(deferred.makeNodeResolver());
      Q(callback).fapply(nodeArgs).fail(deferred.reject);
      return deferred.promise;
    };
  };

  Promise.prototype.nfbind = Promise.prototype.denodeify = function ()
  /*...args*/
  {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
  };

  Q.nbind = function (callback, thisp
  /*...args*/
  ) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
      var nodeArgs = baseArgs.concat(array_slice(arguments));
      var deferred = defer();
      nodeArgs.push(deferred.makeNodeResolver());

      function bound() {
        return callback.apply(thisp, arguments);
      }

      Q(bound).fapply(nodeArgs).fail(deferred.reject);
      return deferred.promise;
    };
  };

  Promise.prototype.nbind = function ()
  /*thisp, ...args*/
  {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
  };
  /**
   * Calls a method of a Node-style object that accepts a Node-style
   * callback with a given array of arguments, plus a provided callback.
   * @param object an object that has the named method
   * @param {String} name name of the method of object
   * @param {Array} args arguments to pass to the method; the callback
   * will be provided by Q and appended to these arguments.
   * @returns a promise for the value or error
   */


  Q.nmapply = // XXX As proposed by "Redsandro"
  Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
  };

  Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
  Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
  };
  /**
   * Calls a method of a Node-style object that accepts a Node-style
   * callback, forwarding the given variadic arguments, plus a provided
   * callback argument.
   * @param object an object that has the named method
   * @param {String} name name of the method of object
   * @param ...args arguments to pass to the method; the callback will
   * be provided by Q and appended to these arguments.
   * @returns a promise for the value or error
   */


  Q.nsend = // XXX Based on Mark Miller's proposed "send"
  Q.nmcall = // XXX Based on "Redsandro's" proposal
  Q.ninvoke = function (object, name
  /*...args*/
  ) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
  };

  Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
  Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
  Promise.prototype.ninvoke = function (name
  /*...args*/
  ) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
  };
  /**
   * If a function would like to support both Node continuation-passing-style and
   * promise-returning-style, it can end its internal promise chain with
   * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
   * elects to use a nodeback, the result will be sent there.  If they do not
   * pass a nodeback, they will receive the result promise.
   * @param object a result (or a promise for a result)
   * @param {Function} nodeback a Node.js-style callback
   * @returns either the promise or nothing
   */


  Q.nodeify = nodeify;

  function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
  }

  Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
      this.then(function (value) {
        Q.nextTick(function () {
          nodeback(null, value);
        });
      }, function (error) {
        Q.nextTick(function () {
          nodeback(error);
        });
      });
    } else {
      return this;
    }
  };

  Q.noConflict = function () {
    throw new Error("Q.noConflict only works when Q is used as a global");
  }; // All code before this point will be filtered from stack traces.


  var qEndingLine = captureLine();
  return Q;
});

}).call(this,require('_process'),require("timers").setImmediate)
},{"_process":129,"core-js/modules/web.immediate":118,"timers":130}],54:[function(require,module,exports){
"use strict";

function Agent() {
  this._defaults = [];
}

["use", "on", "once", "set", "query", "type", "accept", "auth", "withCredentials", "sortQuery", "retry", "ok", "redirects", "timeout", "buffer", "serialize", "parse", "ca", "key", "pfx", "cert"].forEach(function (fn) {
  /** Default setting for all requests from this agent */
  Agent.prototype[fn] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this._defaults.push({
      fn: fn,
      args: args
    });

    return this;
  };
});

Agent.prototype._setDefaults = function (req) {
  this._defaults.forEach(function (def) {
    req[def.fn].apply(req, def.args);
  });
};

module.exports = Agent;

},{}],55:[function(require,module,exports){
"use strict";

require("core-js/modules/es.string.replace");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Root reference for iframes.
 */
var root;

if (typeof window !== 'undefined') {
  // Browser window
  root = window;
} else if (typeof self !== 'undefined') {
  // Web Worker
  root = self;
} else {
  // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = void 0;
}

var Emitter = require('component-emitter');

var RequestBase = require('./request-base');

var isObject = require('./is-object');

var ResponseBase = require('./response-base');

var Agent = require('./agent-base');
/**
 * Noop.
 */


function noop() {}

;
/**
 * Expose `request`.
 */

var request = exports = module.exports = function (method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  } // url first


  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
};

exports.Request = Request;
/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest && (!root.location || 'file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest();
  } else {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch (e) {}

    try {
      return new ActiveXObject('Msxml2.XMLHTTP.6.0');
    } catch (e) {}

    try {
      return new ActiveXObject('Msxml2.XMLHTTP.3.0');
    } catch (e) {}

    try {
      return new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {}
  }

  throw Error("Browser-only version of superagent could not find XHR");
};
/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */


var trim = ''.trim ? function (s) {
  return s.trim();
} : function (s) {
  return s.replace(/(^\s*|\s*$)/g, '');
};
/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];

  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }

  return pairs.join('&');
}
/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */


function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function (v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for (var subkey in val) {
        pushEncodedKeyValuePair(pairs, "".concat(key, "[").concat(subkey, "]"), val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}
/**
 * Expose serialization method.
 */


request.serializeObject = serialize;
/**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');

    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] = decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}
/**
 * Expose parser.
 */


request.parseString = parseString;
/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};
/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

request.serialize = {
  'application/x-www-form-urlencoded': serialize,
  'application/json': JSON.stringify
};
/**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};
/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');

    if (index === -1) {
      // could be empty line, just skip it
      continue;
    }

    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}
/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */


function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return /[\/+]json($|[^-\w])/.test(mime);
}
/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */


function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr; // responseText is accessible only if responseType is '' or 'text' and on older browsers

  this.text = this.req.method != 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text') || typeof this.xhr.responseType === 'undefined' ? this.xhr.responseText : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status; // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request

  if (status === 1223) {
    status = 204;
  }

  this._setStatusProperties(status);

  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders()); // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.

  this.header['content-type'] = this.xhr.getResponseHeader('content-type');

  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD' ? this._parseBody(this.text ? this.text : this.xhr.response) : null;
  }
}

ResponseBase(Response.prototype);
/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function (str) {
  var parse = request.parse[this.type];

  if (this.req._parser) {
    return this.req._parser(this, str);
  }

  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }

  return parse && str && (str.length || str instanceof Object) ? parse(str) : null;
};
/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */


Response.prototype.toError = function () {
  var req = this.req;
  var method = req.method;
  var url = req.url;
  var msg = "cannot ".concat(method, " ").concat(url, " (").concat(this.status, ")");
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;
  return err;
};
/**
 * Expose `Response`.
 */


request.Response = Response;
/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case

  this._header = {}; // coerces header names to lowercase

  this.on('end', function () {
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch (e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e; // issue #675: return the raw response if the response parsing fails

      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response; // issue #876: return the http status code if the response parsing fails

        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);
    var new_err;

    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      }
    } catch (custom_err) {
      new_err = custom_err; // ok() callback can throw
    } // #1000 don't catch errors from the callback to avoid double calling it


    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}
/**
 * Mixin `Emitter` and `RequestBase`.
 */


Emitter(Request.prototype);
RequestBase(Request.prototype);
/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function (type) {
  this.set('Content-Type', request.types[type] || type);
  return this;
};
/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.accept = function (type) {
  this.set('Accept', request.types[type] || type);
  return this;
};
/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.auth = function (user, pass, options) {
  if (1 === arguments.length) pass = '';

  if (_typeof(pass) === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }

  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto'
    };
  }

  var encoder = function encoder(string) {
    if ('function' === typeof btoa) {
      return btoa(string);
    }

    throw new Error('Cannot use basic auth, btoa is not a function');
  };

  return this._auth(user, pass, options, encoder);
};
/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.query = function (val) {
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};
/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.attach = function (field, file, options) {
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }

  return this;
};

Request.prototype._getFormData = function () {
  if (!this._formData) {
    this._formData = new root.FormData();
  }

  return this._formData;
};
/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */


Request.prototype.callback = function (err, res) {
  if (this._shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};
/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */


Request.prototype.crossDomainError = function () {
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;
  err.status = this.status;
  err.method = this.method;
  err.url = this.url;
  this.callback(err);
}; // This only warns, because the request is still likely to work


Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function () {
  console.warn("This is not supported in browser version of superagent");
  return this;
}; // This throws, because it can't send/receive data as expected


Request.prototype.pipe = Request.prototype.write = function () {
  throw Error("Streaming is not supported in browser version of superagent");
};
/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */


Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === _typeof(obj) && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
};
/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.end = function (fn) {
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }

  this._endCalled = true; // store callback

  this._callback = fn || noop; // querystring

  this._finalizeQueryString();

  this._end();
};

Request.prototype._end = function () {
  if (this._aborted) return this.callback(Error("The request has been aborted even before .end() was called"));
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts(); // state change


  xhr.onreadystatechange = function () {
    var readyState = xhr.readyState;

    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }

    if (4 != readyState) {
      return;
    } // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"


    var status;

    try {
      status = xhr.status;
    } catch (e) {
      status = 0;
    }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }

    self.emit('end');
  }; // progress


  var handleProgress = function handleProgress(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }

    e.direction = direction;
    self.emit('progress', e);
  };

  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');

      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch (e) {// Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  } // initiate request


  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  } // CORS


  if (this._withCredentials) xhr.withCredentials = true; // body

  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];

    var _serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];

    if (!_serialize && isJSON(contentType)) {
      _serialize = request.serialize['application/json'];
    }

    if (_serialize) data = _serialize(data);
  } // set header fields


  for (var field in this.header) {
    if (null == this.header[field]) continue;
    if (this.header.hasOwnProperty(field)) xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  } // send stuff


  this.emit('request', this); // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined

  xhr.send(typeof data !== 'undefined' ? data : null);
};

request.agent = function () {
  return new Agent();
};

["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"].forEach(function (method) {
  Agent.prototype[method.toLowerCase()] = function (url, fn) {
    var req = new request.Request(method, url);

    this._setDefaults(req);

    if (fn) {
      req.end(fn);
    }

    return req;
  };
});
Agent.prototype.del = Agent.prototype['delete'];
/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function (url, data, fn) {
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.head = function (url, data, fn) {
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.options = function (url, data, fn) {
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


function del(url, data, fn) {
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
}

request['del'] = del;
request['delete'] = del;
/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function (url, data, fn) {
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.post = function (url, data, fn) {
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.put = function (url, data, fn) {
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./agent-base":54,"./is-object":56,"./request-base":57,"./response-base":58,"component-emitter":51,"core-js/modules/es.string.replace":117}],56:[function(require,module,exports){
'use strict';
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function isObject(obj) {
  return null !== obj && 'object' === _typeof(obj);
}

module.exports = isObject;

},{}],57:[function(require,module,exports){
'use strict';
/**
 * Module of mixed-in functions shared between node and client code
 */

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var isObject = require('./is-object');
/**
 * Expose `RequestBase`.
 */


module.exports = RequestBase;
/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }

  return obj;
}
/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.clearTimeout = function _clearTimeout() {
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};
/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.parse = function parse(fn) {
  this._parser = fn;
  return this;
};
/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.responseType = function (val) {
  this._responseType = val;
  return this;
};
/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.serialize = function serialize(fn) {
  this._serializer = fn;
  return this;
};
/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.timeout = function timeout(options) {
  if (!options || 'object' !== _typeof(options)) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for (var option in options) {
    switch (option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;

      case 'response':
        this._responseTimeout = options.response;
        break;

      default:
        console.warn("Unknown timeout option", option);
    }
  }

  return this;
};
/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @param {Function} [fn]
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.retry = function retry(count, fn) {
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  this._retryCallback = fn;
  return this;
};

var ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EADDRINFO', 'ESOCKETTIMEDOUT'];
/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */

RequestBase.prototype._shouldRetry = function (err, res) {
  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
    return false;
  }

  if (this._retryCallback) {
    try {
      var override = this._retryCallback(err, res);

      if (override === true) return true;
      if (override === false) return false; // undefined falls back to defaults
    } catch (e) {
      console.error(e);
    }
  }

  if (res && res.status && res.status >= 500 && res.status != 501) return true;

  if (err) {
    if (err.code && ~ERROR_CODES.indexOf(err.code)) return true; // Superagent timeout

    if (err.timeout && err.code == 'ECONNABORTED') return true;
    if (err.crossDomain) return true;
  }

  return false;
};
/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */


RequestBase.prototype._retry = function () {
  this.clearTimeout(); // node

  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;
  return this._end();
};
/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */


RequestBase.prototype.then = function then(resolve, reject) {
  var _this = this;

  if (!this._fullfilledPromise) {
    var self = this;

    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }

    this._fullfilledPromise = new Promise(function (innerResolve, innerReject) {
      self.on('error', innerReject);
      self.on('abort', function () {
        var err = new Error('Aborted');
        err.code = "ABORTED";
        err.status = _this.status;
        err.method = _this.method;
        err.url = _this.url;
        innerReject(err);
      });
      self.end(function (err, res) {
        if (err) innerReject(err);else innerResolve(res);
      });
    });
  }

  return this._fullfilledPromise.then(resolve, reject);
};

RequestBase.prototype['catch'] = function (cb) {
  return this.then(undefined, cb);
};
/**
 * Allow for extension
 */


RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
};

RequestBase.prototype.ok = function (cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function (res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};
/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


RequestBase.prototype.get = function (field) {
  return this._header[field.toLowerCase()];
};
/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */


RequestBase.prototype.getHeader = RequestBase.prototype.get;
/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function (field, val) {
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }

    return this;
  }

  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};
/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */


RequestBase.prototype.unset = function (field) {
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};
/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.field = function (name, val) {
  // name should be either a string or an object.
  if (null === name || undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    throw new Error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }

    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }

    return this;
  } // val should be defined now


  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }

  if ('boolean' === typeof val) {
    val = '' + val;
  }

  this._getFormData().append(name, val);

  return this;
};
/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */


RequestBase.prototype.abort = function () {
  if (this._aborted) {
    return this;
  }

  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser

  this.req && this.req.abort(); // node

  this.clearTimeout();
  this.emit('abort');
  return this;
};

RequestBase.prototype._auth = function (user, pass, options, base64Encoder) {
  switch (options.type) {
    case 'basic':
      this.set('Authorization', "Basic ".concat(base64Encoder("".concat(user, ":").concat(pass))));
      break;

    case 'auto':
      this.username = user;
      this.password = pass;
      break;

    case 'bearer':
      // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', "Bearer ".concat(user));
      break;
  }

  return this;
};
/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */


RequestBase.prototype.withCredentials = function (on) {
  // This is browser-only functionality. Node side is no-op.
  if (on == undefined) on = true;
  this._withCredentials = on;
  return this;
};
/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.redirects = function (n) {
  this._maxRedirects = n;
  return this;
};
/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n
 * @return {Request} for chaining
 */


RequestBase.prototype.maxResponseSize = function (n) {
  if ('number' !== typeof n) {
    throw TypeError("Invalid argument");
  }

  this._maxResponseSize = n;
  return this;
};
/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */


RequestBase.prototype.toJSON = function () {
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};
/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.send = function (data) {
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    throw new Error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  } // merge


  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];

    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data ? "".concat(this._data, "&").concat(data) : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  } // default to json


  if (!type) this.type('json');
  return this;
};
/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.sortQuery = function (sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};
/**
 * Compose querystring to append to req.url
 *
 * @api private
 */


RequestBase.prototype._finalizeQueryString = function () {
  var query = this._query.join('&');

  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }

  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');

    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');

      if ('function' === typeof this._sort) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }

      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
}; // For backwards compat only


RequestBase.prototype._appendQueryString = function () {
  console.trace("Unsupported");
};
/**
 * Invoke callback with timeout error.
 *
 * @api private
 */


RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
  if (this._aborted) {
    return;
  }

  var err = new Error("".concat(reason + timeout, "ms exceeded"));
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function () {
  var self = this; // deadline

  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function () {
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  } // response timeout


  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function () {
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
};

},{"./is-object":56}],58:[function(require,module,exports){
'use strict';
/**
 * Module dependencies.
 */

var utils = require('./utils');
/**
 * Expose `ResponseBase`.
 */


module.exports = ResponseBase;
/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }

  return obj;
}
/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


ResponseBase.prototype.get = function (field) {
  return this.header[field.toLowerCase()];
};
/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */


ResponseBase.prototype._setHeaderProperties = function (header) {
  // TODO: moar!
  // TODO: make this a util
  // content-type
  var ct = header['content-type'] || '';
  this.type = utils.type(ct); // params

  var params = utils.params(ct);

  for (var key in params) {
    this[key] = params[key];
  }

  this.links = {}; // links

  try {
    if (header.link) {
      this.links = utils.parseLinks(header.link);
    }
  } catch (err) {// ignore
  }
};
/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */


ResponseBase.prototype._setStatusProperties = function (status) {
  var type = status / 100 | 0; // status / class

  this.status = this.statusCode = status;
  this.statusType = type; // basics

  this.info = 1 == type;
  this.ok = 2 == type;
  this.redirect = 3 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = 4 == type || 5 == type ? this.toError() : false; // sugar

  this.created = 201 == status;
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.forbidden = 403 == status;
  this.notFound = 404 == status;
  this.unprocessableEntity = 422 == status;
};

},{"./utils":59}],59:[function(require,module,exports){
'use strict';
/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function (str) {
  return str.split(/ *; */).shift();
};
/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.params = function (str) {
  return str.split(/ *; */).reduce(function (obj, str) {
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();
    if (key && val) obj[key] = val;
    return obj;
  }, {});
};
/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.parseLinks = function (str) {
  return str.split(/ *, */).reduce(function (obj, str) {
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};
/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */


exports.cleanHeader = function (header, changesOrigin) {
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host']; // secuirty

  if (changesOrigin) {
    delete header['authorization'];
    delete header['cookie'];
  }

  return header;
};

},{}],60:[function(require,module,exports){
'use strict';

exports.byteLength = byteLength;
exports.toByteArray = toByteArray;
exports.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
} // Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications


revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;

function getLens(b64) {
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  } // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42


  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
} // base64 is 4/3 + up to two characters of the original data


function byteLength(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars

  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;

  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  return arr;
}

function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}

function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];

  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }

  return output.join('');
}

function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3
  // go through the array every three bytes, we'll deal with trailing stuff later

  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  } // pad the end with zeros, but make sure to not forget the extra bytes


  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }

  return parts.join('');
}

},{}],61:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

/* eslint-disable no-proto */
'use strict';

require("core-js/modules/es.string.replace");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var base64 = require('base64-js');

var ieee754 = require('ieee754');

var customInspectSymbol = typeof Symbol === 'function' && typeof Symbol["for"] === 'function' ? Symbol["for"]('nodejs.util.inspect.custom') : null;
exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.INSPECT_MAX_BYTES = 50;
var K_MAX_LENGTH = 0x7fffffff;
exports.kMaxLength = K_MAX_LENGTH;
/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */

Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
  console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}

function typedArraySupport() {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1);
    var proto = {
      foo: function foo() {
        return 42;
      }
    };
    Object.setPrototypeOf(proto, Uint8Array.prototype);
    Object.setPrototypeOf(arr, proto);
    return arr.foo() === 42;
  } catch (e) {
    return false;
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.buffer;
  }
});
Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.byteOffset;
  }
});

function createBuffer(length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  } // Return an augmented `Uint8Array` instance


  var buf = new Uint8Array(length);
  Object.setPrototypeOf(buf, Buffer.prototype);
  return buf;
}
/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */


function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError('The "string" argument must be of type string. Received type number');
    }

    return allocUnsafe(arg);
  }

  return from(arg, encodingOrOffset, length);
}

Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset);
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value);
  }

  if (value == null) {
    throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
  }

  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof value === 'number') {
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  }

  var valueOf = value.valueOf && value.valueOf();

  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length);
  }

  var b = fromObject(value);
  if (b) return b;

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
}
/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/


Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
}; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148


Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);

function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number');
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
  }
}

function alloc(size, fill, encoding) {
  assertSize(size);

  if (size <= 0) {
    return createBuffer(size);
  }

  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  }

  return createBuffer(size);
}
/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/


Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding);
};

function allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */


Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */


Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size);
};

function fromString(string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }

  var length = byteLength(string, encoding) | 0;
  var buf = createBuffer(length);
  var actual = buf.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual);
  }

  return buf;
}

function fromArrayLike(array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  var buf = createBuffer(length);

  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255;
  }

  return buf;
}

function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds');
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds');
  }

  var buf;

  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array);
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset);
  } else {
    buf = new Uint8Array(array, byteOffset, length);
  } // Return an augmented `Uint8Array` instance


  Object.setPrototypeOf(buf, Buffer.prototype);
  return buf;
}

function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0;
    var buf = createBuffer(len);

    if (buf.length === 0) {
      return buf;
    }

    obj.copy(buf, 0, 0, len);
    return buf;
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0);
    }

    return fromArrayLike(obj);
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}

function checked(length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
  }

  return length | 0;
}

function SlowBuffer(length) {
  if (+length != length) {
    // eslint-disable-line eqeqeq
    length = 0;
  }

  return Buffer.alloc(+length);
}

Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};

Buffer.compare = function compare(a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);

  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  }

  if (a === b) return 0;
  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};

Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true;

    default:
      return false;
  }
};

Buffer.concat = function concat(list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }

  if (list.length === 0) {
    return Buffer.alloc(0);
  }

  var i;

  if (length === undefined) {
    length = 0;

    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;

  for (i = 0; i < list.length; ++i) {
    var buf = list[i];

    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf);
    }

    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    buf.copy(buffer, pos);
    pos += buf.length;
  }

  return buffer;
};

function byteLength(string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length;
  }

  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength;
  }

  if (typeof string !== 'string') {
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + _typeof(string));
  }

  var len = string.length;
  var mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion

  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len;

      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length;

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2;

      case 'hex':
        return len >>> 1;

      case 'base64':
        return base64ToBytes(string).length;

      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
        }

        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}

Buffer.byteLength = byteLength;

function slowToString(encoding, start, end) {
  var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.
  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

  if (start === undefined || start < 0) {
    start = 0;
  } // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.


  if (start > this.length) {
    return '';
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return '';
  } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return '';
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end);

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end);

      case 'ascii':
        return asciiSlice(this, start, end);

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end);

      case 'base64':
        return base64Slice(this, start, end);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
} // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154


Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
  var len = this.length;

  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits');
  }

  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }

  return this;
};

Buffer.prototype.swap32 = function swap32() {
  var len = this.length;

  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits');
  }

  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }

  return this;
};

Buffer.prototype.swap64 = function swap64() {
  var len = this.length;

  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits');
  }

  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }

  return this;
};

Buffer.prototype.toString = function toString() {
  var length = this.length;
  if (length === 0) return '';
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};

Buffer.prototype.inspect = function inspect() {
  var str = '';
  var max = exports.INSPECT_MAX_BYTES;
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
  if (this.length > max) str += ' ... ';
  return '<Buffer ' + str + '>';
};

if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
}

Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength);
  }

  if (!Buffer.isBuffer(target)) {
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + _typeof(target));
  }

  if (start === undefined) {
    start = 0;
  }

  if (end === undefined) {
    end = target ? target.length : 0;
  }

  if (thisStart === undefined) {
    thisStart = 0;
  }

  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index');
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }

  if (thisStart >= thisEnd) {
    return -1;
  }

  if (start >= end) {
    return 1;
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
}; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf


function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1; // Normalize byteOffset

  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }

  byteOffset = +byteOffset; // Coerce to Number.

  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : buffer.length - 1;
  } // Normalize byteOffset: negative offsets start from the end of the buffer


  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

  if (byteOffset >= buffer.length) {
    if (dir) return -1;else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;else return -1;
  } // Normalize val


  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  } // Finally, search either indexOf (if dir is true) or lastIndexOf


  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1;
    }

    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]

    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }

    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }

  throw new TypeError('val must be string, number or Buffer');
}

function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();

    if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }

      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read(buf, i) {
    if (indexSize === 1) {
      return buf[i];
    } else {
      return buf.readUInt16BE(i * indexSize);
    }
  }

  var i;

  if (dir) {
    var foundIndex = -1;

    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

    for (i = byteOffset; i >= 0; i--) {
      var found = true;

      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break;
        }
      }

      if (found) return i;
    }
  }

  return -1;
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;

  if (!length) {
    length = remaining;
  } else {
    length = Number(length);

    if (length > remaining) {
      length = remaining;
    }
  }

  var strLen = string.length;

  if (length > strLen / 2) {
    length = strLen / 2;
  }

  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (numberIsNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }

  return i;
}

function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}

function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}

function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}

function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}

function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}

Buffer.prototype.write = function write(string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0; // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0; // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0;

    if (isFinite(length)) {
      length = length >>> 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  } else {
    throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds');
  }

  if (!encoding) encoding = 'utf8';
  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length);

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length);

      case 'ascii':
        return asciiWrite(this, string, offset, length);

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length);

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON() {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};

function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf);
  } else {
    return base64.fromByteArray(buf.slice(start, end));
  }
}

function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;

  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }

          break;

        case 2:
          secondByte = buf[i + 1];

          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }

      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res);
} // Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety


var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;

  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
  } // Decode in chunks to avoid "call stack size exceeded".


  var res = '';
  var i = 0;

  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }

  return res;
}

function asciiSlice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }

  return ret;
}

function latin1Slice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }

  return ret;
}

function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = '';

  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]];
  }

  return out;
}

function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';

  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }

  return res;
}

Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;
  var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance

  Object.setPrototypeOf(newBuf, Buffer.prototype);
  return newBuf;
};
/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */


function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}

Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val;
};

Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;

  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val;
};

Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};

Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};

Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};

Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};

Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};

Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];

  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return this[offset];
  return (0xff - this[offset] + 1) * -1;
};

Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};

Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};

Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, true, 23, 4);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, false, 23, 4);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, true, 52, 8);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, false, 52, 8);
};

function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
}

Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset + 3] = value >>> 24;
  this[offset + 2] = value >>> 16;
  this[offset + 1] = value >>> 8;
  this[offset] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  this[offset + 2] = value >>> 16;
  this[offset + 3] = value >>> 24;
  return offset + 4;
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
  if (offset < 0) throw new RangeError('Index out of range');
}

function writeFloat(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  ieee754.write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}

Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};

function writeDouble(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  ieee754.write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
}; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds');
  }

  if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
  if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

  if (end > this.length) end = this.length;

  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end);
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  }

  return len;
}; // Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])


Buffer.prototype.fill = function fill(val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string');
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }

    if (val.length === 1) {
      var code = val.charCodeAt(0);

      if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code;
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  } else if (typeof val === 'boolean') {
    val = Number(val);
  } // Invalid ranges are not set to a default, so can range check early.


  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index');
  }

  if (end <= start) {
    return this;
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;

  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
    var len = bytes.length;

    if (len === 0) {
      throw new TypeError('The value "' + val + '" is invalid for argument "value"');
    }

    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this;
}; // HELPER FUNCTIONS
// ================


var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

function base64clean(str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]; // Node strips out invalid characters like \n and \t from the string, base64-js does not

  str = str.trim().replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

  if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

  while (str.length % 4 !== 0) {
    str = str + '=';
  }

  return str;
}

function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i); // is surrogate component

    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } // valid lead


        leadSurrogate = codePoint;
        continue;
      } // 2 leads in a row


      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      } // valid surrogate pair


      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null; // encode utf8

    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return bytes;
}

function asciiToBytes(str) {
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }

  return byteArray;
}

function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray;
}

function base64ToBytes(str) {
  return base64.toByteArray(base64clean(str));
}

function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }

  return i;
} // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166


function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}

function numberIsNaN(obj) {
  // For IE11 support
  return obj !== obj; // eslint-disable-line no-self-compare
} // Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219


var hexSliceLookupTable = function () {
  var alphabet = '0123456789abcdef';
  var table = new Array(256);

  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16;

    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j];
    }
  }

  return table;
}();

}).call(this,require("buffer").Buffer)
},{"base64-js":60,"buffer":61,"core-js/modules/es.string.replace":117,"ieee754":128}],62:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

},{}],63:[function(require,module,exports){
'use strict';
var charAt = require('../internals/string-multibyte').charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex
module.exports = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};

},{"../internals/string-multibyte":107}],64:[function(require,module,exports){
var isObject = require('../internals/is-object');

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

},{"../internals/is-object":87}],65:[function(require,module,exports){
var toIndexedObject = require('../internals/to-indexed-object');
var toLength = require('../internals/to-length');
var toAbsoluteIndex = require('../internals/to-absolute-index');

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

},{"../internals/to-absolute-index":109,"../internals/to-indexed-object":110,"../internals/to-length":112}],66:[function(require,module,exports){
var aFunction = require('../internals/a-function');

// optional / simple context binding
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"../internals/a-function":62}],67:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],68:[function(require,module,exports){
var has = require('../internals/has');
var ownKeys = require('../internals/own-keys');
var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');
var definePropertyModule = require('../internals/object-define-property');

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

},{"../internals/has":79,"../internals/object-define-property":91,"../internals/object-get-own-property-descriptor":92,"../internals/own-keys":97}],69:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],70:[function(require,module,exports){
var fails = require('../internals/fails');

// Thank's IE8 for his funny defineProperty
module.exports = !fails(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"../internals/fails":74}],71:[function(require,module,exports){
var global = require('../internals/global');
var isObject = require('../internals/is-object');

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

},{"../internals/global":78,"../internals/is-object":87}],72:[function(require,module,exports){
// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

},{}],73:[function(require,module,exports){
var global = require('../internals/global');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var hide = require('../internals/hide');
var redefine = require('../internals/redefine');
var setGlobal = require('../internals/set-global');
var copyConstructorProperties = require('../internals/copy-constructor-properties');
var isForced = require('../internals/is-forced');

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      hide(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

},{"../internals/copy-constructor-properties":68,"../internals/global":78,"../internals/hide":81,"../internals/is-forced":86,"../internals/object-get-own-property-descriptor":92,"../internals/redefine":99,"../internals/set-global":104}],74:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

},{}],75:[function(require,module,exports){
'use strict';
var hide = require('../internals/hide');
var redefine = require('../internals/redefine');
var fails = require('../internals/fails');
var wellKnownSymbol = require('../internals/well-known-symbol');
var regexpExec = require('../internals/regexp-exec');

var SPECIES = wellKnownSymbol('species');

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

module.exports = function (KEY, length, exec, sham) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;
    re.exec = function () { execCalled = true; return null; };

    if (KEY === 'split') {
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES] = function () { return re; };
    }

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      if (regexp.exec === regexpExec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
        }
        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
      }
      return { done: false };
    });
    var stringMethod = methods[0];
    var regexMethod = methods[1];

    redefine(String.prototype, KEY, stringMethod);
    redefine(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return regexMethod.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return regexMethod.call(string, this); }
    );
    if (sham) hide(RegExp.prototype[SYMBOL], 'sham', true);
  }
};

},{"../internals/fails":74,"../internals/hide":81,"../internals/redefine":99,"../internals/regexp-exec":101,"../internals/well-known-symbol":116}],76:[function(require,module,exports){
var shared = require('../internals/shared');

module.exports = shared('native-function-to-string', Function.toString);

},{"../internals/shared":106}],77:[function(require,module,exports){
var path = require('../internals/path');
var global = require('../internals/global');

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace])
    : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};

},{"../internals/global":78,"../internals/path":98}],78:[function(require,module,exports){
(function (global){
var O = 'object';
var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == O && globalThis) ||
  check(typeof window == O && window) ||
  check(typeof self == O && self) ||
  check(typeof global == O && global) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],79:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;

module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],80:[function(require,module,exports){
module.exports = {};

},{}],81:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"../internals/create-property-descriptor":69,"../internals/descriptors":70,"../internals/object-define-property":91}],82:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');

module.exports = getBuiltIn('document', 'documentElement');

},{"../internals/get-built-in":77}],83:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var fails = require('../internals/fails');
var createElement = require('../internals/document-create-element');

// Thank's IE8 for his funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

},{"../internals/descriptors":70,"../internals/document-create-element":71,"../internals/fails":74}],84:[function(require,module,exports){
var fails = require('../internals/fails');
var classof = require('../internals/classof-raw');

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

},{"../internals/classof-raw":67,"../internals/fails":74}],85:[function(require,module,exports){
var NATIVE_WEAK_MAP = require('../internals/native-weak-map');
var global = require('../internals/global');
var isObject = require('../internals/is-object');
var hide = require('../internals/hide');
var objectHas = require('../internals/has');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');

var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP) {
  var store = new WeakMap();
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    hide(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/global":78,"../internals/has":79,"../internals/hidden-keys":80,"../internals/hide":81,"../internals/is-object":87,"../internals/native-weak-map":90,"../internals/shared-key":105}],86:[function(require,module,exports){
var fails = require('../internals/fails');

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;

},{"../internals/fails":74}],87:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],88:[function(require,module,exports){
module.exports = false;

},{}],89:[function(require,module,exports){
var fails = require('../internals/fails');

module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

},{"../internals/fails":74}],90:[function(require,module,exports){
var global = require('../internals/global');
var nativeFunctionToString = require('../internals/function-to-string');

var WeakMap = global.WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(nativeFunctionToString.call(WeakMap));

},{"../internals/function-to-string":76,"../internals/global":78}],91:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');
var anObject = require('../internals/an-object');
var toPrimitive = require('../internals/to-primitive');

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"../internals/an-object":64,"../internals/descriptors":70,"../internals/ie8-dom-define":83,"../internals/to-primitive":114}],92:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var toIndexedObject = require('../internals/to-indexed-object');
var toPrimitive = require('../internals/to-primitive');
var has = require('../internals/has');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

},{"../internals/create-property-descriptor":69,"../internals/descriptors":70,"../internals/has":79,"../internals/ie8-dom-define":83,"../internals/object-property-is-enumerable":96,"../internals/to-indexed-object":110,"../internals/to-primitive":114}],93:[function(require,module,exports){
var internalObjectKeys = require('../internals/object-keys-internal');
var enumBugKeys = require('../internals/enum-bug-keys');

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

},{"../internals/enum-bug-keys":72,"../internals/object-keys-internal":95}],94:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],95:[function(require,module,exports){
var has = require('../internals/has');
var toIndexedObject = require('../internals/to-indexed-object');
var indexOf = require('../internals/array-includes').indexOf;
var hiddenKeys = require('../internals/hidden-keys');

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

},{"../internals/array-includes":65,"../internals/has":79,"../internals/hidden-keys":80,"../internals/to-indexed-object":110}],96:[function(require,module,exports){
'use strict';
var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

},{}],97:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var anObject = require('../internals/an-object');

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

},{"../internals/an-object":64,"../internals/get-built-in":77,"../internals/object-get-own-property-names":93,"../internals/object-get-own-property-symbols":94}],98:[function(require,module,exports){
module.exports = require('../internals/global');

},{"../internals/global":78}],99:[function(require,module,exports){
var global = require('../internals/global');
var shared = require('../internals/shared');
var hide = require('../internals/hide');
var has = require('../internals/has');
var setGlobal = require('../internals/set-global');
var nativeFunctionToString = require('../internals/function-to-string');
var InternalStateModule = require('../internals/internal-state');

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(nativeFunctionToString).split('toString');

shared('inspectSource', function (it) {
  return nativeFunctionToString.call(it);
});

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else hide(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || nativeFunctionToString.call(this);
});

},{"../internals/function-to-string":76,"../internals/global":78,"../internals/has":79,"../internals/hide":81,"../internals/internal-state":85,"../internals/set-global":104,"../internals/shared":106}],100:[function(require,module,exports){
var classof = require('./classof-raw');
var regexpExec = require('./regexp-exec');

// `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec
module.exports = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }

  if (classof(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};


},{"./classof-raw":67,"./regexp-exec":101}],101:[function(require,module,exports){
'use strict';
var regexpFlags = require('./regexp-flags');

var nativeExec = RegExp.prototype.exec;
// This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.
var nativeReplace = String.prototype.replace;

var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = nativeExec.call(re, str);

    if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

module.exports = patchedExec;

},{"./regexp-flags":102}],102:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

},{"../internals/an-object":64}],103:[function(require,module,exports){
// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

},{}],104:[function(require,module,exports){
var global = require('../internals/global');
var hide = require('../internals/hide');

module.exports = function (key, value) {
  try {
    hide(global, key, value);
  } catch (error) {
    global[key] = value;
  } return value;
};

},{"../internals/global":78,"../internals/hide":81}],105:[function(require,module,exports){
var shared = require('../internals/shared');
var uid = require('../internals/uid');

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

},{"../internals/shared":106,"../internals/uid":115}],106:[function(require,module,exports){
var global = require('../internals/global');
var setGlobal = require('../internals/set-global');
var IS_PURE = require('../internals/is-pure');

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.1.3',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});

},{"../internals/global":78,"../internals/is-pure":88,"../internals/set-global":104}],107:[function(require,module,exports){
var toInteger = require('../internals/to-integer');
var requireObjectCoercible = require('../internals/require-object-coercible');

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

},{"../internals/require-object-coercible":103,"../internals/to-integer":111}],108:[function(require,module,exports){
var global = require('../internals/global');
var fails = require('../internals/fails');
var classof = require('../internals/classof-raw');
var bind = require('../internals/bind-context');
var html = require('../internals/html');
var createElement = require('../internals/document-create-element');

var location = global.location;
var set = global.setImmediate;
var clear = global.clearImmediate;
var process = global.process;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;

var run = function (id) {
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var listener = function (event) {
  run(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global.postMessage(id + '', location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (classof(process) == 'process') {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = bind(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts && !fails(post)) {
    defer = post;
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};

},{"../internals/bind-context":66,"../internals/classof-raw":67,"../internals/document-create-element":71,"../internals/fails":74,"../internals/global":78,"../internals/html":82}],109:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

},{"../internals/to-integer":111}],110:[function(require,module,exports){
// toObject with fallback for non-array-like ES3 strings
var IndexedObject = require('../internals/indexed-object');
var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

},{"../internals/indexed-object":84,"../internals/require-object-coercible":103}],111:[function(require,module,exports){
var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

},{}],112:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

},{"../internals/to-integer":111}],113:[function(require,module,exports){
var requireObjectCoercible = require('../internals/require-object-coercible');

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};

},{"../internals/require-object-coercible":103}],114:[function(require,module,exports){
var isObject = require('../internals/is-object');

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"../internals/is-object":87}],115:[function(require,module,exports){
var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

},{}],116:[function(require,module,exports){
var global = require('../internals/global');
var shared = require('../internals/shared');
var uid = require('../internals/uid');
var NATIVE_SYMBOL = require('../internals/native-symbol');

var Symbol = global.Symbol;
var store = shared('wks');

module.exports = function (name) {
  return store[name] || (store[name] = NATIVE_SYMBOL && Symbol[name]
    || (NATIVE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

},{"../internals/global":78,"../internals/native-symbol":89,"../internals/shared":106,"../internals/uid":115}],117:[function(require,module,exports){
'use strict';
var fixRegExpWellKnownSymbolLogic = require('../internals/fix-regexp-well-known-symbol-logic');
var anObject = require('../internals/an-object');
var toObject = require('../internals/to-object');
var toLength = require('../internals/to-length');
var toInteger = require('../internals/to-integer');
var requireObjectCoercible = require('../internals/require-object-coercible');
var advanceStringIndex = require('../internals/advance-string-index');
var regExpExec = require('../internals/regexp-exec-abstract');

var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// @@replace logic
fixRegExpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
  return [
    // `String.prototype.replace` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
      return replacer !== undefined
        ? replacer.call(searchValue, O, replaceValue)
        : nativeReplace.call(String(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
    function (regexp, replaceValue) {
      var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
      if (res.done) return res.value;

      var rx = anObject(regexp);
      var S = String(this);

      var functionalReplace = typeof replaceValue === 'function';
      if (!functionalReplace) replaceValue = String(replaceValue);

      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regExpExec(rx, S);
        if (result === null) break;

        results.push(result);
        if (!global) break;

        var matchStr = String(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = String(result[0]);
        var position = max(min(toInteger(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = [matched].concat(captures, position, S);
          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
          var replacement = String(replaceValue.apply(undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + S.slice(nextSourcePosition);
    }
  ];

  // https://tc39.github.io/ecma262/#sec-getsubstitution
  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
    if (namedCaptures !== undefined) {
      namedCaptures = toObject(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }
    return nativeReplace.call(replacement, symbols, function (match, ch) {
      var capture;
      switch (ch.charAt(0)) {
        case '$': return '$';
        case '&': return matched;
        case '`': return str.slice(0, position);
        case "'": return str.slice(tailPos);
        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;
        default: // \d\d?
          var n = +ch;
          if (n === 0) return match;
          if (n > m) {
            var f = floor(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }
          capture = captures[n - 1];
      }
      return capture === undefined ? '' : capture;
    });
  }
});

},{"../internals/advance-string-index":63,"../internals/an-object":64,"../internals/fix-regexp-well-known-symbol-logic":75,"../internals/regexp-exec-abstract":100,"../internals/require-object-coercible":103,"../internals/to-integer":111,"../internals/to-length":112,"../internals/to-object":113}],118:[function(require,module,exports){
var global = require('../internals/global');
var task = require('../internals/task');

var FORCED = !global.setImmediate || !global.clearImmediate;

// http://w3c.github.io/setImmediate/
require('../internals/export')({ global: true, bind: true, enumerable: true, forced: FORCED }, {
  // `setImmediate` method
  // http://w3c.github.io/setImmediate/#si-setImmediate
  setImmediate: task.set,
  // `clearImmediate` method
  // http://w3c.github.io/setImmediate/#si-clearImmediate
  clearImmediate: task.clear
});

},{"../internals/export":73,"../internals/global":78,"../internals/task":108}],119:[function(require,module,exports){
'use strict'; //parse Empty Node as self closing node

require("core-js/modules/es.string.replace");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var buildOptions = require('./util').buildOptions;

var defaultOptions = {
  attributeNamePrefix: '@_',
  attrNodeName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  cdataTagName: false,
  cdataPositionChar: '\\c',
  format: false,
  indentBy: '  ',
  supressEmptyNode: false,
  tagValueProcessor: function tagValueProcessor(a) {
    return a;
  },
  attrValueProcessor: function attrValueProcessor(a) {
    return a;
  }
};
var props = ['attributeNamePrefix', 'attrNodeName', 'textNodeName', 'ignoreAttributes', 'cdataTagName', 'cdataPositionChar', 'format', 'indentBy', 'supressEmptyNode', 'tagValueProcessor', 'attrValueProcessor'];

function Parser(options) {
  this.options = buildOptions(options, defaultOptions, props);

  if (this.options.ignoreAttributes || this.options.attrNodeName) {
    this.isAttribute = function ()
    /*a*/
    {
      return false;
    };
  } else {
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }

  if (this.options.cdataTagName) {
    this.isCDATA = isCDATA;
  } else {
    this.isCDATA = function ()
    /*a*/
    {
      return false;
    };
  }

  this.replaceCDATAstr = replaceCDATAstr;
  this.replaceCDATAarr = replaceCDATAarr;

  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = '>\n';
    this.newLine = '\n';
  } else {
    this.indentate = function () {
      return '';
    };

    this.tagEndChar = '>';
    this.newLine = '';
  }

  if (this.options.supressEmptyNode) {
    this.buildTextNode = buildEmptyTextNode;
    this.buildObjNode = buildEmptyObjNode;
  } else {
    this.buildTextNode = buildTextValNode;
    this.buildObjNode = buildObjectNode;
  }

  this.buildTextValNode = buildTextValNode;
  this.buildObjectNode = buildObjectNode;
}

Parser.prototype.parse = function (jObj) {
  return this.j2x(jObj, 0).val;
};

Parser.prototype.j2x = function (jObj, level) {
  var attrStr = '';
  var val = '';
  var keys = Object.keys(jObj);
  var len = keys.length;

  for (var i = 0; i < len; i++) {
    var key = keys[i];

    if (typeof jObj[key] === 'undefined') {// supress undefined node
    } else if (jObj[key] === null) {
      val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextNode(jObj[key], key, '', level);
    } else if (_typeof(jObj[key]) !== 'object') {
      //premitive type
      var attr = this.isAttribute(key);

      if (attr) {
        attrStr += ' ' + attr + '="' + this.options.attrValueProcessor('' + jObj[key]) + '"';
      } else if (this.isCDATA(key)) {
        if (jObj[this.options.textNodeName]) {
          val += this.replaceCDATAstr(jObj[this.options.textNodeName], jObj[key]);
        } else {
          val += this.replaceCDATAstr('', jObj[key]);
        }
      } else {
        //tag value
        if (key === this.options.textNodeName) {
          if (jObj[this.options.cdataTagName]) {//value will added while processing cdata
          } else {
            val += this.options.tagValueProcessor('' + jObj[key]);
          }
        } else {
          val += this.buildTextNode(jObj[key], key, '', level);
        }
      }
    } else if (Array.isArray(jObj[key])) {
      //repeated nodes
      if (this.isCDATA(key)) {
        val += this.indentate(level);

        if (jObj[this.options.textNodeName]) {
          val += this.replaceCDATAarr(jObj[this.options.textNodeName], jObj[key]);
        } else {
          val += this.replaceCDATAarr('', jObj[key]);
        }
      } else {
        //nested nodes
        var arrLen = jObj[key].length;

        for (var j = 0; j < arrLen; j++) {
          var item = jObj[key][j];

          if (typeof item === 'undefined') {// supress undefined node
          } else if (item === null) {
            val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          } else if (_typeof(item) === 'object') {
            var result = this.j2x(item, level + 1);
            val += this.buildObjNode(result.val, key, result.attrStr, level);
          } else {
            val += this.buildTextNode(item, key, '', level);
          }
        }
      }
    } else {
      //nested node
      if (this.options.attrNodeName && key === this.options.attrNodeName) {
        var Ks = Object.keys(jObj[key]);
        var L = Ks.length;

        for (var _j = 0; _j < L; _j++) {
          attrStr += ' ' + Ks[_j] + '="' + this.options.attrValueProcessor('' + jObj[key][Ks[_j]]) + '"';
        }
      } else {
        var _result = this.j2x(jObj[key], level + 1);

        val += this.buildObjNode(_result.val, key, _result.attrStr, level);
      }
    }
  }

  return {
    attrStr: attrStr,
    val: val
  };
};

function replaceCDATAstr(str, cdata) {
  str = this.options.tagValueProcessor('' + str);

  if (this.options.cdataPositionChar === '' || str === '') {
    return str + '<![CDATA[' + cdata + ']]' + this.tagEndChar;
  } else {
    return str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata + ']]' + this.tagEndChar);
  }
}

function replaceCDATAarr(str, cdata) {
  str = this.options.tagValueProcessor('' + str);

  if (this.options.cdataPositionChar === '' || str === '') {
    return str + '<![CDATA[' + cdata.join(']]><![CDATA[') + ']]' + this.tagEndChar;
  } else {
    for (var v in cdata) {
      str = str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata[v] + ']]>');
    }

    return str + this.newLine;
  }
}

function buildObjectNode(val, key, attrStr, level) {
  if (attrStr && !val.includes('<')) {
    return this.indentate(level) + '<' + key + attrStr + '>' + val + //+ this.newLine
    // + this.indentate(level)
    '</' + key + this.tagEndChar;
  } else {
    return this.indentate(level) + '<' + key + attrStr + this.tagEndChar + val + //+ this.newLine
    this.indentate(level) + '</' + key + this.tagEndChar;
  }
}

function buildEmptyObjNode(val, key, attrStr, level) {
  if (val !== '') {
    return this.buildObjectNode(val, key, attrStr, level);
  } else {
    return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar; //+ this.newLine
  }
}

function buildTextValNode(val, key, attrStr, level) {
  return this.indentate(level) + '<' + key + attrStr + '>' + this.options.tagValueProcessor(val) + '</' + key + this.tagEndChar;
}

function buildEmptyTextNode(val, key, attrStr, level) {
  if (val !== '') {
    return this.buildTextValNode(val, key, attrStr, level);
  } else {
    return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
  }
}

function indentate(level) {
  return this.options.indentBy.repeat(level);
}

function isAttribute(name
/*, options*/
) {
  if (name.startsWith(this.options.attributeNamePrefix)) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}

function isCDATA(name) {
  return name === this.options.cdataTagName;
} //formatting
//indentation
//\n after each closing or self closing tag


module.exports = Parser;

},{"./util":124,"core-js/modules/es.string.replace":117}],120:[function(require,module,exports){
'use strict';

var _char = function _char(a) {
  return String.fromCharCode(a);
};

var chars = {
  nilChar: _char(176),
  missingChar: _char(201),
  nilPremitive: _char(175),
  missingPremitive: _char(200),
  emptyChar: _char(178),
  emptyValue: _char(177),
  //empty Premitive
  boundryChar: _char(179),
  objStart: _char(198),
  arrStart: _char(204),
  arrayEnd: _char(185)
};
var charsArr = [chars.nilChar, chars.nilPremitive, chars.missingChar, chars.missingPremitive, chars.boundryChar, chars.emptyChar, chars.emptyValue, chars.arrayEnd, chars.objStart, chars.arrStart];

var _e = function _e(node, e_schema, options) {
  if (typeof e_schema === 'string') {
    //premitive
    if (node && node[0] && node[0].val !== undefined) {
      return getValue(node[0].val, e_schema);
    } else {
      return getValue(node, e_schema);
    }
  } else {
    var hasValidData = hasData(node);

    if (hasValidData === true) {
      var str = '';

      if (Array.isArray(e_schema)) {
        //attributes can't be repeated. hence check in children tags only
        str += chars.arrStart;
        var itemSchema = e_schema[0]; //var itemSchemaType = itemSchema;

        var arr_len = node.length;

        if (typeof itemSchema === 'string') {
          for (var arr_i = 0; arr_i < arr_len; arr_i++) {
            var r = getValue(node[arr_i].val, itemSchema);
            str = processValue(str, r);
          }
        } else {
          for (var _arr_i = 0; _arr_i < arr_len; _arr_i++) {
            var _r = _e(node[_arr_i], itemSchema, options);

            str = processValue(str, _r);
          }
        }

        str += chars.arrayEnd; //indicates that next item is not array item
      } else {
        //object
        str += chars.objStart;
        var keys = Object.keys(e_schema);

        if (Array.isArray(node)) {
          node = node[0];
        }

        for (var i in keys) {
          var key = keys[i]; //a property defined in schema can be present either in attrsMap or children tags
          //options.textNodeName will not present in both maps, take it's value from val
          //options.attrNodeName will be present in attrsMap

          var _r2 = void 0;

          if (!options.ignoreAttributes && node.attrsMap && node.attrsMap[key]) {
            _r2 = _e(node.attrsMap[key], e_schema[key], options);
          } else if (key === options.textNodeName) {
            _r2 = _e(node.val, e_schema[key], options);
          } else {
            _r2 = _e(node.child[key], e_schema[key], options);
          }

          str = processValue(str, _r2);
        }
      }

      return str;
    } else {
      return hasValidData;
    }
  }
};

var getValue = function getValue(a
/*, type*/
) {
  switch (a) {
    case undefined:
      return chars.missingPremitive;

    case null:
      return chars.nilPremitive;

    case '':
      return chars.emptyValue;

    default:
      return a;
  }
};

var processValue = function processValue(str, r) {
  if (!isAppChar(r[0]) && !isAppChar(str[str.length - 1])) {
    str += chars.boundryChar;
  }

  return str + r;
};

var isAppChar = function isAppChar(ch) {
  return charsArr.indexOf(ch) !== -1;
};

function hasData(jObj) {
  if (jObj === undefined) {
    return chars.missingChar;
  } else if (jObj === null) {
    return chars.nilChar;
  } else if (jObj.child && Object.keys(jObj.child).length === 0 && (!jObj.attrsMap || Object.keys(jObj.attrsMap).length === 0)) {
    return chars.emptyChar;
  } else {
    return true;
  }
}

var x2j = require('./xmlstr2xmlnode');

var buildOptions = require('./util').buildOptions;

var convert2nimn = function convert2nimn(node, e_schema, options) {
  options = buildOptions(options, x2j.defaultOptions, x2j.props);
  return _e(node, e_schema, options);
};

exports.convert2nimn = convert2nimn;

},{"./util":124,"./xmlstr2xmlnode":127}],121:[function(require,module,exports){
'use strict';

var util = require('./util');

var convertToJson = function convertToJson(node, options) {
  var jObj = {}; //when no child node or attr is present

  if ((!node.child || util.isEmptyObject(node.child)) && (!node.attrsMap || util.isEmptyObject(node.attrsMap))) {
    return util.isExist(node.val) ? node.val : '';
  } else {
    //otherwise create a textnode if node has some text
    if (util.isExist(node.val)) {
      if (!(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
        jObj[options.textNodeName] = node.val;
      }
    }
  }

  util.merge(jObj, node.attrsMap);
  var keys = Object.keys(node.child);

  for (var index = 0; index < keys.length; index++) {
    var tagname = keys[index];

    if (node.child[tagname] && node.child[tagname].length > 1) {
      jObj[tagname] = [];

      for (var tag in node.child[tagname]) {
        jObj[tagname].push(convertToJson(node.child[tagname][tag], options));
      }
    } else {
      jObj[tagname] = convertToJson(node.child[tagname][0], options);
    }
  } //add value


  return jObj;
};

exports.convertToJson = convertToJson;

},{"./util":124}],122:[function(require,module,exports){
'use strict';

var util = require('./util');

var buildOptions = require('./util').buildOptions;

var x2j = require('./xmlstr2xmlnode'); //TODO: do it later


var convertToJsonString = function convertToJsonString(node, options) {
  options = buildOptions(options, x2j.defaultOptions, x2j.props);
  options.indentBy = options.indentBy || '';
  return _cToJsonStr(node, options, 0);
};

var _cToJsonStr = function _cToJsonStr(node, options, level) {
  var jObj = '{'; //traver through all the children

  var keys = Object.keys(node.child);

  for (var index = 0; index < keys.length; index++) {
    var tagname = keys[index];

    if (node.child[tagname] && node.child[tagname].length > 1) {
      jObj += '"' + tagname + '" : [ ';

      for (var tag in node.child[tagname]) {
        jObj += _cToJsonStr(node.child[tagname][tag], options) + ' , ';
      }

      jObj = jObj.substr(0, jObj.length - 1) + ' ] '; //remove extra comma in last
    } else {
      jObj += '"' + tagname + '" : ' + _cToJsonStr(node.child[tagname][0], options) + ' ,';
    }
  }

  util.merge(jObj, node.attrsMap); //add attrsMap as new children

  if (util.isEmptyObject(jObj)) {
    return util.isExist(node.val) ? node.val : '';
  } else {
    if (util.isExist(node.val)) {
      if (!(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
        jObj += '"' + options.textNodeName + '" : ' + stringval(node.val);
      }
    }
  } //add value


  if (jObj[jObj.length - 1] === ',') {
    jObj = jObj.substr(0, jObj.length - 2);
  }

  return jObj + '}';
};

function stringval(v) {
  if (v === true || v === false || !isNaN(v)) {
    return v;
  } else {
    return '"' + v + '"';
  }
}

function indentate(options, level) {
  return options.indentBy.repeat(level);
}

exports.convertToJsonString = convertToJsonString;

},{"./util":124,"./xmlstr2xmlnode":127}],123:[function(require,module,exports){
'use strict';

var nodeToJson = require('./node2json');

var xmlToNodeobj = require('./xmlstr2xmlnode');

var x2xmlnode = require('./xmlstr2xmlnode');

var buildOptions = require('./util').buildOptions;

exports.parse = function (xmlData, options) {
  options = buildOptions(options, x2xmlnode.defaultOptions, x2xmlnode.props);
  return nodeToJson.convertToJson(xmlToNodeobj.getTraversalObj(xmlData, options), options);
};

exports.convertTonimn = require('../src/nimndata').convert2nimn;
exports.getTraversalObj = xmlToNodeobj.getTraversalObj;
exports.convertToJson = nodeToJson.convertToJson;
exports.convertToJsonString = require('./node2json_str').convertToJsonString;
exports.validate = require('./validator').validate;
exports.j2xParser = require('./json2xml');

exports.parseToNimn = function (xmlData, schema, options) {
  return exports.convertTonimn(exports.getTraversalObj(xmlData, options), schema, options);
};

},{"../src/nimndata":120,"./json2xml":119,"./node2json":121,"./node2json_str":122,"./util":124,"./validator":125,"./xmlstr2xmlnode":127}],124:[function(require,module,exports){
'use strict';

var getAllMatches = function getAllMatches(string, regex) {
  var matches = [];
  var match = regex.exec(string);

  while (match) {
    var allmatches = [];
    var len = match.length;

    for (var index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }

    matches.push(allmatches);
    match = regex.exec(string);
  }

  return matches;
};

var doesMatch = function doesMatch(string, regex) {
  var match = regex.exec(string);
  return !(match === null || typeof match === 'undefined');
};

var doesNotMatch = function doesNotMatch(string, regex) {
  return !doesMatch(string, regex);
};

exports.isExist = function (v) {
  return typeof v !== 'undefined';
};

exports.isEmptyObject = function (obj) {
  return Object.keys(obj).length === 0;
};
/**
 * Copy all the properties of a into b.
 * @param {*} target
 * @param {*} a
 */


exports.merge = function (target, a) {
  if (a) {
    var keys = Object.keys(a); // will return an array of own properties

    var len = keys.length; //don't make it inline

    for (var i = 0; i < len; i++) {
      target[keys[i]] = a[keys[i]];
    }
  }
};
/* exports.merge =function (b,a){
  return Object.assign(b,a);
} */


exports.getValue = function (v) {
  if (exports.isExist(v)) {
    return v;
  } else {
    return '';
  }
}; // const fakeCall = function(a) {return a;};
// const fakeCallNoReturn = function() {};


exports.buildOptions = function (options, defaultOptions, props) {
  var newOptions = {};

  if (!options) {
    return defaultOptions; //if there are not options
  }

  for (var i = 0; i < props.length; i++) {
    if (options[props[i]] !== undefined) {
      newOptions[props[i]] = options[props[i]];
    } else {
      newOptions[props[i]] = defaultOptions[props[i]];
    }
  }

  return newOptions;
};

exports.doesMatch = doesMatch;
exports.doesNotMatch = doesNotMatch;
exports.getAllMatches = getAllMatches;

},{}],125:[function(require,module,exports){
'use strict';

require("core-js/modules/es.string.replace");

var util = require('./util');

var defaultOptions = {
  allowBooleanAttributes: false,
  //A tag can have attributes without any value
  localeRange: 'a-zA-Z'
};
var props = ['allowBooleanAttributes', 'localeRange']; //const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");

exports.validate = function (xmlData, options) {
  options = util.buildOptions(options, defaultOptions, props); //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE

  var tags = [];
  var tagFound = false;

  if (xmlData[0] === "\uFEFF") {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }

  var regxAttrName = new RegExp('^[_w][\\w\\-.:]*$'.replace('_w', '_' + options.localeRange));
  var regxTagName = new RegExp('^([w]|_)[\\w.\\-_:]*'.replace('([w', '([' + options.localeRange));

  for (var i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      i++;

      if (xmlData[i] === '?') {
        i = readPI(xmlData, ++i);

        if (i.err) {
          return i;
        }
      } else if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        var closingTag = false;

        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        } //read tagname


        var tagName = '';

        for (; i < xmlData.length && xmlData[i] !== '>' && xmlData[i] !== ' ' && xmlData[i] !== '\t' && xmlData[i] !== '\n' && xmlData[i] !== '\r'; i++) {
          tagName += xmlData[i];
        }

        tagName = tagName.trim(); //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          continue;
        }

        if (!validateTagName(tagName, regxTagName)) {
          return {
            err: {
              code: 'InvalidTag',
              msg: 'Tag ' + tagName + ' is an invalid name.'
            }
          };
        }

        var result = readAttributeStr(xmlData, i);

        if (result === false) {
          return {
            err: {
              code: 'InvalidAttr',
              msg: 'Attributes for ' + tagName + ' have open quote'
            }
          };
        }

        var attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          attrStr = attrStr.substring(0, attrStr.length - 1);
          var isValid = validateAttributeString(attrStr, options, regxAttrName);

          if (isValid === true) {
            tagFound = true; //continue; //text may presents after self closing tag
          } else {
            return isValid;
          }
        } else if (closingTag) {
          if (attrStr.trim().length > 0) {
            return {
              err: {
                code: 'InvalidTag',
                msg: 'closing tag ' + tagName + " can't have attributes or invalid starting."
              }
            };
          } else {
            var otg = tags.pop();

            if (tagName !== otg) {
              return {
                err: {
                  code: 'InvalidTag',
                  msg: 'closing tag ' + otg + ' is expected inplace of ' + tagName + '.'
                }
              };
            }
          }
        } else {
          var _isValid = validateAttributeString(attrStr, options, regxAttrName);

          if (_isValid !== true) {
            return _isValid;
          }

          tags.push(tagName);
          tagFound = true;
        } //skip tag text value
        //It may include comments and CDATA value


        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else {
              break;
            }
          }
        } //end of reading tag text value


        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if (xmlData[i] === ' ' || xmlData[i] === '\t' || xmlData[i] === '\n' || xmlData[i] === '\r') {
        continue;
      }

      return {
        err: {
          code: 'InvalidChar',
          msg: 'char ' + xmlData[i] + ' is not expected .'
        }
      };
    }
  }

  if (!tagFound) {
    return {
      err: {
        code: 'InvalidXml',
        msg: 'Start tag expected.'
      }
    };
  } else if (tags.length > 0) {
    return {
      err: {
        code: 'InvalidXml',
        msg: 'Invalid ' + JSON.stringify(tags, null, 4).replace(/\r?\n/g, '') + ' found.'
      }
    };
  }

  return true;
};
/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */


function readPI(xmlData, i) {
  var start = i;

  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      var tagname = xmlData.substr(start, i - start);

      if (i > 5 && tagname === 'xml') {
        return {
          err: {
            code: 'InvalidXml',
            msg: 'XML declaration allowed only at the start of the document.'
          }
        };
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }

  return i;
}

function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === 'D' && xmlData[i + 2] === 'O' && xmlData[i + 3] === 'C' && xmlData[i + 4] === 'T' && xmlData[i + 5] === 'Y' && xmlData[i + 6] === 'P' && xmlData[i + 7] === 'E') {
    var angleBracketsCount = 1;

    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;

        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === '[' && xmlData[i + 2] === 'C' && xmlData[i + 3] === 'D' && xmlData[i + 4] === 'A' && xmlData[i + 5] === 'T' && xmlData[i + 6] === 'A' && xmlData[i + 7] === '[') {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }

  return i;
}

var doubleQuote = '"';
var singleQuote = "'";
/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */

function readAttributeStr(xmlData, i) {
  var attrStr = '';
  var startChar = '';

  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
        //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
        continue;
      } else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        break;
      }
    }

    attrStr += xmlData[i];
  }

  if (startChar !== '') {
    return false;
  }

  return {
    value: attrStr,
    index: i
  };
}
/**
 * Select all the attributes whether valid or invalid.
 */


var validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g'); //attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options, regxAttrName) {
  //console.log("start:"+attrStr+":end");
  //if(attrStr.trim().length === 0) return true; //empty string
  var matches = util.getAllMatches(attrStr, validAttrStrRegxp);
  var attrNames = {};

  for (var i = 0; i < matches.length; i++) {
    //console.log(matches[i]);
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return {
        err: {
          code: 'InvalidAttr',
          msg: 'attribute ' + matches[i][2] + ' has no space in starting.'
        }
      };
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return {
        err: {
          code: 'InvalidAttr',
          msg: 'boolean attribute ' + matches[i][2] + ' is not allowed.'
        }
      };
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */


    var attrName = matches[i][2];

    if (!validateAttrName(attrName, regxAttrName)) {
      return {
        err: {
          code: 'InvalidAttr',
          msg: 'attribute ' + attrName + ' is an invalid name.'
        }
      };
    }

    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return {
        err: {
          code: 'InvalidAttr',
          msg: 'attribute ' + attrName + ' is repeated.'
        }
      };
    }
  }

  return true;
} // const validAttrRegxp = /^[_a-zA-Z][\w\-.:]*$/;


function validateAttrName(attrName, regxAttrName) {
  // const validAttrRegxp = new RegExp(regxAttrName);
  return util.doesMatch(attrName, regxAttrName);
} //const startsWithXML = new RegExp("^[Xx][Mm][Ll]");
//  startsWith = /^([a-zA-Z]|_)[\w.\-_:]*/;


function validateTagName(tagname, regxTagName) {
  /*if(util.doesMatch(tagname,startsWithXML)) return false;
    else*/
  return !util.doesNotMatch(tagname, regxTagName);
}

},{"./util":124,"core-js/modules/es.string.replace":117}],126:[function(require,module,exports){
'use strict';

module.exports = function (tagname, parent, val) {
  this.tagname = tagname;
  this.parent = parent;
  this.child = {}; //child tags

  this.attrsMap = {}; //attributes map

  this.val = val; //text only

  this.addChild = function (child) {
    if (Array.isArray(this.child[child.tagname])) {
      //already presents
      this.child[child.tagname].push(child);
    } else {
      this.child[child.tagname] = [child];
    }
  };
};

},{}],127:[function(require,module,exports){
'use strict';

require("core-js/modules/es.string.replace");

var util = require('./util');

var buildOptions = require('./util').buildOptions;

var xmlNode = require('./xmlNode');

var TagType = {
  OPENING: 1,
  CLOSING: 2,
  SELF: 3,
  CDATA: 4
};
var regx = '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|(([\\w:\\-._]*:)?([\\w:\\-._]+))([^>]*)>|((\\/)(([\\w:\\-._]*:)?([\\w:\\-._]+))\\s*>))([^<]*)'; //const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");
//polyfill

if (!Number.parseInt && window.parseInt) {
  Number.parseInt = window.parseInt;
}

if (!Number.parseFloat && window.parseFloat) {
  Number.parseFloat = window.parseFloat;
}

var defaultOptions = {
  attributeNamePrefix: '@_',
  attrNodeName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseNodeValue: true,
  parseAttributeValue: false,
  arrayMode: false,
  trimValues: true,
  //Trim string values of tag and attributes
  cdataTagName: false,
  cdataPositionChar: '\\c',
  localeRange: '',
  tagValueProcessor: function tagValueProcessor(a) {
    return a;
  },
  attrValueProcessor: function attrValueProcessor(a) {
    return a;
  },
  stopNodes: [] //decodeStrict: false,

};
exports.defaultOptions = defaultOptions;
var props = ['attributeNamePrefix', 'attrNodeName', 'textNodeName', 'ignoreAttributes', 'ignoreNameSpace', 'allowBooleanAttributes', 'parseNodeValue', 'parseAttributeValue', 'arrayMode', 'trimValues', 'cdataTagName', 'cdataPositionChar', 'localeRange', 'tagValueProcessor', 'attrValueProcessor', 'parseTrueNumberOnly', 'stopNodes'];
exports.props = props;

var getTraversalObj = function getTraversalObj(xmlData, options) {
  options = buildOptions(options, defaultOptions, props); //xmlData = xmlData.replace(/\r?\n/g, " ");//make it single line

  xmlData = xmlData.replace(/<!--[\s\S]*?-->/g, ''); //Remove  comments

  var xmlObj = new xmlNode('!xml');
  var currentNode = xmlObj;
  regx = regx.replace(/\[\\w/g, '[' + options.localeRange + '\\w');
  var tagsRegx = new RegExp(regx, 'g');
  var tag = tagsRegx.exec(xmlData);
  var nextTag = tagsRegx.exec(xmlData);

  while (tag) {
    var tagType = checkForTagType(tag);

    if (tagType === TagType.CLOSING) {
      //add parsed data to parent node
      if (currentNode.parent && tag[14]) {
        currentNode.parent.val = util.getValue(currentNode.parent.val) + '' + processTagValue(tag[14], options);
      }

      if (options.stopNodes.length && options.stopNodes.includes(currentNode.tagname)) {
        currentNode.child = [];

        if (currentNode.attrsMap == undefined) {
          currentNode.attrsMap = {};
        }

        currentNode.val = xmlData.substr(currentNode.startIndex + 1, tag.index - currentNode.startIndex - 1);
      }

      currentNode = currentNode.parent;
    } else if (tagType === TagType.CDATA) {
      if (options.cdataTagName) {
        //add cdata node
        var childNode = new xmlNode(options.cdataTagName, currentNode, tag[3]);
        childNode.attrsMap = buildAttributesMap(tag[8], options);
        currentNode.addChild(childNode); //for backtracking

        currentNode.val = util.getValue(currentNode.val) + options.cdataPositionChar; //add rest value to parent node

        if (tag[14]) {
          currentNode.val += processTagValue(tag[14], options);
        }
      } else {
        currentNode.val = (currentNode.val || '') + (tag[3] || '') + processTagValue(tag[14], options);
      }
    } else if (tagType === TagType.SELF) {
      if (currentNode && tag[14]) {
        currentNode.val = util.getValue(currentNode.val) + '' + processTagValue(tag[14], options);
      }

      var _childNode = new xmlNode(options.ignoreNameSpace ? tag[7] : tag[5], currentNode, '');

      if (tag[8] && tag[8].length > 0) {
        tag[8] = tag[8].substr(0, tag[8].length - 1);
      }

      _childNode.attrsMap = buildAttributesMap(tag[8], options);
      currentNode.addChild(_childNode);
    } else {
      //TagType.OPENING
      var _childNode2 = new xmlNode(options.ignoreNameSpace ? tag[7] : tag[5], currentNode, processTagValue(tag[14], options));

      if (options.stopNodes.length && options.stopNodes.includes(_childNode2.tagname)) {
        _childNode2.startIndex = tag.index + tag[1].length;
      }

      _childNode2.attrsMap = buildAttributesMap(tag[8], options);
      currentNode.addChild(_childNode2);
      currentNode = _childNode2;
    }

    tag = nextTag;
    nextTag = tagsRegx.exec(xmlData);
  }

  return xmlObj;
};

function processTagValue(val, options) {
  if (val) {
    if (options.trimValues) {
      val = val.trim();
    }

    val = options.tagValueProcessor(val);
    val = parseValue(val, options.parseNodeValue, options.parseTrueNumberOnly);
  }

  return val;
}

function checkForTagType(match) {
  if (match[4] === ']]>') {
    return TagType.CDATA;
  } else if (match[10] === '/') {
    return TagType.CLOSING;
  } else if (typeof match[8] !== 'undefined' && match[8].substr(match[8].length - 1) === '/') {
    return TagType.SELF;
  } else {
    return TagType.OPENING;
  }
}

function resolveNameSpace(tagname, options) {
  if (options.ignoreNameSpace) {
    var tags = tagname.split(':');
    var prefix = tagname.charAt(0) === '/' ? '/' : '';

    if (tags[0] === 'xmlns') {
      return '';
    }

    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }

  return tagname;
}

function parseValue(val, shouldParse, parseTrueNumberOnly) {
  if (shouldParse && typeof val === 'string') {
    var parsed;

    if (val.trim() === '' || isNaN(val)) {
      parsed = val === 'true' ? true : val === 'false' ? false : val;
    } else {
      if (val.indexOf('0x') !== -1) {
        //support hexa decimal
        parsed = Number.parseInt(val, 16);
      } else if (val.indexOf('.') !== -1) {
        parsed = Number.parseFloat(val);
      } else {
        parsed = Number.parseInt(val, 10);
      }

      if (parseTrueNumberOnly) {
        parsed = String(parsed) === val ? parsed : val;
      }
    }

    return parsed;
  } else {
    if (util.isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
} //TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");


var attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?', 'g');

function buildAttributesMap(attrStr, options) {
  if (!options.ignoreAttributes && typeof attrStr === 'string') {
    attrStr = attrStr.replace(/\r?\n/g, ' '); //attrStr = attrStr || attrStr.trim();

    var matches = util.getAllMatches(attrStr, attrsRegx);
    var len = matches.length; //don't make it inline

    var attrs = {};

    for (var i = 0; i < len; i++) {
      var attrName = resolveNameSpace(matches[i][1], options);

      if (attrName.length) {
        if (matches[i][4] !== undefined) {
          if (options.trimValues) {
            matches[i][4] = matches[i][4].trim();
          }

          matches[i][4] = options.attrValueProcessor(matches[i][4]);
          attrs[options.attributeNamePrefix + attrName] = parseValue(matches[i][4], options.parseAttributeValue, options.parseTrueNumberOnly);
        } else if (options.allowBooleanAttributes) {
          attrs[options.attributeNamePrefix + attrName] = true;
        }
      }
    }

    if (!Object.keys(attrs).length) {
      return;
    }

    if (options.attrNodeName) {
      var attrCollection = {};
      attrCollection[options.attrNodeName] = attrs;
      return attrCollection;
    }

    return attrs;
  }
}

exports.getTraversalObj = getTraversalObj;

},{"./util":124,"./xmlNode":126,"core-js/modules/es.string.replace":117}],128:[function(require,module,exports){
"use strict";

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);

    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }

    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }

    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = e << mLen | m;
  eLen += mLen;

  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
};

},{}],129:[function(require,module,exports){
"use strict";

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};

},{}],130:[function(require,module,exports){
(function (setImmediate,clearImmediate){
"use strict";

require("core-js/modules/web.immediate");

var nextTick = require('process/browser.js').nextTick;

var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0; // DOM APIs, for completeness

exports.setTimeout = function () {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};

exports.setInterval = function () {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};

exports.clearTimeout = exports.clearInterval = function (timeout) {
  timeout.close();
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}

Timeout.prototype.unref = Timeout.prototype.ref = function () {};

Timeout.prototype.close = function () {
  this._clearFn.call(window, this._id);
}; // Does not start the time, just sets up the members needed.


exports.enroll = function (item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function (item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function (item) {
  clearTimeout(item._idleTimeoutId);
  var msecs = item._idleTimeout;

  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout) item._onTimeout();
    }, msecs);
  }
}; // That's not how node.js implements it but the exposed api is the same.


exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function (fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
  immediateIds[id] = true;
  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      } // Prevent ids from leaking


      exports.clearImmediate(id);
    }
  });
  return id;
};
exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function (id) {
  delete immediateIds[id];
};

}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"core-js/modules/web.immediate":118,"process/browser.js":129,"timers":130}]},{},[3])(3)
});
