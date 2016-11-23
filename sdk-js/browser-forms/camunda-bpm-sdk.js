!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.CamSDK=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

// var HttpClient = require('./http-client');
var Q = _dereq_('q');
var Events = _dereq_('./../events');
var BaseClass = _dereq_('./../base-class');

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
  initialize: function() {
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
  create: function(attributes, done) {},


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
  list: function(params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }
    params = params || {};
    done = done || noop;

    // var likeExp = /Like$/;
    var self = this;
    var results = {
      count: 0,
      items: []
    };
    var deferred = Q.defer();

    // until a new webservice is made available,
    // we need to perform 2 requests.
    // Since they are independent requests, make them asynchronously
    var countPromise = self.count(params).then(
      function(count) {
        results.count = count;
      }
    );

    self.http.get(self.path, {
      data: params,
      done: function (err, itemsRes) {
        if (err) {
          deferred.reject(err);
        } else {
          results.items = itemsRes;
          // QUESTION: should we return that too?
          results.firstResult = parseInt(params.firstResult || 0, 10);
          results.maxResults = results.firstResult + parseInt(params.maxResults || 10, 10);
          deferred.resolve(itemsRes);
        }
      }
    });

    // Return a promise for both countPromise and listPromise
    return Q.all([countPromise, deferred.promise]).then(
      function() {
        /**
         * @event CamSDK.AbstractClientResource#loaded
         * @type {Object}
         * @property {Number} count is the total of items matching on backend
         * @property {Array} items  is an array of items
         */
        self.trigger('loaded', results);
        done(null, results);
        return results;
      },
      function(err) {
        /**
         * @event CamSDK.AbstractClientResource#error
         * @type {Error}
         */
        self.trigger('error', err);
        done(err);
        return err;
      }
    );
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
  count: function(params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }
    params = params || {};
    done = done || noop;
    var self = this;
    var deferred = Q.defer();

    this.http.get(this.path +'/count', {
      data: params,
      done: function(err, result) {
        if (err) {
          /**
           * @event CamSDK.AbstractClientResource#error
           * @type {Error}
           */
          self.trigger('error', err);
          done(err);
          deferred.reject(err);
        } else {
          done(null, result.count);
          deferred.resolve(result.count);
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
  update: function(ids, attributes, done) {},



  /**
   * Delete one or more instances
   *
   * @abstract
   * @memberof CamSDK.AbstractClientResource
   *
   * @param  {!String|String[]}  ids
   * @param  {requestCallback} [done]
   */
  delete: function(ids, done) {}
});


Events.attach(AbstractClientResource);

module.exports = AbstractClientResource;

},{"./../base-class":22,"./../events":23,"q":41}],2:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';

var request = _dereq_('superagent');
var Q = _dereq_('q');
var Events = _dereq_('./../events');
var utils = _dereq_('./../utils');

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
var HttpClient = function(config) {
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
  return function(err, response) {
    // TODO: investigate the possible problems related to response without content
    if (err || (!response.ok && !response.noContent)) {
      err = err || response.error || new Error('The '+ response.req.method +' request on '+ response.req.url +' failed');
      if (response && response.body) {
        if (response.body.message) {
          err.message = response.body.message;
        }
      }
      self.trigger('error', err);
      if(deferred) {deferred.reject(err);}
      return done(err);
    }

    // superagent puts the parsed data into a property named "body"
    // and the "raw" content in property named "text"
    // and.. it does not parse the response if it does not have
    // the "application/json" type.
    if (response.type === 'application/hal+json') {
      if (!response.body || Object.keys(response.body).length === 0) {
        response.body = JSON.parse(response.text);
      }

      // and process embedded resources
      response.body = utils.solveHALEmbedded(response.body);
    }

    if(deferred) {deferred.resolve(response.body ? response.body : (response.text ? response.text : ''));}
    done(null, response.body ? response.body : (response.text ? response.text : ''));
  };
}

/**
 * Performs a POST HTTP request
 */
HttpClient.prototype.post = function(path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/'+ path : '');
  var req = request.post(url);

  // Buffer object is only available in node.js environement
  if (typeof Buffer !== 'undefined') {
    Object.keys(options.fields || {}).forEach(function (field) {
      req.field(field, options.fields[field]);
    });

    (options.attachments || []).forEach(function (file) {
      req.attach('data', new Buffer(file.content), file.name);
    });
  }
  else if (!!options.fields || !!options.attachments) {
    var err = new Error('Multipart request is only supported in node.js environement.');
    done(err);
    return deferred.reject(err);
  }

  req
    .set(this.config.headers)
    .send(options.data || {})
    .query(options.query || {});

  req.end(end(self, done, deferred));
  return deferred.promise;
};


/**
 * Performs a GET HTTP request
 */
HttpClient.prototype.get = function(path, options) {
  var url = this.config.baseUrl + (path ? '/'+ path : '');
  return this.load(url, options);
};

/**
 * Loads a resource using http GET
 */
HttpClient.prototype.load = function(url, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();

  var accept = options.accept || this.config.headers.Accept;

  var req = request
    .get(url)
    .set(options.headers || this.config.headers)
    .set('Accept', accept)
    .query(options.data || {});

  req.end(end(self, done, deferred));
  return deferred.promise;
};


/**
 * Performs a PUT HTTP request
 */
HttpClient.prototype.put = function(path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/'+ path : '');

  var req = request
    .put(url)
    .set(options.headers || this.config.headers)
    .send(options.data || {});

  req.end(end(self, done,deferred));
  return deferred.promise;
};



/**
 * Performs a DELETE HTTP request
 */
HttpClient.prototype.del = function(path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/'+ path : '');

  var req = request
    .del(url)
    .set(options.headers || this.config.headers)
    .send(options.data || {});

  req.end(end(self, done, deferred));
  return deferred.promise;
};



/**
 * Performs a OPTIONS HTTP request
 */
HttpClient.prototype.options = function(path, options) {
  options = options || {};
  var done = options.done || noop;
  var self = this;
  var deferred = Q.defer();
  var url = this.config.baseUrl + (path ? '/'+ path : '');

  var req = request('OPTIONS', url)
    .set(options.headers || this.config.headers);

  req.end(end(self, done, deferred));
  return deferred.promise;
};


module.exports = HttpClient;

}).call(this,_dereq_("buffer").Buffer)
},{"./../events":23,"./../utils":35,"buffer":36,"q":41,"superagent":42}],3:[function(_dereq_,module,exports){
'use strict';
var Events = _dereq_('./../events');

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
 * @param  {String} [config.engine=default]
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

  Events.attach(this);

  config.engine = config.engine || 'default';

  // mock by default.. for now
  config.mock =  typeof config.mock !== 'undefined' ? config.mock : true;

  config.resources = config.resources || {};

  this.HttpClient = config.HttpClient || CamundaClient.HttpClient;

  this.baseUrl = config.apiUri;
  if(this.baseUrl.slice(-1) !== '/') {
    this.baseUrl += '/';
  }
  this.baseUrl += 'engine/'+ config.engine;

  this.config = config;

  this.initialize();
}

/**
 * [HttpClient description]
 * @memberof CamSDK.client.CamundaClient
 * @name HttpClient
 * @type {CamSDK.client.HttpClient}
 */
CamundaClient.HttpClient = _dereq_('./http-client');

// provide an isolated scope
(function(proto){
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
  proto.initialize = function() {
    /* jshint sub: true */
    _resources['authorization']       = _dereq_('./resources/authorization');
    _resources['deployment']          = _dereq_('./resources/deployment');
    _resources['filter']              = _dereq_('./resources/filter');
    _resources['history']             = _dereq_('./resources/history');
    _resources['process-definition']  = _dereq_('./resources/process-definition');
    _resources['process-instance']    = _dereq_('./resources/process-instance');
    _resources['task']                = _dereq_('./resources/task');
    _resources['variable']            = _dereq_('./resources/variable');
    _resources['case-execution']      = _dereq_('./resources/case-execution');
    _resources['case-instance']       = _dereq_('./resources/case-instance');
    _resources['case-definition']     = _dereq_('./resources/case-definition');
    _resources['user']                = _dereq_('./resources/user');
    _resources['group']               = _dereq_('./resources/group');
    _resources['incident']            = _dereq_('./resources/incident');
    _resources['job']                 = _dereq_('./resources/job');
    _resources['metrics']             = _dereq_('./resources/metrics');
    _resources['decision-definition'] = _dereq_('./resources/decision-definition');
    _resources['execution']           = _dereq_('./resources/execution');
    /* jshint sub: false */
    var self = this;

    function forwardError(err) {
      self.trigger('error', err);
    }

    // create global HttpClient instance
    this.http = new this.HttpClient({baseUrl: this.baseUrl, headers: this.config.headers});

    // configure the client for each resources separately,
    var name, conf, resConf, c;
    for (name in _resources) {

      conf = {
        name:     name,
        // use the SDK config for some default values
        mock:     this.config.mock,
        baseUrl:  this.baseUrl,
        headers:  this.config.headers
      };
      resConf = this.config.resources[name] || {};

      for (c in resConf) {
        conf[c] = resConf[c];
      }

      // instanciate a HTTP client for the resource
      _resources[name].http = new this.HttpClient(conf);

      // forward request errors
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
  proto.resource = function(name) {
    return _resources[name];
  };
}(CamundaClient.prototype));


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

},{"./../events":23,"./http-client":2,"./resources/authorization":4,"./resources/case-definition":5,"./resources/case-execution":6,"./resources/case-instance":7,"./resources/decision-definition":8,"./resources/deployment":9,"./resources/execution":10,"./resources/filter":11,"./resources/group":12,"./resources/history":13,"./resources/incident":14,"./resources/job":15,"./resources/metrics":16,"./resources/process-definition":17,"./resources/process-instance":18,"./resources/task":19,"./resources/user":20,"./resources/variable":21}],4:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_("./../abstract-client-resource");



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
Authorization.list = function(params, done) {
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
Authorization.get = function(authorizationId, done) {
  return this.http.get(this.path +'/'+ authorizationId, {
    done: done
  });
};


/**
 * Creates an authorization
 *
 * @param  {Object}   authorization       is an object representation of an authorization
 * @param  {Function} done
 */
Authorization.create = function(authorization, done) {
  return this.http.post(this.path +'/create', {
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
Authorization.update = function(authorization, done) {
  return this.http.put(this.path +'/'+ authorization.id, {
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
Authorization.save = function(authorization, done) {
  return Authorization[authorization.id ? 'update' : 'create'](authorization, done);
};



/**
 * Delete an authorization
 *
 * @param  {uuid}     id   of the authorization to delete
 * @param  {Function} done
 */
Authorization.delete = function(id, done) {
  return this.http.del(this.path +'/'+ id, {
    done: done
  });
};



module.exports = Authorization;


},{"./../abstract-client-resource":1}],5:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');

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

CaseDefinition.list = function(params, done) {
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
CaseDefinition.create = function(params, done) {
  return this.http.post(this.path + '/' + (params.id ? params.id : 'key/' + params.key ) + '/create', {
    data: params,
    done: done
  });
};

module.exports = CaseDefinition;

},{"./../abstract-client-resource":1}],6:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');

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

CaseExecution.list = function(params, done) {
  done = done || noop;
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

CaseExecution.disable = function(executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/disable', {
    data: params,
    done: done
  });
};

CaseExecution.reenable = function(executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/reenable', {
    data: params,
    done: done
  });
};

CaseExecution.manualStart = function(executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/manual-start', {
    data: params,
    done: done
  });
};

CaseExecution.complete = function(executionId, params, done) {
  return this.http.post(this.path + '/' + executionId + '/complete', {
    data: params,
    done: done
  });
};

module.exports = CaseExecution;

},{"./../abstract-client-resource":1}],7:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');

/**
 * No-Op callback
 */
function noop() {}

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

CaseInstance.list = function(params, done) {
  return this.http.get(this.path, {
    data: params,
    done: done
  });
};

CaseInstance.count = function(params, done) {
  if (arguments.length === 1 && typeof params === 'function') {
    done = params;
    params = {};
  }

  params = params || {};

  return this.http.get(this.path + '/count', {
    data: params,
    done: done || noop
  });
};

CaseInstance.close = function(instanceId, params, done) {
  return this.http.post(this.path + '/' + instanceId + '/close', {
    data: params,
    done: done
  });
};

module.exports = CaseInstance;

},{"./../abstract-client-resource":1}],8:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
DecisionDefinition.list = function(params, done) {
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
DecisionDefinition.get = function(id, done) {
  return this.http.get(this.path +'/'+ id, {
    done: done
  });
};

/**
 * Retrieves the DMN 1.0 XML of this decision definition.
 * @param  {uuid}     id   The id of the decision definition.
 * @param  {Function} done
 */
DecisionDefinition.getXml = function(id, done) {
  return this.http.get(this.path +'/'+ id + '/xml', {
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
DecisionDefinition.evaluate = function(params, done) {
  return this.http.post(this.path +'/'+ (params.id ? params.id : 'key/'+params.key ) + '/evaluate', {
    data: params,
    done: done
  });
};

module.exports = DecisionDefinition;

},{"./../abstract-client-resource":1}],9:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
 * @param  {Function} done
 */
Deployment.create = function (options, done) {
  var fields = {
    'deployment-name': options.deploymentName
  };

  var files = Array.isArray(options.files) ?
              options.files :
              [options.files];

  if (options.deploymentSource) {
    fields['deployment-source'] = options.deploymentSource;
  }

  if (options.enableDuplicateFiltering) {
    fields['enable-duplicate-filtering'] = 'true';
  }

  if (options.deployChangedOnly) {
    fields['deploy-changed-only'] = 'true';
  }

  return this.http.post(this.path +'/create', {
    data:         {},
    fields:       fields,
    attachments:  files,
    done:         done
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
Deployment.delete = function (id, options, done) {
  var path = this.path + '/' + id;

  if (options) {

    var queryParams = [];
    for(var key in options) {
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
Deployment.get = function(id, done) {
  return this.http.get(this.path + '/' + id, {
    done: done
  });
};

/**
 * Returns a list of deployment resources for the given deployment.
 */
Deployment.getResources = function(id, done) {
  return this.http.get(this.path + '/' + id + '/resources', {
    done: done
  });
};

/**
 * Returns a deployment resource for the given deployment and resource id.
 */
Deployment.getResource = function(deploymentId, resourceId, done) {
  return this.http.get(this.path + '/' + deploymentId + '/resources/' + resourceId, {
    done: done
  });
};

/**
 * Returns the binary content of a single deployment resource for the given deployment.
 */
Deployment.getResourceData = function(deploymentId, resourceId, done) {
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
Deployment.redeploy = function(options, done) {
  var id = options.id;
  delete options.id;

  return this.http.post(this.path + '/' + id + '/redeploy', {
    data: options,
    done: done || function() {}
  });
};

module.exports = Deployment;

},{"./../abstract-client-resource":1}],10:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
  return this.http.del(this.path + '/' + data.id + '/localVariables/' + data.varId, {
    done: done
  });
};

/**
 * Updates or deletes the variables in the context of an execution.
 * The updates do not propagate upwards in the execution hierarchy.
 * Updates precede deletions.
 * So, if a variable is updated AND deleted, the deletion overrides the update.
 */
Execution.modifyVariables = function(data, done) {
  return this.http.post(this.path + '/' + data.id + '/localVariables', {
    data: data,
    done: done
  });
};

module.exports = Execution;


},{"./../abstract-client-resource":1}],11:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
Filter.get = function(filterId, done) {
  return this.http.get(this.path +'/'+ filterId, {
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
Filter.list = function(data, done) {
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
Filter.getTasks = function(data, done) {
  var path = this.path +'/';

  if (typeof data === 'string') {
    path = path + data +'/list';
    data = {};
  }
  else {
    path = path + data.id +'/list';
    delete data.id;
  }

  // those parameters have to be passed in the query and not body
  path += '?firstResult='+ (data.firstResult || 0);
  path += '&maxResults='+ (data.maxResults || 15);

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
Filter.create = function(filter, done) {
  return this.http.post(this.path +'/create', {
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
Filter.update = function(filter, done) {
  return this.http.put(this.path +'/'+ filter.id, {
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
Filter.save = function(filter, done) {
  return Filter[filter.id ? 'update' : 'create'](filter, done);
};


/**
 * Delete a filter
 *
 * @param  {uuid}     id   of the filter to delete
 * @param  {Function} done
 */
Filter.delete = function(id, done) {
  return this.http.del(this.path +'/'+ id, {
    done: done
  });
};


/**
 * Performs an authorizations lookup on the resource or entity
 *
 * @param  {uuid}     [id]   of the filter to get authorizations for
 * @param  {Function} done
 */
Filter.authorizations = function(id, done) {
  if (arguments.length === 1) {
    return this.http.options(this.path, {
      done: id
    });
  }

  return this.http.options(this.path +'/'+ id, {
    done: done
  });
};


module.exports = Filter;


},{"./../abstract-client-resource":1}],12:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');

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
 * Creates a group
 *
 * @param  {Object}   group       is an object representation of a group
 * @param  {String}   group.id
 * @param  {String}   group.name
 * @param  {String}   group.type
 * @param  {Function} done
 */
Group.create = function (options, done) {
  return this.http.post(this.path +'/create', {
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
  if (arguments.length === 1) {
    done = options;
    options = {};
  }
  else {
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

  return this.http.get(this.path + '/' + id, {
    data: options,
    done: done || noop
  });
};


/**
 * Query for a list of groups using a list of parameters.
 * The size of the result set can be retrieved by using the get groups count method
 *
 * @param {String} [options.id]           Filter by the id of the group.
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
  return this.http.get(this.path, {
    data: options,
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
  return this.http.put(this.path +'/' + options.id + '/members/' + options.userId, {
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
  return this.http.del(this.path +'/' + options.id + '/members/' + options.userId, {
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
  return this.http.put(this.path +'/' + options.id, {
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
Group.delete = function (options, done) {
  return this.http.del(this.path +'/' + options.id, {
    data: options,
    done: done || noop
  });
};

module.exports = Group;

},{"./../abstract-client-resource":1}],13:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
 * Query for user operation log entries that fulfill the given parameters.
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
History.userOperation = function(params, done) {
  if (arguments.length < 2) {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/user-operation', {
    data: params,
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
History.processInstance = function(params, done) {
  if (arguments.length < 2) {
    done = arguments[0];
    params = {};
  }

  var body = {};
  var query = {};
  var queryParams = ['firstResult', 'maxResults'];

  for (var p in params) {
    if (queryParams.indexOf(p) > -1) {
      query[p] = params[p];
    }
    else {
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
History.processInstanceCount = function(params, done) {
  if (arguments.length < 2) {
    done = arguments[0];
    params = {};
  }

  return this.http.post(this.path + '/process-instance/count', {
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
History.decisionInstance = function(params, done) {
  if (arguments.length < 2) {
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
History.decisionInstanceCount = function(params, done) {
  if (arguments.length < 2) {
    done = arguments[0];
    params = {};
  }

  return this.http.get(this.path + '/decision-instance/count', {
    data: params,
    done: done
  });
};


/**
 * Query for process instance durations report.
 * @param  {Object}   [params]
 * @param  {Object}   [params.periodUnit]           Can be one of `month` or `quarter`, defaults to `month`
 * @param  {Object}   [params.processDefinitionIn]  Comma separated list of process definition IDs
 * @param  {Object}   [params.startedAfter]         Date after which the process instance were started
 * @param  {Object}   [params.startedBefore]        Date before which the process instance were started
 * @param  {Function} done
 */
History.durationReport = function (params, done) {
  if (arguments.length < 2) {
    done = arguments[0];
    params = {};
  }

  params.reportType = 'duration';
  params.periodUnit = params.periodUnit || 'month';

  return this.http.get(this.path + '/process-instance/report', {
    data: params,
    done: done
  });
};


module.exports = History;


},{"./../abstract-client-resource":1}],14:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
Incident.count = function(params, done) {
  return this.http.get(this.path+'/count', {
    data: params,
    done: done
  });
};

module.exports = Incident;


},{"./../abstract-client-resource":1}],15:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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

  var path = this.path;

  // those parameters have to be passed in the query and not body
  path += '?firstResult='+ (params.firstResult || 0);
  if(params.maxResults) {
    path += '&maxResults='+ (params.maxResults);
  }


  return this.http.post(path, {
    data: params,
    done: done
  });
};

/**
 * Sets the retries of the job to the given number of retries.
 * @param  {Object}   params
 * @param  {String}   params.is      The id of the job.
 * @param  {String}   params.retries The number of retries to set that a job has left.
 * @param  {Function} done
 */
Job.setRetries = function(params, done) {
  return this.http.put(this.path + '/' + params.id + '/retries', {
    data: params,
    done: done
  });
};

module.exports = Job;

},{"./../abstract-client-resource":1}],16:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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

  return this.http.get(path, { data: params, done: done });
};

module.exports = Metrics;

},{"./../abstract-client-resource":1}],17:[function(_dereq_,module,exports){
'use strict';

var Q = _dereq_('q');
var AbstractClientResource = _dereq_('./../abstract-client-resource');

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
  suspend: function(params, done) {
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
  stats: function(done) {
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
  start: function(done) {
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
  get: function(id, done) {

    // var pointer = '';
    // if (data.key) {
    //   pointer = 'key/'+ data.key;
    // }
    // else if (data.id) {
    //   pointer = data.id;
    // }

    return this.http.get(this.path +'/'+ id, {
      done: done
    });
  },


  /**
   * Retrieve a single process definition
   *
   * @param  {String}   key    of the process definition to be requested
   * @param  {Function} done
   */
  getByKey: function(key, done) {
    return this.http.get(this.path +'/key/'+ key, {
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
  list: function(params, done) {
    return AbstractClientResource.list.apply(this, arguments);
  },


  /**
   * Fetch the variables of a process definition
   * @param  {Object.<String, *>} data
   * @param  {String}             [data.id]     of the process
   * @param  {String}             [data.key]    of the process
   * @param  {Array}              [data.names]  of variables to be fetched
   * @param  {Function}           [done]
   */
  formVariables: function(data, done) {
    var pointer = '';
    done = done || noop;
    if (data.key) {
      pointer = 'key/'+ data.key;
    }
    else if (data.id) {
      pointer = data.id;
    }
    else {
      var err = new Error('Process definition task variables needs either a key or an id.');
      done(err);
      return Q.reject(err);
    }

    var queryData = {
      deserializeValues: data.deserializeValues
    };

    if(data.names) {
      queryData.variableNames = (data.names || []).join(',');
    }

    return this.http.get(this.path +'/'+ pointer +'/form-variables', {
      data: queryData,
      done: done
    });
  },


  /**
   * Submit a form to start a process definition
   *
   * @param  {Object.<String, *>} data
   * @param  {String}             [data.key]            start the process-definition with this key
   * @param  {String}             [data.id]             or: start the process-definition with this id
   * @param  {String}             [data.businessKey]    of the process to be set
   * @param  {Array}              [data.variables]      variables to be set
   * @param  {Function}           [done]
   */
  submitForm: function(data, done) {
    var pointer = '';
    done = done || noop;
    if (data.key) {
      pointer = 'key/'+ data.key;
    }
    else if (data.id) {
      pointer = data.id;
    }
    else {
      return done(new Error('Process definition task variables needs either a key or an id.'));
    }

    return this.http.post(this.path +'/'+ pointer +'/submit-form', {
      data: {
        businessKey : data.businessKey,
        variables: data.variables
      },
      done: done
    });
  },


  /**
   * Retrieves the form of a process definition.
   * @param  {Function} [done]
   */
  startForm: function(data, done) {
    var path = this.path +'/'+ (data.key ? 'key/'+ data.key : data.id) +'/startForm';
    return this.http.get(path, {
      done: done || noop
    });
  },


  /**
   * Retrieves the form of a process definition.
   * @param  {Function} [done]
   */
  xml: function(data, done) {
    var path = this.path +'/'+ (data.id ? data.id : 'key/'+ data.key) +'/xml';
    return this.http.get(path, {
      done: done || noop
    });
  },


  /**
   * Submits the form of a process definition.
   *
   * @param  {Object} [data]
   * @param  {Function} [done]
   */
  submit: function(data, done) {
    var path = this.path;
    if (data.key) {
      path += '/key/'+ data.key;
    }
    else {
      path += '/'+ data.id;
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
  suspend: function(ids, params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }
    params = params || {};
    done = done || noop;
    // allows to pass a single ID
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
   * @param {String} [params.variables]       A JSON object containing the variables the process is to be initialized with. Each key corresponds to a variable name and each value to a variable value.
   * @param {String} [params.businessKey]     The business key the process instance is to be initialized with. The business key uniquely identifies the process instance in the context of the given process definition.
   * @param {String} [params.caseInstanceId]  The case instance id the process instance is to be initialized with.
   */
  start: function(params, done) {
    return this.http.post(this.path +'/'+ (params.id ? params.id : 'key/'+params.key ) + '/start', {
      data: params,
      done: done
    });
  }
});


module.exports = ProcessDefinition;


},{"./../abstract-client-resource":1,"q":41}],18:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_("./../abstract-client-resource");

/**
 * No-Op callback
 */
function noop() {}


/**
 * Process Instance Resource
 *
 * @class
 * @memberof CamSDK.client.resource
 * @augments CamSDK.client.AbstractClientResource
 */
var ProcessInstance = AbstractClientResource.extend(
/** @lends  CamSDK.client.resource.ProcessInstance.prototype */
{

},

/** @lends  CamSDK.client.resource.ProcessInstance */
{
  /**
   * API path for the process instance resource
   */
  path: 'process-instance',


  /**
   * Creates a process instance from a process definition
   *
   * @param  {Object}   params
   * @param  {String}   [params.id]
   * @param  {String}   [params.key]
   * @param  {Object.<String, *>} [params.variables]
   * @param  {requestCallback} [done]
   */
  create: function (params, done) {
    return this.http.post(params, done);
  },


  /**
   * Get a list of process instances
   *
   * @param  {Object}   params
   * @param {String} [params.processInstanceIds]      Filter by a comma-separated list of process
   *                                                  instance ids.
   * @param {String} [params.businessKey]             Filter by process instance business key.
   * @param {String} [params.caseInstanceId]          Filter by case instance id.
   * @param {String} [params.processDefinitionId]     Filter by the process definition the
   *                                                  instances run on.
   * @param {String} [params.processDefinitionKey]    Filter by the key of the process definition
   *                                                  the instances run on.
   * @param {String} [params.superProcessInstance]    Restrict query to all process instances that
   *                                                  are sub process instances of the given process
   *                                                  instance. Takes a process instance id.
   * @param {String} [params.subProcessInstance]      Restrict query to all process instances that
   *                                                  have the given process instance as a sub
   *                                                  process instance. Takes a process instance id.
   * @param {String} [params.active]                  Only include active process instances.
   *                                                  Values may be true or false.
   * @param {String} [params.suspended]               Only include suspended process instances.
   *                                                  Values may be true or false.
   * @param {String} [params.incidentId]              Filter by the incident id.
   * @param {String} [params.incidentType]            Filter by the incident type.
   * @param {String} [params.incidentMessage]         Filter by the incident message. Exact match.
   * @param {String} [params.incidentMessageLike]     Filter by the incident message that the
   *                                                  parameter is a substring of.
   * @param {String} [params.variables]               Only include process instances that have
   *                                                  variables with certain values.
   *                                                  Variable filtering expressions are
   *                                                  comma-separated and are structured as follows:
   *                                                  A valid parameter value has the form
   *                                                  key_operator_value. key is the variable name,
   *                                                  operator is the comparison operator to be used
   *                                                  and value the variable value.
   *                                                  Note: Values are always treated as String
   *                                                  objects on server side.
   *                                                  Valid operator values are:
   *                                                  - eq - equal to;
   *                                                  - neq - not equal to;
   *                                                  - gt - greater than;
   *                                                  - gteq - greater than or equal to;
   *                                                  - lt - lower than;
   *                                                  - lteq - lower than or equal to;
   *                                                  - like.
   *                                                  key and value may not contain underscore or
   *                                                  comma characters.
   * @param {String} [params.sortBy]                  Sort the results lexicographically by a given
   *                                                  criterion.
   *                                                  Valid values are:
   *                                                  - instanceId
   *                                                  - definitionKey
   *                                                  - definitionId.
   *                                                  Must be used in conjunction with the sortOrder
   *                                                  parameter.
   * @param {String} [params.sortOrder]               Sort the results in a given order.
   *                                                  Values may be asc for ascending order
   *                                                  or desc for descending order.
   *                                                  Must be used in conjunction with sortBy param.
   * @param {String} [params.firstResult]             Pagination of results. Specifies the index of
   *                                                  the first result to return.
   * @param {String} [params.maxResults]              Pagination of results. Specifies the maximum
   *                                                  number of results to return.
   *                                                  Will return less results if there are no more
   *                                                  results left.
   * @param  {requestCallback} done
   */
  list: function (params, done) {
    return AbstractClientResource.list.apply(this, arguments);
  },

  /**
   * Query for process instances using a list of parameters and retrieves the count
   *
   * @param  {Object}   params
   * @param {String} [params.processInstanceIds]      Filter by a comma-separated list of process
   *                                                  instance ids.
   * @param {String} [params.businessKey]             Filter by process instance business key.
   * @param {String} [params.caseInstanceId]          Filter by case instance id.
   * @param {String} [params.processDefinitionId]     Filter by the process definition the
   *                                                  instances run on.
   * @param {String} [params.processDefinitionKey]    Filter by the key of the process definition
   *                                                  the instances run on.
   * @param {String} [params.superProcessInstance]    Restrict query to all process instances that
   *                                                  are sub process instances of the given process
   *                                                  instance. Takes a process instance id.
   * @param {String} [params.subProcessInstance]      Restrict query to all process instances that
   *                                                  have the given process instance as a sub
   *                                                  process instance. Takes a process instance id.
   * @param {String} [params.active]                  Only include active process instances.
   *                                                  Values may be true or false.
   * @param {String} [params.suspended]               Only include suspended process instances.
   *                                                  Values may be true or false.
   * @param {String} [params.incidentId]              Filter by the incident id.
   * @param {String} [params.incidentType]            Filter by the incident type.
   * @param {String} [params.incidentMessage]         Filter by the incident message. Exact match.
   * @param {String} [params.incidentMessageLike]     Filter by the incident message that the
   *                                                  parameter is a substring of.
   * @param {String} [params.variables]               Only include process instances that have
   *                                                  variables with certain values.
   *                                                  Variable filtering expressions are
   *                                                  comma-separated and are structured as follows:
   *                                                  A valid parameter value has the form
   *                                                  key_operator_value. key is the variable name,
   *                                                  operator is the comparison operator to be used
   *                                                  and value the variable value.
   *                                                  Note: Values are always treated as String
   *                                                  objects on server side.
   *                                                  Valid operator values are:
   *                                                  - eq - equal to;
   *                                                  - neq - not equal to;
   *                                                  - gt - greater than;
   *                                                  - gteq - greater than or equal to;
   *                                                  - lt - lower than;
   *                                                  - lteq - lower than or equal to;
   *                                                  - like.
   *                                                  key and value may not contain underscore or
   *                                                  comma characters.
   * @param {String} [params.sortBy]                  Sort the results lexicographically by a given
   *                                                  criterion.
   *                                                  Valid values are:
   *                                                  - instanceId
   *                                                  - definitionKey
   *                                                  - definitionId.
   *                                                  Must be used in conjunction with the sortOrder
   *                                                  parameter.
   * @param {String} [params.sortOrder]               Sort the results in a given order.
   *                                                  Values may be asc for ascending order
   *                                                  or desc for descending order.
   *                                                  Must be used in conjunction with sortBy param.
   * @param {String} [params.firstResult]             Pagination of results. Specifies the index of
   *                                                  the first result to return.
   * @param {String} [params.maxResults]              Pagination of results. Specifies the maximum
   *                                                  number of results to return.
   *                                                  Will return less results if there are no more
   *                                                  results left.
   * @param  {requestCallback} done
   */
  count: function(params, done) {
    if (arguments.length === 1 && typeof params === 'function') {
      done = params;
      params = {};
    }

    params = params || {};

    return this.http.get(this.path + '/count', {
      data: params,
      done: done || noop
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
   * @param  {requestCallback}  done
   */
  modify: function (params, done) {
    return this.http.post(this.path + '/' + params.id + '/modification', {
      data: {
        instructions:         params.instructions,
        skipCustomListeners:  params.skipCustomListeners,
        skipIoMappings:       params.skipIoMappings
      },
      done: done
    });
  }
});


module.exports = ProcessInstance;

},{"./../abstract-client-resource":1}],19:[function(_dereq_,module,exports){
'use strict';

var Q = _dereq_('q');
var AbstractClientResource = _dereq_('./../abstract-client-resource');

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
Task.list = function(params, done) {
  done = done || noop;
  var deferred = Q.defer();

  this.http.get(this.path, {
    data: params,
    done: function(err, data) {
      if (err) {
        done(err);
        return deferred.reject(err);
      }

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

      done(null, data);
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
Task.get = function(taskId, done) {
  return this.http.get(this.path +'/'+ taskId, {
    done: done
  });
};

/**
 * Retrieve the comments for a single task
 * @param  {uuid}     taskId   of the task for which the comments are requested
 * @param  {Function} done
 */
Task.comments = function(taskId, done) {
  return this.http.get(this.path +'/'+ taskId + '/comment', {
    done: done
  });
};

/**
 * Retrieve the identity links for a single task
 * @param  {uuid}     taskId   of the task for which the identity links are requested
 * @param  {Function} done
 */
Task.identityLinks = function(taskId, done) {
  return this.http.get(this.path +'/'+ taskId + '/identity-links', {
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
Task.identityLinksAdd = function(taskId, params, done) {
  if (arguments.length === 2) {
    done = arguments[1];
    params = arguments[0];
    taskId = params.id;
  }
  return this.http.post(this.path +'/'+ taskId + '/identity-links', {
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
Task.identityLinksDelete = function(taskId, params, done) {
  if (arguments.length === 2) {
    done = arguments[1];
    params = arguments[0];
    taskId = params.id;
  }

  return this.http.post(this.path +'/'+ taskId + '/identity-links/delete', {
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
Task.createComment = function(taskId, message, done) {
  return this.http.post(this.path +'/'+ taskId +'/comment/create', {
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
Task.create = function(task, done) {
  return this.http.post(this.path +'/create', {
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
Task.update = function(task, done) {
  return this.http.put(this.path +'/'+ task.id, {
    data: task,
    done: done
  });
};



// /**
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
Task.assignee = function(taskId, userId, done) {
  var data = {
      userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path +'/'+ taskId +'/assignee', {
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
Task.delegate = function(taskId, userId, done) {
  var data = {
      userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path +'/'+ taskId +'/delegate', {
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
Task.claim = function(taskId, userId, done) {
  var data = {
      userId: userId
  };

  if (arguments.length === 2) {
    taskId = arguments[0].taskId;
    data.userId = arguments[0].userId;
    done = arguments[1];
  }

  return this.http.post(this.path +'/'+ taskId +'/claim', {
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
Task.unclaim = function(taskId, done) {
  if (typeof taskId !== 'string') {
    taskId = taskId.taskId;
  }

  return this.http.post(this.path +'/'+ taskId +'/unclaim', {
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
Task.submitForm = function(data, done) {
  done = done || noop;
  if (!data.id) {
    var err = new Error('Task submitForm needs a task id.');
    done(err);
    return Q.reject(err);
  }

  return this.http.post(this.path +'/'+ data.id +'/submit-form', {
    data: {
      variables: data.variables
    },
    done: done
  });
};






Task.formVariables = function(data, done) {
  done = done || noop;
  var pointer = '';
  if (data.key) {
    pointer = 'key/'+ data.key;
  }
  else if (data.id) {
    pointer = data.id;
  }
  else {
    var err = new Error('Task variables needs either a key or an id.');
    done(err);
    return Q.reject(err);
  }

  var queryData = {
    deserializeValues: data.deserializeValues
  };

  if(data.names) {
    queryData.variableNames = data.names.join(',');
  }

  return this.http.get(this.path +'/'+ pointer +'/form-variables', {
    data: queryData,
    done: done
  });
};

/**
 * Retrieve the form for a single task
 * @param  {uuid}     taskId   of the task for which the form is requested
 * @param  {Function} done
 */
Task.form = function(taskId, done) {
  return this.http.get(this.path +'/'+ taskId + '/form', {
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
Task.localVariable = function(params, done) {
  return this.http.put(this.path +'/'+ params.id + '/localVariables/' + params.varId, {
    data: params,
    done: done
  });
};

/**
 * Retrieve the local variables for a single task
 * @param  {uuid}     taskId   of the task for which the variables are requested
 * @param  {Function} done
 */
Task.localVariables = function(taskId, done) {
    return this.http.get(this.path + '/' + taskId + '/localVariables', {
        done: done
    });
};

/**
 * Updates or deletes the variables in the context of a task.
 * Updates precede deletions.
 * So, if a variable is updated AND deleted, the deletion overrides the update.
 */
Task.modifyVariables = function(data, done) {
  return this.http.post(this.path + '/' + data.id + '/localVariables', {
    data: data,
    done: done
  });
};

/**
 * Removes a local variable from a task.
 */
Task.deleteVariable = function (data, done) {
  return this.http.del(this.path + '/' + data.id + '/localVariables/' + data.varId, {
    done: done
  });
};


module.exports = Task;


},{"./../abstract-client-resource":1,"q":41}],20:[function(_dereq_,module,exports){
'use strict';

var Q = _dereq_('q');
var AbstractClientResource = _dereq_('./../abstract-client-resource');

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

  var required = [
    'id',
    'firstName',
    'lastName',
    'password'
  ];
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

  return this.http.post(this.path +'/create', {
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
  if (arguments.length === 1) {
    done = options;
    options = {};
  }
  else {
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
  if (arguments.length === 1) {
    done = options;
    options = {};
  }
  else {
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

  return this.http.get(this.path + '/' + id + '/profile', {
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

  return this.http.put(this.path + '/' + options.id + '/profile', {
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

  return this.http.put(this.path + '/' + options.id + '/credentials', {
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
User.delete = function (options, done) {
  var id = typeof options === 'string' ? options : options.id;

  return this.http.del(this.path + '/' + id, {
    done: done || noop
  });
};

module.exports = User;

},{"./../abstract-client-resource":1,"q":41}],21:[function(_dereq_,module,exports){
'use strict';

var AbstractClientResource = _dereq_('./../abstract-client-resource');



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
Variable.instances = function (data, done) {
  return this.http.post(this.path, {
    data: data,
    done: done
  });
};

module.exports = Variable;


},{"./../abstract-client-resource":1}],22:[function(_dereq_,module,exports){
'use strict';

var Events = _dereq_('./events');

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
BaseClass.extend = function(protoProps, staticProps) {
  protoProps = protoProps || {};
  staticProps = staticProps || {};

  var parent = this;
  var child, Surrogate, s, i;

  if (protoProps && Object.hasOwnProperty.call(parent, 'constructor')) {
    child = protoProps.constructor;
  }
  else {
    child = function(){ return parent.apply(this, arguments); };
  }

  for (s in parent) {
    child[s] = parent[s];
  }
  for (s in staticProps) {
    child[s] = staticProps[s];
  }

  Surrogate = function(){ this.constructor = child; };
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

},{"./events":23}],23:[function(_dereq_,module,exports){
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
  var a, arr = [];
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
  var ran = false, memo;
  return function() {
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
Events.attach = function(obj) {
  obj.on      = this.on;
  obj.once    = this.once;
  obj.off     = this.off;
  obj.trigger = this.trigger;
  obj._events = {};
};


/**
 * Bind a callback to `eventName`
 * @param  {String}   eventName
 * @param  {Function} callback
 */
Events.on = function(eventName, callback) {
  ensureEvents(this, eventName);

  this._events[eventName].push(callback);

  return this;
};


/**
 * Bind a callback who will only be called once to `eventName`
 * @param  {String}   eventName
 * @param  {Function} callback
 */
Events.once = function(eventName, callback) {
  var self = this;
  var cb = once(function() {
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
Events.off = function(eventName, callback) {
  ensureEvents(this, eventName);

  if (!callback) {
    delete this._events[eventName];
    return this;
  }

  var e, ev, arr = [];
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
Events.trigger = function() {
  var args = toArray(arguments);
  var eventName = args.shift();
  ensureEvents(this, eventName);

  var e, ev;
  for (e in this._events[eventName]) {
    this._events[eventName][e](this, args);
  }

  return this;
};


module.exports = Events;

},{}],24:[function(_dereq_,module,exports){
'use strict';
/* global CamSDK, require, localStorage: false */

/**
 * For all API client related
 * @namespace CamSDK.form
 */

var $ = _dereq_('./dom-lib');

var VariableManager = _dereq_('./variable-manager');

var InputFieldHandler = _dereq_('./controls/input-field-handler');

var ChoicesFieldHandler = _dereq_('./controls/choices-field-handler');

var FileDownloadHandler = _dereq_('./controls/file-download-handler');

var BaseClass = _dereq_('./../base-class');

var constants = _dereq_('./constants');

var Events = _dereq_('./../events');



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
 * @param {String}            [options.formUrl]
 */
function CamundaForm(options) {
  if(!options) {
    throw new Error('CamundaForm need to be initialized with options.');
  }

  var done = options.done = options.done || function (err) { if(err) throw err; };

  if (options.client) {
    this.client = options.client;
  }
  else {
    this.client = new CamSDK.Client(options.clientConfig || {});
  }

  if (!options.taskId && !options.processDefinitionId && !options.processDefinitionKey) {
    return done(new Error('Cannot initialize Taskform: either \'taskId\' or \'processDefinitionId\' or \'processDefinitionKey\' must be provided'));
  }

  this.taskId = options.taskId;
  if(!!this.taskId) {
    this.taskBasePath = this.client.baseUrl + "/task/" + this.taskId;
  }
  this.processDefinitionId = options.processDefinitionId;
  this.processDefinitionKey = options.processDefinitionKey;

  this.formElement = options.formElement;
  this.containerElement = options.containerElement;
  this.formUrl = options.formUrl;

  if(!this.formElement && !this.containerElement) {
    return done(new Error('CamundaForm needs to be initilized with either \'formElement\' or \'containerElement\''));
  }

  if(!this.formElement && !this.formUrl) {
    return done(new Error('Camunda form needs to be intialized with either \'formElement\' or \'formUrl\''));
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
  this.formFieldHandlers = options.formFieldHandlers || [
    InputFieldHandler,
    ChoicesFieldHandler,
    FileDownloadHandler
  ];

  this.businessKey = null;

  this.fields = [];

  this.scripts = [];

  this.options = options;

  // init event support
  Events.attach(this);

  this.initialize(done);
}

/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.initializeHandler = function(FieldHandler) {
  var self = this;
  var selector = FieldHandler.selector;

  $(selector, self.formElement).each(function() {
    self.fields.push(new FieldHandler(this, self.variableManager));
  });
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.initialize = function(done) {
  done = done || function (err) { if(err) throw err; };
  var self = this;

  // check whether form needs to be loaded first
  if(this.formUrl) {

    this.client.http.load(this.formUrl, {
      accept: '*/*',
      done: function(err, result) {
        if(err) {
          return done(err);
        }

        try {
          self.renderForm(result);
          self.initializeForm(done);

        } catch (error) {
          done(error);
        }
      },
      data: { noCache: Date.now() }
    });
  } else {

    try  {
      this.initializeForm(done);

    } catch (error) {
      done(error);
    }
  }
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.renderForm = function(formHtmlSource) {

  // apppend the form html to the container element,
  // we also wrap the formHtmlSource to limit the risks of breaking
  // the structure of the document
  $(this.containerElement)
    .html('')
    .append('<div class="injected-form-wrapper">'+formHtmlSource+'</div>');

  // extract and validate form element
  var formElement = this.formElement = $('form', this.containerElement);
  if(formElement.length !== 1) {
    throw new Error('Form must provide exaclty one element <form ..>');
  }
  if(!formElement.attr('name')) {
    formElement.attr('name', '$$camForm');
  }
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.initializeForm = function(done) {
  var self = this;

  // handle form scripts
  this.initializeFormScripts();

  // initialize field handlers
  this.initializeFieldHandlers();

  // execute the scripts
  this.executeFormScripts();

  // fire form loaded
  this.fireEvent('form-loaded');

  this.fetchVariables(function(err, result) {
    if (err) {
      throw err;
    }

    // merge the variables
    self.mergeVariables(result);

    // retain original server values for dirty checking
    self.storeOriginalValues(result);

    // fire variables fetched
    self.fireEvent('variables-fetched');

    // restore variables from local storage
    self.restore();

    // fire variables-restored
    self.fireEvent('variables-restored');

    // apply the variables to the form fields
    self.applyVariables();

    // fire variables applied
    self.fireEvent('variables-applied');

    // invoke callback
    done(null, self);
  });
};

CamundaForm.prototype.initializeFieldHandlers = function() {
  for(var FieldHandler in this.formFieldHandlers) {
    this.initializeHandler(this.formFieldHandlers[FieldHandler]);
  }
};

/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.initializeFormScripts = function() {
  var formScriptElements = $( 'script['+constants.DIRECTIVE_CAM_SCRIPT+']', this.formElement);
  for(var i = 0; i<formScriptElements.length; i++) {
    this.scripts.push(formScriptElements[i].text);
  }
};

CamundaForm.prototype.executeFormScripts = function() {
  for(var i = 0; i<this.scripts.length; i++) {
    this.executeFormScript(this.scripts[i]);
  }
};

CamundaForm.prototype.executeFormScript = function(script) {
  /* jshint unused: false */
  (function(camForm) {

    /* jshint evil: true */
    eval(script);
    /* jshint evil: false */

  })(this);
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
CamundaForm.prototype.store = function(callback) {
  var formId = this.taskId || this.processDefinitionId || this.caseInstanceId;

  if (!formId) {
    if(typeof callback === 'function') {
      return callback(new Error('Cannot determine the storage ID'));
    } else {
      throw new Error('Cannot determine the storage ID');
    }
  }

  this.storePrevented = false;
  this.fireEvent('store');
  if(!!this.storePrevented) {
    return;
  }

  try {
    // get values from form fields
    this.retrieveVariables();

    // build the local storage object
    var store = {date: Date.now(), vars: {}};
    for(var name in this.variableManager.variables) {
      if(this.variableManager.variables[name].type !== 'Bytes') {
        store.vars[name] = this.variableManager.variables[name].value;
      }
    }

    // store it
    localStorage.setItem('camForm:'+ formId, JSON.stringify(store));
  }
  catch (error) {
    if(typeof callback === 'function') {
      return callback(error);
    } else {
      throw error;
    }
  }
  this.fireEvent('variables-stored');
  if(typeof callback === 'function') {
    callback();
  }
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 * @return {Boolean} `true` if there is something who can be restored
 */
CamundaForm.prototype.isRestorable = function() {
  var formId = this.taskId || this.processDefinitionId || this.caseInstanceId;

  if (!formId) {
    throw new Error('Cannot determine the storage ID');
  }

  // verify the presence of an entry
  if (!localStorage.getItem('camForm:'+ formId)) {
    return false;
  }

  // unserialize
  var stored = localStorage.getItem('camForm:'+ formId);
  try  {
    stored = JSON.parse(stored);
  }
  catch (error) {
    return false;
  }

  // check the content
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
CamundaForm.prototype.restore = function(callback) {
  var stored;
  var vars = this.variableManager.variables;
  var formId = this.taskId || this.processDefinitionId || this.caseDefinitionId;

  if (!formId) {
    if(typeof callback === 'function') {
      return callback(new Error('Cannot determine the storage ID'));
    } else {
      throw new Error('Cannot determine the storage ID');
    }
  }


  // no need to go further if there is nothing to restore
  if (!this.isRestorable()) {
    if(typeof callback === 'function') {
      return callback();
    }
    return;
  }

  try {
    // retrieve the values from localStoarge
    stored = localStorage.getItem('camForm:'+ formId);
    stored = JSON.parse(stored).vars;
  }
  catch (error) {
    if(typeof callback === 'function') {
      return callback(error);
    } else {
      throw error;
    }
  }

  // merge the stored values on the variableManager.variables
  for (var name in stored) {
    if (vars[name]) {
      vars[name].value = stored[name];
    }
    else {
      vars[name] = {
        name: name,
        value: stored[name]
      };
    }
  }

  if(typeof callback === 'function') {
    callback();
  }

};


/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.submit = function(callback) {
  var formId = this.taskId || this.processDefinitionId;

  // fire submit event (event handler may prevent submit from being performed)
  this.submitPrevented = false;
  this.fireEvent('submit');
  if (!!this.submitPrevented) {
    return;
  }

  try {
    // get values from form fields
    this.retrieveVariables();
  } catch (error) {
    return callback && callback(error);
  }

  var self = this;
  this.transformFiles(function() {
    // clear the local storage for this form
    localStorage.removeItem('camForm:'+ formId);

    // submit the form variables
    self.submitVariables(function(err, result) {
      if(err) {
        self.fireEvent('submit-failed', err);
        return callback && callback(err);
      }

      self.fireEvent('submit-success');
      return callback && callback(null, result);
    });
  });

};

CamundaForm.prototype.transformFiles = function(callback) {
  var that = this;
  var counter = 1;

  var callCallback = function() {
    if(--counter === 0) {
      callback();
    }
  };

  var bytesToSize = function(bytes) {
     if(bytes === 0) return '0 Byte';
     var k = 1000;
     var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
     var i = Math.floor(Math.log(bytes) / Math.log(k));
     return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
  };

  for (var i in this.fields) {
    var element = this.fields[i].element[0];
    if(element.getAttribute('type') === 'file') {
      if(typeof FileReader === 'function' && element.files.length > 0) {
        if(element.files[0].size > (parseInt(element.getAttribute('cam-max-filesize'),10) || 5000000)) {
          throw new Error('Maximum file size of ' + bytesToSize(parseInt(element.getAttribute('cam-max-filesize'),10) || 5000000) + ' exceeded.');
        }
        var reader = new FileReader();
        /* jshint ignore:start */
        reader.onloadend = (function(i, element) {
          return function(e) {
            var binary = '';
            var bytes = new Uint8Array( e.target.result );
            var len = bytes.byteLength;
            for (var j = 0; j < len; j++) {
                binary += String.fromCharCode( bytes[ j ] );
            }
            var fileVar = that.variableManager.variables[that.fields[i].variableName];
            fileVar.value = btoa(binary);

            // set file metadata as value info
            if(fileVar.type.toLowerCase() === 'file') {
              fileVar.valueInfo = {
                filename: element.files[0].name,
                mimeType: element.files[0].type
              };
            }

            callCallback();
          };
        })(i, element);
        /* jshint ignore:end */
        reader.readAsArrayBuffer(element.files[0]);
        counter++;
      } else {
        that.variableManager.variables[that.fields[i].variableName].value = null;
      }
    }
  }

  callCallback();

};

/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.fetchVariables = function(done) {
  done = done || function(){};
  var names = this.variableManager.variableNames();
  if (names.length) {

    var data = {
      names: names,
      deserializeValues: false
    };

    // pass either the taskId, processDefinitionId or processDefinitionKey
    if (this.taskId) {
      data.id = this.taskId;
      this.client.resource('task').formVariables(data, done);
    }
    else {
      data.id = this.processDefinitionId;
      data.key = this.processDefinitionKey;
      this.client.resource('process-definition').formVariables(data, done);
    }
  }
  else {
    done();
  }
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.submitVariables = function(done) {
  done = done || function() {};

  var varManager = this.variableManager;
  var vars = varManager.variables;

  var variableData = {};
  for(var v in vars) {
    // only submit dirty variables
    // LIMITATION: dirty checking is not performed for complex object variables
    if(varManager.isDirty(v)) {
      var val = vars[v].value;
      // if variable is JSON, serialize

      if(varManager.isJsonVariable(v)) {
        val = JSON.stringify(val);
      }

      variableData[v] = {
        value: val,
        type: vars[v].type,
        valueInfo: vars[v].valueInfo
      };
    }
  }

  var data = { variables: variableData };

  // pass either the taskId, processDefinitionId or processDefinitionKey
  if (this.taskId) {
    data.id = this.taskId;
    this.client.resource('task').submitForm(data, done);
  }
  else {
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
CamundaForm.prototype.storeOriginalValues = function(variables) {
  for(var v in variables) {
    this.variableManager.setOriginalValue(v, variables[v].value);
  }
};

/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.mergeVariables = function(variables) {

  var vars = this.variableManager.variables;

  for (var v in variables) {
    if (vars[v]) {
      for (var p in variables[v]) {
        vars[v][p] = vars[v][p] || variables[v][p];
      }
    }
    else {
      vars[v] = variables[v];
    }
    // check whether the variable provides JSON payload. If true, deserialize
    if(this.variableManager.isJsonVariable(v)) {
      vars[v].value = JSON.parse(variables[v].value);
    }

    // generate content url for file and bytes variables
    var type = vars[v].type;
    if(!!this.taskBasePath && (type === "Bytes" || type === "File")) {
      vars[v].contentUrl = this.taskBasePath + '/variables/'+ vars[v].name + "/data";
    }

    this.variableManager.isVariablesFetched = true;
  }
};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.applyVariables = function() {

  for (var i in this.fields) {
    this.fields[i].applyValue();
  }

};



/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.retrieveVariables = function() {
  for (var i in this.fields) {
    this.fields[i].getValue();
  }
};

/**
 * @memberof CamSDK.form.CamundaForm.prototype
 */
CamundaForm.prototype.fireEvent = function(eventName, obj) {
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
CamundaForm.cleanLocalStorage = function(timestamp) {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if(key.indexOf('camForm:') === 0) {
      var item = JSON.parse(localStorage.getItem(key));
      if(item.date < timestamp) {
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


},{"./../base-class":22,"./../events":23,"./constants":25,"./controls/choices-field-handler":27,"./controls/file-download-handler":28,"./controls/input-field-handler":29,"./dom-lib":30,"./variable-manager":33}],25:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  DIRECTIVE_CAM_FORM : 'cam-form',
  DIRECTIVE_CAM_VARIABLE_NAME : 'cam-variable-name',
  DIRECTIVE_CAM_VARIABLE_TYPE : 'cam-variable-type',
  DIRECTIVE_CAM_FILE_DOWNLOAD : 'cam-file-download',
  DIRECTIVE_CAM_CHOICES : 'cam-choices',
  DIRECTIVE_CAM_SCRIPT : 'cam-script'
};

},{}],26:[function(_dereq_,module,exports){
'use strict';

var BaseClass = _dereq_('../../base-class');
var $ = _dereq_('./../dom-lib');

function noop() {}

/**
 * An abstract class for the form field controls
 *
 * @class AbstractFormField
 * @abstract
 * @memberof CamSDK.form
 *
 */
function AbstractFormField(element, variableManager) {
  this.element = $( element );
  this.variableManager = variableManager;

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


},{"../../base-class":22,"./../dom-lib":30}],27:[function(_dereq_,module,exports){
'use strict';

var constants = _dereq_('./../constants'),
    AbstractFormField = _dereq_('./abstract-form-field'),
    $ = _dereq_('./../dom-lib');


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
  initialize: function() {
    // read variable definitions from markup
    var variableName = this.variableName = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_NAME);
    var variableType = this.variableType = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE);
    var choicesVariableName = this.choicesVariableName = this.element.attr(constants.DIRECTIVE_CAM_CHOICES);

    // crate variable
    this.variableManager.createVariable({
      name: variableName,
      type: variableType,
      value: this.element.val() || null
    });

    // fetch choices variable
    if(!!choicesVariableName) {
      this.variableManager.fetchVariable(choicesVariableName);
    }

    // remember the original value found in the element for later checks
    this.originalValue = this.element.val() || null;

    this.previousValue = this.originalValue;

    // remember variable name
    this.variableName = variableName;
  },

  /**
   * Applies the stored value to a field element.
   *
   * @return {CamSDK.form.ChoicesFieldHandler} Chainable method.
   */
  applyValue: function() {

    var selectedIndex = this.element[0].selectedIndex;
    // if cam-choices variable is defined, apply options
    if(!!this.choicesVariableName) {
      var choicesVariableValue = this.variableManager.variableValue(this.choicesVariableName);
      if(!!choicesVariableValue) {
        // array
        if (choicesVariableValue instanceof Array) {
          for(var i = 0; i < choicesVariableValue.length; i++) {
            var val = choicesVariableValue[i];
            if(!this.element.find('option[text="'+val+'"]').length) {
              this.element.append($('<option>', {
                value: val,
                text: val
              }));
            }
          }
        // object aka map
        } else {
          for (var p in choicesVariableValue) {
            if(!this.element.find('option[value="'+p+'"]').length) {
              this.element.append($('<option>', {
                value: p,
                text: choicesVariableValue[p]
              }));
            }
          }
        }
      }
    }

    // make sure selected index is retained
    this.element[0].selectedIndex = selectedIndex;

    // select option referenced in cam-variable-name (if any)
    this.previousValue = this.element.val() || '';
    var variableValue = this.variableManager.variableValue(this.variableName);
    if (variableValue !== this.previousValue) {
      // write value to html control
      this.element.val(variableValue);
      this.element.trigger('camFormVariableApplied', variableValue);
    }

    return this;
  },

  /**
   * Retrieves the value from a field element and stores it
   *
   * @return {*} when multiple choices are possible an array of values, otherwise a single value
   */
  getValue: function() {
    // read value from html control
    var value;
    var multiple = this.element.prop('multiple');

    if (multiple) {
      value = [];
      this.element.find('option:selected').each(function() {
        value.push($(this).val());
      });
    }
    else {
      value = this.element.find('option:selected').attr('value');//.val();
    }

    // write value to variable
    this.variableManager.variableValue(this.variableName, value);

    return value;
  }

},
/** @lends CamSDK.form.ChoicesFieldHandler */
{
  selector: 'select['+ constants.DIRECTIVE_CAM_VARIABLE_NAME +']'

});

module.exports = ChoicesFieldHandler;


},{"./../constants":25,"./../dom-lib":30,"./abstract-form-field":26}],28:[function(_dereq_,module,exports){
'use strict';

var constants = _dereq_('./../constants'),
    AbstractFormField = _dereq_('./abstract-form-field'),
    $ = _dereq_('./../dom-lib');

/**
 * A field control handler for file downloads
 * @class
 * @memberof CamSDK.form
 * @augments {CamSDK.form.AbstractFormField}
 */
var InputFieldHandler = AbstractFormField.extend(
{
  /**
   * Prepares an instance
   */
  initialize: function() {

    this.variableName = this.element.attr(constants.DIRECTIVE_CAM_FILE_DOWNLOAD);

    // fetch the variable
    this.variableManager.fetchVariable(this.variableName);
  },

  applyValue: function() {

    var variable = this.variableManager.variable(this.variableName);

    // set the download url of the link
    this.element.attr("href", variable.contentUrl);

    // sets the text content of the link to the filename it the textcontent is empty    
    if(this.element.text().trim().length === 0) {
      this.element.text(variable.valueInfo.filename);
    }

    return this;
  }

},

{

  selector: 'a['+ constants.DIRECTIVE_CAM_FILE_DOWNLOAD +']'

});

module.exports = InputFieldHandler;


},{"./../constants":25,"./../dom-lib":30,"./abstract-form-field":26}],29:[function(_dereq_,module,exports){
'use strict';

var constants = _dereq_('./../constants'),
    AbstractFormField = _dereq_('./abstract-form-field'),
    $ = _dereq_('./../dom-lib');

var isBooleanCheckbox = function(element) {
  return element.attr('type') === "checkbox" && element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE) === "Boolean";
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
  initialize: function() {
    // read variable definitions from markup
    var variableName = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_NAME);
    var variableType = this.element.attr(constants.DIRECTIVE_CAM_VARIABLE_TYPE);

    // crate variable
    this.variableManager.createVariable({
      name: variableName,
      type: variableType
    });

    // remember the original value found in the element for later checks
    this.originalValue = this.element.val();

    this.previousValue = this.originalValue;

    // remember variable name
    this.variableName = variableName;

    this.getValue();
  },

  /**
   * Applies the stored value to a field element.
   *
   * @return {CamSDK.form.InputFieldHandler} Chainable method
   */
  applyValue: function() {
    this.previousValue = this.getValueFromHtmlControl() || '';
    var variableValue = this.variableManager.variableValue(this.variableName);
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
  getValue: function() {
    var value = this.getValueFromHtmlControl();

    // write value to variable
    this.variableManager.variableValue(this.variableName, value);

    return value;
  },

  getValueFromHtmlControl: function() {
    if(isBooleanCheckbox(this.element)) {
      return this.element.prop("checked");
    } else {
      return this.element.val();
    }
  },

  applyValueToHtmlControl: function(variableValue) {
    if(isBooleanCheckbox(this.element)) {
      this.element.prop("checked", variableValue);
    } else if(this.element[0].type !== 'file') {
      this.element.val(variableValue);
    }

  }

},
/** @lends CamSDK.form.InputFieldHandler */
{

  selector: 'input['+ constants.DIRECTIVE_CAM_VARIABLE_NAME +']'+
           ',textarea['+ constants.DIRECTIVE_CAM_VARIABLE_NAME +']'

});

module.exports = InputFieldHandler;


},{"./../constants":25,"./../dom-lib":30,"./abstract-form-field":26}],30:[function(_dereq_,module,exports){
(function (global){
'use strict';

(function(factory) {
  /* global global: false */
  factory(typeof window !== 'undefined' ? window : global);
}(function(root) {
  root = root || {};
  module.exports = root.jQuery ||
                   (root.angular ? root.angular.element : false) ||
                   root.Zepto;
}));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(_dereq_,module,exports){


module.exports = _dereq_('./camunda-form');

},{"./camunda-form":24}],32:[function(_dereq_,module,exports){
'use strict';

var INTEGER_PATTERN = /^-?[\d]+$/;

var FLOAT_PATTERN = /^(0|(-?(((0|[1-9]\d*)\.\d+)|([1-9]\d*))))([eE][-+]?[0-9]+)?$/;

var BOOLEAN_PATTERN = /^(true|false)$/;

var DATE_PATTERN = /^(\d{2}|\d{4})(?:\-)([0]{1}\d{1}|[1]{1}[0-2]{1})(?:\-)([0-2]{1}\d{1}|[3]{1}[0-1]{1})T(?:\s)?([0-1]{1}\d{1}|[2]{1}[0-3]{1}):([0-5]{1}\d{1}):([0-5]{1}\d{1})?$/;

var isType = function(value, type) {
  switch(type) {
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
      return DATE_PATTERN.test(value);
  }
};

var convertToType = function(value, type) {

  if(typeof value === 'string') {
    value = value.trim();
  }

  if(type === "String" || type === "Bytes" || type === "File") {
    return value;
  } else if (isType(value, type)) {
    switch(type) {
      case 'Integer':
      case 'Long':
      case 'Short':
        return parseInt(value, 10);
      case 'Float':
      case 'Double':
        return parseFloat(value);
      case 'Boolean':
        return "true" === value;
      case 'Date':
        return value;
    }
  } else {
    throw new Error("Value '"+value+"' is not of type "+type);
  }
};

module.exports = {
  convertToType : convertToType,
  isType : isType
};

},{}],33:[function(_dereq_,module,exports){
'use strict';

var convertToType = _dereq_('./type-util').convertToType;

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
  this.variables = { };

  /** @member boolean indicating whether the variables are fetched */
  this.isVariablesFetched = false;

}

VariableManager.prototype.fetchVariable = function(variable) {
  if(this.isVariablesFetched) {
    throw new Error('Illegal State: cannot call fetchVariable(), variables already fetched.');
  }
  this.createVariable({ name: variable });
};

VariableManager.prototype.createVariable = function(variable) {
  if(!this.variables[variable.name]) {
    this.variables[variable.name] = variable;
  } else {
    throw new Error('Cannot add variable with name '+variable.name+': already exists.');
  }
};

VariableManager.prototype.destroyVariable = function(variableName) {
  if(!!this.variables[variableName]) {
    delete this.variables[variableName];
  } else {
    throw new Error('Cannot remove variable with name '+variableName+': variable does not exist.');
  }
};

VariableManager.prototype.setOriginalValue = function(variableName, value) {
  if(!!this.variables[variableName]) {
    this.variables[variableName].originalValue = value;
  } else {
    throw new Error('Cannot set original value of variable with name '+variableName+': variable does not exist.');
  }

};

VariableManager.prototype.variable = function(variableName) {
  return this.variables[variableName];
};

VariableManager.prototype.variableValue = function(variableName, value) {

  var variable = this.variable(variableName);

  if(typeof value === 'undefined' || value === null) {
    value = null;

  } else if(value === '' && variable.type !== 'String') {
    // convert empty string to null for all types except String
    value = null;

  } else if(typeof value === "string" && variable.type !== "String") {
    // convert string value into model value
    value = convertToType(value, variable.type);

  }

  if(arguments.length === 2) {
    variable.value = value;
  }

  return variable.value;
};

VariableManager.prototype.isDirty = function(name) {
  var variable = this.variable(name);
  if(this.isJsonVariable(name)) {
    return variable.originalValue !== JSON.stringify(variable.value);
  } else {
    return variable.originalValue !== variable.value || variable.type === "Object";
  }
};

VariableManager.prototype.isJsonVariable = function(name) {
  var variable = this.variable(name);
  var type = variable.type;

  var supportedTypes = [ 'Object', 'json', 'Json' ];
  var idx = supportedTypes.indexOf(type);

  if (idx === 0) {
    return variable.valueInfo.serializationDataFormat.indexOf('application/json') !== -1;
  }

  return idx !== -1;
};

VariableManager.prototype.variableNames = function() {
  // since we support IE 8+ (http://kangax.github.io/compat-table/es5/)
  return Object.keys(this.variables);
};

module.exports = VariableManager;


},{"./type-util":32}],34:[function(_dereq_,module,exports){
/** @namespace CamSDK */

module.exports = {
  Client: _dereq_('./api-client'),
  Form:   _dereq_('./forms'),
  utils:  _dereq_('./utils')
};


},{"./api-client":3,"./forms":31,"./utils":35}],35:[function(_dereq_,module,exports){
'use strict';


/**
 * @exports CamSDK.utils
 */
var utils = module.exports = {"typeUtils" : _dereq_('./forms/type-util')};

utils.solveHALEmbedded = function(results) {

  function isId(str) {
    if (str.slice(-2) !== 'Id') { return false; }

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
};


// the 2 folowing functions were borrowed from async.js
// https://github.com/caolan/async/blob/master/lib/async.js

function _eachSeries(arr, iterator, callback) {
  callback = callback || function () {};
  if (!arr.length) {
    return callback();
  }
  var completed = 0;
  var iterate = function () {
    iterator(arr[completed], function (err) {
      if (err) {
        callback(err);
        callback = function () {};
      }
      else {
        completed += 1;
        if (completed >= arr.length) {
          callback();
        }
        else {
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
utils.series = function(tasks, callback) {
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

},{"./forms/type-util":32}],36:[function(_dereq_,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')
var isArray = _dereq_('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":37,"ieee754":38,"is-array":39}],37:[function(_dereq_,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],38:[function(_dereq_,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],39:[function(_dereq_,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],40:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],41:[function(_dereq_,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
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
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
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
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
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
    }
    // runs a single function in the async queue
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

    nextTick = function (task) {
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

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
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
})();

// Attempt to make generics safe in the face of downstream
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
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
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
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
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
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
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
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
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

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
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
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
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
    }

    // assimilate thenables
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

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
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
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
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
            return { state: "pending" };
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
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

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
            throw new Error("Can't join: not the same: " + x + " " + y);
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
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
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

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
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
    var done = false;   // ensure the untrusted promise makes at most a
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
    });

    // Progress propagator need to be attached in the current tick.
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
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
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
};

//// BEGIN UNHANDLED REJECTION TRACKING

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
    if (typeof process === "object" && typeof process.emit === "function") {
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
        if (typeof process === "object" && typeof process.emit === "function") {
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

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
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
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
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
        "isDef": function () {}
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
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
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
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
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
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
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
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
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
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
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
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
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
    var onUnhandledError = function (error) {
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
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
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
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
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
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
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

Promise.prototype.nbind = function (/*thisp, ...args*/) {
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
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
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

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":40}],42:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Emitter = _dereq_('emitter');
var reduce = _dereq_('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

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
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
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
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
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
  xml: 'application/xml',
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

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

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

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
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

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Force given parser
 * 
 * Sets the body parser no matter type.
 * 
 * @param {Function}
 * @api public
 */

Response.prototype.parse = function(fn){
  this.parser = fn;
  return this;
};

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

Response.prototype.parseBody = function(str){
  var parse = this.parser || request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
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

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
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
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
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

Request.prototype.set = function(field, val){
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
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

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

Request.prototype.type = function(type){
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

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
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

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
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

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
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

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
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
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
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
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
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
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":43,"reduce":44}],43:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

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

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
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

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
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

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
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

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

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

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],44:[function(_dereq_,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}]},{},[34])
(34)
});