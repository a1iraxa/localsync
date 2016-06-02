'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.cookiesync = cookiesync;
exports.default = localsync;

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var should = require('chai').should();

var navigator = (typeof window === 'undefined' ? 'undefined' : (0, _typeof3.default)(window)) === 'object' ? window.navigator : null;
function isEdgeOrIE() {
  if (!navigator) return false;
  return navigator.appName === 'Microsoft Internet Explorer' || navigator.appName === 'Netscape' && /(Trident|Edge)/i.test(navigator.appVersion);
}

function cookiesync(key, action, handler) {
  var _ref = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  var _ref$tracing = _ref.tracing;
  var tracing = _ref$tracing === undefined ? false : _ref$tracing;
  var _ref$logger = _ref.logger;
  var logger = _ref$logger === undefined ? console : _ref$logger;
  var _ref$logLevel = _ref.logLevel;
  var logLevel = _ref$logLevel === undefined ? 'info' : _ref$logLevel;
  var _ref$idLength = _ref.idLength;
  var idLength = _ref$idLength === undefined ? 8 : _ref$idLength;
  var _ref$pollFrequency = _ref.pollFrequency;
  var pollFrequency = _ref$pollFrequency === undefined ? 3000 : _ref$pollFrequency;
  var _ref$path = _ref.path;
  var path = _ref$path === undefined ? '/' : _ref$path;
  var _ref$secure = _ref.secure;
  var secure = _ref$secure === undefined ? false : _ref$secure;
  var _ref$httpOnly = _ref.httpOnly;
  var httpOnly = _ref$httpOnly === undefined ? false : _ref$httpOnly;

  var log = function log() {
    return tracing ? logger[logLevel].apply(logger, arguments) : function () {};
  };

  var cookie = require('react-cookie');
  var cookieOpts = { path: path, secure: secure, httpOnly: httpOnly };
  var cookieKey = 'localsync_fallback_' + key;
  var instanceID = function (N) {
    return (Math.random().toString(36) + '00000000000000000').slice(2, N + 2);
  }(idLength);
  var loadCookie = function loadCookie() {
    try {
      var value = cookie.load(cookieKey, false);
      if (typeof value !== 'undefined') {
        var _instanceID = value.instanceID;
        var payload = value.payload;

        should.exist(_instanceID, 'cookiesync cookies must have an instanceID associated => ' + (0, _stringify2.default)(value));
        _instanceID.should.be.a('string').and.have.lengthOf(idLength);
        should.exist(payload, 'cookiesync cookies must have a payload associated => ' + (0, _stringify2.default)(value));
      }
      log('cookiesync#loadCookie', value);
      return value;
    } catch (err) {
      logger.error(err, 'cookiesync#loadCookie => error occurred in cookiesync, wiping cookie with key ' + cookieKey);
      cookie.remove(cookieKey);
    }
  };
  var saveCookie = function saveCookie() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args.should.be.lengthOf(1);
    var payload = args[0];

    var value = { instanceID: instanceID, payload: payload };
    log('cookisync#saveCookie', instanceID, payload);
    cookie.save(cookieKey, value, cookieOpts);
  };

  var isRunning = false;
  var trigger = function trigger() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    log.apply(undefined, ['cookiesync#trigger', instanceID].concat(args));
    var payload = action.apply(undefined, args);
    log('cookiesync#trigger => payload', payload);
    saveCookie(payload);
  };

  var intervalID = null;
  var start = function start() {
    log('cookiesync#start', instanceID);
    var last = loadCookie();
    if (!last) {
      log('cookiesync#start: nolast', instanceID);
      last = { instanceID: instanceID };
      saveCookie(last);
    }
    intervalID = setInterval(function () {
      log('cookiesync#poll', instanceID);
      var current = loadCookie();
      if (!current) {
        log('cookiesync#poll: nocurrent', instanceID);
        current = last;
        saveCookie(current);
      }
      /** DONT NOTIFY IF SAME TAB */
      if (current.instanceID === instanceID) {
        log('cookiesync#poll: sameinstance', instanceID);
        return;
      }

      if ((0, _stringify2.default)(last.payload) != (0, _stringify2.default)(current.payload)) {
        log('cookiesync#poll: INVOKE|instanceID =', instanceID, '|current.instanceID =', current.instanceID, '|last.instanceID =', last.instanceID, '|last.payload =', (0, _stringify2.default)(last.payload), '|current.payload =', (0, _stringify2.default)(current.payload));
        handler(current.payload);
        last = current;
      } else {
        log('cookiesync#poll: noinvoke|instanceID =', instanceID, '|current.instanceID =', current.instanceID, '|last.instanceID =', last.instanceID, '|last.payload =', (0, _stringify2.default)(last.payload), '|current.payload =', (0, _stringify2.default)(current.payload));
      }
    }, pollFrequency);
    isRunning = true;
  };

  var stop = function stop() {
    log('cookiesync#stop', instanceID);
    clearInterval(intervalID);
    isRunning = false;
  };

  return { start: start,
    stop: stop,
    trigger: trigger,
    get isRunning() {
      return isRunning;
    },
    isFallback: true,
    instanceID: instanceID
  };
}

function localsync(key, action, handler) {
  var _ref2 = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  var _ref2$tracing = _ref2.tracing;
  var tracing = _ref2$tracing === undefined ? false : _ref2$tracing;
  var _ref2$logger = _ref2.logger;
  var logger = _ref2$logger === undefined ? console : _ref2$logger;
  var _ref2$logLevel = _ref2.logLevel;
  var logLevel = _ref2$logLevel === undefined ? 'info' : _ref2$logLevel;
  var cookiesyncOpts = (0, _objectWithoutProperties3.default)(_ref2, ['tracing', 'logger', 'logLevel']);

  should.exist(key);
  should.exist(action);
  should.exist(handler);

  if (isEdgeOrIE()) {
    log('localsync: cookiesync fallback enabled');
    return cookiesync(key, action, handler, (0, _extends3.default)({ tracing: tracing, logger: logger, logLevel: logLevel }, cookiesyncOpts));
  }
  var log = function log() {
    return tracing ? logger[logLevel].apply(logger, arguments) : function () {};
  };

  var isRunning = false;

  var trigger = function trigger() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    log('localsync#trigger', args);
    var value = action.apply(undefined, args);
    (0, _localStorage2.default)(key, value);
  };

  var start = function start() {
    log('localsync#start');
    _localStorage2.default.on(key, handler);
    isRunning = true;
  };

  var stop = function stop() {
    log('localsync#stop');
    _localStorage2.default.off(key, handler);
    isRunning = false;
  };

  return { start: start,
    stop: stop,
    trigger: trigger,
    get isRunning() {
      return isRunning;
    },
    isFallback: false
  };
}