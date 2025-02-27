(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
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
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
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
    while(len) {
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
};

// v8 likes predictible objects
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

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (setImmediate){
'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

module.exports = Promise;

}).call(this,require("timers").setImmediate)
},{"timers":3}],3:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
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
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":1,"timers":3}],4:[function(require,module,exports){
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./context", "./iterable"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var context_1 = __importDefault(require("./context"));

  var iterable_1 = __importDefault(require("./iterable"));

  exports.BuffersDefaultFragment = "\nvoid main(){\n\tgl_FragColor = vec4(1.0);\n}";
  exports.BuffersDefaultFragment2 = "#version 300 es\n\nprecision mediump float;\n\nout vec4 outColor;\n\nvoid main() {\n\toutColor = vec4(1.0);\n}\n";
  var BufferFloatType;

  (function (BufferFloatType) {
    BufferFloatType[BufferFloatType["FLOAT"] = 0] = "FLOAT";
    BufferFloatType[BufferFloatType["HALF_FLOAT"] = 1] = "HALF_FLOAT";
  })(BufferFloatType = exports.BufferFloatType || (exports.BufferFloatType = {}));

  var Buffer =
  /*#__PURE__*/
  function () {
    function Buffer(gl, BW, BH, index) {
      _classCallCheck(this, Buffer);

      var buffer = gl.createFramebuffer();
      var texture = this.getTexture(gl, BW, BH, index);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.texture = texture;
      this.buffer = buffer;
      this.BW = BW;
      this.BH = BH;
      this.index = index;
    }

    _createClass(Buffer, [{
      key: "getFloatType",
      value: function getFloatType(gl) {
        var floatType, extension;

        if (Buffer.floatType === BufferFloatType.FLOAT) {
          var extensionName = gl instanceof WebGL2RenderingContext ? 'EXT_color_buffer_float' : 'OES_texture_float';
          extension = gl.getExtension(extensionName);

          if (extension) {
            floatType = gl.FLOAT;
          } else {
            Buffer.floatType = BufferFloatType.HALF_FLOAT;
            return this.getFloatType(gl);
          }
        } else {
          var _extensionName = gl instanceof WebGL2RenderingContext ? 'EXT_color_buffer_half_float' : 'OES_texture_half_float';

          extension = gl.getExtension(_extensionName);

          if (extension) {
            floatType = extension.HALF_FLOAT_OES;
          } else {
            Buffer.floatType = BufferFloatType.FLOAT;
            return this.getFloatType(gl);
          }
        }

        return floatType;
      }
    }, {
      key: "getTexture",
      value: function getTexture(gl, BW, BH, index) {
        var floatType = this.getFloatType(gl);
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl instanceof WebGL2RenderingContext ? gl.RGBA16F : gl.RGBA, BW, BH, 0, gl.RGBA, floatType, null);
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          if (Buffer.floatType === BufferFloatType.FLOAT) {
            Buffer.floatType = BufferFloatType.HALF_FLOAT;
          } else {
            Buffer.floatType = BufferFloatType.FLOAT;
          }

          return this.getTexture(gl, BW, BH, index);
        }

        return texture;
      }
    }, {
      key: "resize",
      value: function resize(gl, BW, BH) {
        if (BW !== this.BW || BH !== this.BH) {
          var buffer = this.buffer;
          var texture = this.texture;
          var index = this.index;
          gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
          var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
          var minW = Math.min(BW, this.BW);
          var minH = Math.min(BH, this.BH);
          var pixels;
          var floatType = this.getFloatType(gl);

          if (status === gl.FRAMEBUFFER_COMPLETE) {
            pixels = new Float32Array(minW * minH * 4);
            gl.readPixels(0, 0, minW, minH, gl.RGBA, floatType, pixels);
          }

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          var newIndex = index + 1; // temporary index

          var newTexture = this.getTexture(gl, BW, BH, newIndex);
          floatType = this.getFloatType(gl);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          if (pixels) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, minW, minH, gl.RGBA, floatType, pixels);
          }

          var newBuffer = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.deleteTexture(texture);
          gl.activeTexture(gl.TEXTURE0 + index);
          gl.bindTexture(gl.TEXTURE_2D, newTexture);
          this.index = index;
          this.texture = newTexture;
          this.buffer = newBuffer;
          this.BW = BW;
          this.BH = BH;
        }
      }
    }]);

    return Buffer;
  }();

  Buffer.floatType = BufferFloatType.HALF_FLOAT;
  exports.Buffer = Buffer;

  var IOBuffer =
  /*#__PURE__*/
  function () {
    function IOBuffer(index, key, vertexString, fragmentString) {
      _classCallCheck(this, IOBuffer);

      this.isValid = false;
      this.index = index;
      this.key = key;
      this.vertexString = vertexString;
      this.fragmentString = fragmentString;
    }

    _createClass(IOBuffer, [{
      key: "create",
      value: function create(gl, BW, BH) {
        // console.log('create', this.vertexString, this.fragmentString);
        var vertexShader = context_1.default.createShader(gl, this.vertexString, gl.VERTEX_SHADER);
        var fragmentShader = context_1.default.createShader(gl, this.fragmentString, gl.FRAGMENT_SHADER, 1);

        if (!fragmentShader) {
          fragmentShader = context_1.default.createShader(gl, gl instanceof WebGL2RenderingContext ? exports.BuffersDefaultFragment2 : exports.BuffersDefaultFragment, gl.FRAGMENT_SHADER);
          this.isValid = false;
        } else {
          this.isValid = true;
        }

        var program = context_1.default.createProgram(gl, [vertexShader, fragmentShader]); // gl.useProgram(program);

        var input = new Buffer(gl, BW, BH, this.index + 0);
        var output = new Buffer(gl, BW, BH, this.index + 2);
        this.program = program;
        this.input = input;
        this.output = output;
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      }
    }, {
      key: "render",
      value: function render(gl, BW, BH) {
        gl.useProgram(this.program);
        gl.viewport(0, 0, BW, BH);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.output.buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6); // swap

        var temp = this.input;
        var input = this.output;
        var output = temp;
        this.input = input;
        this.output = output;
      }
    }, {
      key: "resize",
      value: function resize(gl, BW, BH) {
        gl.useProgram(this.program);
        gl.viewport(0, 0, BW, BH);
        this.input.resize(gl, BW, BH);
        this.output.resize(gl, BW, BH);
      }
    }, {
      key: "destroy",
      value: function destroy(gl) {
        gl.deleteProgram(this.program);
        this.program = null;
        this.input = null;
        this.output = null;
      }
    }]);

    return IOBuffer;
  }();

  exports.IOBuffer = IOBuffer;

  var Buffers =
  /*#__PURE__*/
  function (_iterable_1$default) {
    _inherits(Buffers, _iterable_1$default);

    function Buffers() {
      _classCallCheck(this, Buffers);

      return _possibleConstructorReturn(this, _getPrototypeOf(Buffers).apply(this, arguments));
    }

    _createClass(Buffers, [{
      key: "count",
      get: function get() {
        return Object.keys(this.values).length * 4;
      }
    }], [{
      key: "getBuffers",
      value: function getBuffers(gl, fragmentString, vertexString) {
        var buffers = new Buffers();
        var count = 0;

        if (fragmentString) {
          if (gl instanceof WebGL2RenderingContext) {
            fragmentString = fragmentString.replace(/^\#version\s*300\s*es\s*\n/, '');
          }

          var regexp = /(?:^\s*)((?:#if|#elif)(?:\s*)(defined\s*\(\s*BUFFER_)(\d+)(?:\s*\))|(?:#ifdef)(?:\s*BUFFER_)(\d+)(?:\s*))/gm;
          var matches;

          while ((matches = regexp.exec(fragmentString)) !== null) {
            var i = matches[3] || matches[4];
            var key = 'u_buffer' + i;
            var bufferFragmentString = gl instanceof WebGL2RenderingContext ? "#version 300 es\n#define BUFFER_".concat(i, "\n").concat(fragmentString) : "#define BUFFER_".concat(i, "\n").concat(fragmentString);
            var buffer = new IOBuffer(count, key, vertexString, bufferFragmentString);
            buffer.create(gl, gl.drawingBufferWidth, gl.drawingBufferHeight);
            buffers.set(key, buffer);
            count += 4;
          }
        }

        return buffers;
      }
    }]);

    return Buffers;
  }(iterable_1.default);

  exports.default = Buffers;
});

},{"./context":6,"./iterable":8}],5:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "promise-polyfill"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  require("promise-polyfill");

  var Common =
  /*#__PURE__*/
  function () {
    function Common() {
      _classCallCheck(this, Common);
    }

    _createClass(Common, null, [{
      key: "fetch",
      value: function fetch(url) {
        // console.log('fetch', url);
        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();

          xhr.onload = function () {
            resolve(xhr.response || xhr.responseText);
          };

          xhr.onerror = function (error) {
            // console.log(error);
            reject(new Error("Network request failed for url ".concat(url)));
          };

          xhr.ontimeout = function (error) {
            // console.log(error);
            reject(new Error("Network request failed for url ".concat(url)));
          };

          xhr.onabort = function () {
            reject(new Error('Aborted'));
          };

          xhr.open('GET', url, true);
          xhr.send(null);
        });
      }
    }]);

    return Common;
  }();

  exports.default = Common;
});

},{"promise-polyfill":2}],6:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./common", "./logger"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var common_1 = __importDefault(require("./common"));

  var logger_1 = __importDefault(require("./logger"));

  exports.ContextDefaultVertex = "\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\nattribute vec2 a_position;\nattribute vec2 a_texcoord;\n\nvarying vec2 v_texcoord;\n\nvoid main(){\n\tgl_Position = vec4(a_position, 0.0, 1.0);\n\tv_texcoord = a_texcoord;\n}\n";
  exports.ContextDefaultFragment = "\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\nvoid main(){\n\tgl_FragColor = vec4(0.0);\n}\n";
  exports.ContextDefaultVertex2 = "#version 300 es\n\nin vec2 a_position;\nin vec2 a_texcoord;\n\nout vec2 v_texcoord;\n\nvoid main() {\n\tgl_Position = vec4(a_position, 0.0, 1.0);\n\tv_texcoord = a_texcoord;\n}\n";
  exports.ContextDefaultFragment2 = "#version 300 es\n\nprecision mediump float;\n\nout vec4 outColor;\n\nvoid main() {\n\toutColor = vec4(0.0);\n}\n";

  var ContextOptions = function ContextOptions() {
    _classCallCheck(this, ContextOptions);
  };

  exports.ContextOptions = ContextOptions;
  var ContextVersion;

  (function (ContextVersion) {
    ContextVersion[ContextVersion["WebGl"] = 1] = "WebGl";
    ContextVersion[ContextVersion["WebGl2"] = 2] = "WebGl2";
  })(ContextVersion = exports.ContextVersion || (exports.ContextVersion = {}));

  var ContextError;

  (function (ContextError) {
    ContextError[ContextError["BrowserSupport"] = 1] = "BrowserSupport";
    ContextError[ContextError["Other"] = 2] = "Other";
  })(ContextError = exports.ContextError || (exports.ContextError = {}));

  var ContextVertexBuffers = function ContextVertexBuffers() {
    _classCallCheck(this, ContextVertexBuffers);
  };

  exports.ContextVertexBuffers = ContextVertexBuffers;

  var Context =
  /*#__PURE__*/
  function () {
    function Context() {
      _classCallCheck(this, Context);
    }

    _createClass(Context, null, [{
      key: "getContext_",
      value: function getContext_(canvas, options) {
        var names = ['webgl', 'experimental-webgl'];
        var context = null;

        for (var i = 0; i < names.length; ++i) {
          try {
            context = canvas.getContext(names[i], options);
          } catch (e) {
            if (context) {
              break;
            }
          }
        }

        return context;
      }
    }, {
      key: "getContext2_",
      value: function getContext2_(canvas, options) {
        var context = null;

        try {
          context = canvas.getContext('webgl2', options);
        } catch (e) {// console.error('GlslCanvas.Context.getContext2_.error', e);
        }

        return context;
      }
    }, {
      key: "getIncludes",
      value: function getIncludes(input) {
        if (input === undefined) {
          return Promise.resolve(input);
        }

        var regex = /#include\s*['|"](.*.glsl)['|"]/gm;
        var promises = [];
        var i = 0;
        var match;

        while ((match = regex.exec(input)) !== null) {
          promises.push(Promise.resolve(input.slice(i, match.index)));
          i = match.index + match[0].length;
          promises.push(common_1.default.fetch(match[1]));
        }

        promises.push(Promise.resolve(input.slice(i)));
        return Promise.all(promises).then(function (chunks) {
          return chunks.join('');
        });
      }
    }, {
      key: "isWebGl",
      value: function isWebGl(context) {
        return context instanceof WebGLRenderingContext;
      }
    }, {
      key: "isWebGl2",
      value: function isWebGl2(context) {
        return context instanceof WebGL2RenderingContext;
      }
    }, {
      key: "inferVersion",
      value: function inferVersion(vertexString, fragmentString) {
        var source = vertexString || fragmentString;

        if (source) {
          return source.indexOf('#version 300 es') === 0 ? ContextVersion.WebGl2 : ContextVersion.WebGl;
        } else {
          return ContextVersion.WebGl;
        }
      }
    }, {
      key: "versionDiffers",
      value: function versionDiffers(gl, vertexString, fragmentString) {
        if (gl) {
          var currentVersion = gl instanceof WebGL2RenderingContext ? ContextVersion.WebGl2 : ContextVersion.WebGl;
          var newVersion = Context.inferVersion(vertexString, fragmentString);
          return newVersion !== currentVersion;
        } else {
          return false;
        }
      }
    }, {
      key: "getVertex",
      value: function getVertex(vertexString, fragmentString) {
        if (vertexString) {
          return vertexString;
        } else {
          var version = this.inferVersion(vertexString, fragmentString);
          return version === ContextVersion.WebGl2 ? exports.ContextDefaultVertex2 : exports.ContextDefaultVertex;
        }
      }
    }, {
      key: "getFragment",
      value: function getFragment(vertexString, fragmentString) {
        if (fragmentString) {
          return fragmentString;
        } else {
          var version = this.inferVersion(vertexString, fragmentString);
          return version === ContextVersion.WebGl2 ? exports.ContextDefaultFragment2 : exports.ContextDefaultFragment;
        }
      }
    }, {
      key: "tryInferContext",
      value: function tryInferContext(vertexString, fragmentString, canvas, attributes, errorCallback) {
        function handleError(errorCode, html) {
          if (typeof errorCallback === 'function') {
            errorCallback(errorCode);
          } else {
            var container = canvas.parentNode;

            if (container) {
              container.innerHTML = "<div class=\"glsl-canvas--error\">".concat(html, "</div>");
            }
          }
        }

        if (!WebGLRenderingContext) {
          handleError(ContextError.BrowserSupport, "This page requires a browser that supports WebGL.<br/>\n\t\t\t<a href=\"http://get.webgl.org\">Click here to upgrade your browser.</a>");
          return;
        }

        var context = Context.inferContext(vertexString, fragmentString, canvas, attributes);

        if (!context) {
          handleError(ContextError.Other, "It does not appear your computer can support WebGL.<br/>\n\t\t\t<a href=\"http://get.webgl.org/troubleshooting/\">Click here for more information.</a>");
        } else {
          if (!(context instanceof WebGL2RenderingContext)) {
            context.getExtension('OES_standard_derivatives');
          }
        }

        return context;
      }
    }, {
      key: "tryGetContext",
      value: function tryGetContext(canvas, attributes, errorCallback) {
        function handleError(errorCode, html) {
          if (typeof errorCallback === 'function') {
            errorCallback(errorCode);
          } else {
            var container = canvas.parentNode;

            if (container) {
              container.innerHTML = "<div class=\"glsl-canvas--error\">".concat(html, "</div>");
            }
          }
        }

        if (!WebGLRenderingContext) {
          handleError(ContextError.BrowserSupport, "This page requires a browser that supports WebGL.<br/>\n\t\t\t<a href=\"http://get.webgl.org\">Click here to upgrade your browser.</a>");
          return null;
        }

        var context = Context.getContext_(canvas, attributes);

        if (!context) {
          handleError(ContextError.Other, "It does not appear your computer can support WebGL.<br/>\n\t\t\t<a href=\"http://get.webgl.org/troubleshooting/\">Click here for more information.</a>");
        } else {
          context.getExtension('OES_standard_derivatives');
        }

        return context;
      }
    }, {
      key: "inferContext",
      value: function inferContext(vertexString, fragmentString, canvas, options) {
        var version = this.inferVersion(vertexString, fragmentString);
        return version === ContextVersion.WebGl2 ? this.getContext2_(canvas, options) : this.getContext_(canvas, options);
      }
    }, {
      key: "createShader",
      value: function createShader(gl, source, type) {
        var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if (!compiled) {
          // Something went wrong during compilation; get the error
          Context.lastError = gl.getShaderInfoLog(shader); // console.log('lastError', Context.lastError);

          logger_1.default.error('*** Error compiling shader ' + shader + ':' + Context.lastError); // main.trigger('error', {

          gl.deleteShader(shader);
          throw {
            shader: shader,
            source: source,
            type: type,
            error: Context.lastError,
            offset: offset
          };
        }

        return shader;
      }
    }, {
      key: "createProgram",
      value: function createProgram(gl, shaders, attributes, locations) {
        var program = gl.createProgram();

        for (var i = 0; i < shaders.length; ++i) {
          gl.attachShader(program, shaders[i]);
        }

        if (attributes && locations) {
          for (var _i = 0; _i < attributes.length; ++_i) {
            gl.bindAttribLocation(program, locations ? locations[_i] : _i, attributes[_i]);
          }
        }

        gl.linkProgram(program); // Check the link status

        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);

        if (!linked) {
          // something went wrong with the link
          Context.lastError = gl.getProgramInfoLog(program);
          logger_1.default.log('Error in program linking:' + Context.lastError);
          gl.deleteProgram(program);
          return null;
        }

        return program;
      }
    }, {
      key: "createVertexBuffers",
      value: function createVertexBuffers(gl, program) {
        var vertexBuffers = new ContextVertexBuffers();
        var texcoordIndex = gl.getAttribLocation(program, 'a_texcoord');
        vertexBuffers.texcoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.texcoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texcoordIndex);
        gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0);
        var positionIndex = gl.getAttribLocation(program, 'a_position');
        vertexBuffers.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionIndex);
        gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
        return vertexBuffers;
      }
    }]);

    return Context;
  }();

  Context.lastError = '';
  exports.default = Context;
});

},{"./common":5,"./logger":9}],7:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result["default"] = mod;
  return result;
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "promise-polyfill", "./buffers", "./common", "./context", "./logger", "./subscriber", "./textures", "./uniforms"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  }); // import '@babel/polyfill';

  require("promise-polyfill");

  var buffers_1 = __importDefault(require("./buffers"));

  var common_1 = __importDefault(require("./common"));

  var context_1 = __importStar(require("./context"));

  var logger_1 = __importDefault(require("./logger"));

  var subscriber_1 = __importDefault(require("./subscriber"));

  var textures_1 = __importStar(require("./textures"));

  var uniforms_1 = __importStar(require("./uniforms"));

  var GlslCanvasOptions =
  /*#__PURE__*/
  function (_context_1$ContextOpt) {
    _inherits(GlslCanvasOptions, _context_1$ContextOpt);

    function GlslCanvasOptions() {
      _classCallCheck(this, GlslCanvasOptions);

      return _possibleConstructorReturn(this, _getPrototypeOf(GlslCanvasOptions).apply(this, arguments));
    }

    return GlslCanvasOptions;
  }(context_1.ContextOptions);

  exports.GlslCanvasOptions = GlslCanvasOptions;

  var GlslCanvasTimer =
  /*#__PURE__*/
  function () {
    function GlslCanvasTimer() {
      _classCallCheck(this, GlslCanvasTimer);

      this.delay = 0.0;
      this.current = 0.0;
      this.delta = 0.0;
      this.paused = false;
      this.start = this.previous = this.now();
    }

    _createClass(GlslCanvasTimer, [{
      key: "now",
      value: function now() {
        return performance.now();
      }
    }, {
      key: "play",
      value: function play() {
        if (this.previous) {
          var now = this.now();
          this.delay += now - this.previous;
          this.previous = now;
        } // Logger.log(this.delay);


        this.paused = false;
      }
    }, {
      key: "pause",
      value: function pause() {
        this.paused = true;
      }
    }, {
      key: "next",
      value: function next() {
        var now = this.now();
        this.delta = now - this.previous;
        this.current = now - this.start - this.delay;
        this.previous = now;
        return this;
      }
    }]);

    return GlslCanvasTimer;
  }();

  exports.GlslCanvasTimer = GlslCanvasTimer;

  var GlslCanvas =
  /*#__PURE__*/
  function (_subscriber_1$default) {
    _inherits(GlslCanvas, _subscriber_1$default);

    function GlslCanvas(canvas) {
      var _this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {// alpha: true,
        // antialias: true,
        // premultipliedAlpha: true
      };

      _classCallCheck(this, GlslCanvas);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(GlslCanvas).call(this));
      _this.mouse = {
        x: 0,
        y: 0
      };
      _this.uniforms = new uniforms_1.default();
      _this.buffers = new buffers_1.default();
      _this.textures = new textures_1.default();
      _this.textureList = [];
      _this.valid = false;
      _this.animated = false;
      _this.dirty = true;
      _this.visible = false;

      if (!canvas) {
        return _possibleConstructorReturn(_this);
      }

      _this.options = options;
      _this.canvas = canvas;
      _this.width = 0; // canvas.clientWidth;

      _this.height = 0; // canvas.clientHeight;

      _this.rect = canvas.getBoundingClientRect();
      _this.devicePixelRatio = window.devicePixelRatio || 1;
      canvas.style.backgroundColor = options.backgroundColor || 'rgba(0,0,0,0)';

      _this.getShaders_().then(function (success) {
        /*
        const v = this.vertexString = options.vertexString || this.vertexString;
        const f = this.fragmentString = options.fragmentString || this.fragmentString;
        this.vertexString = Context.getVertex(v, f);
        this.fragmentString = Context.getFragment(v, f);
        const gl = Context.tryInferContext(v, f, canvas, options, options.onError);
        if (!gl) {
            return;
        }
        this.gl = gl;
        */
        _this.load().then(function (success) {
          if (!_this.program) {
            return;
          }

          _this.addListeners_();

          _this.onLoop();
        });
      }, function (error) {
        logger_1.default.log('GlslCanvas.getShaders_.error', error);
      });

      GlslCanvas.items.push(_assertThisInitialized(_assertThisInitialized(_this)));
      return _this;
    }

    _createClass(GlslCanvas, [{
      key: "getShaders_",
      value: function getShaders_() {
        var _this2 = this;

        return new Promise(function (resolve, reject) {
          var canvas = _this2.canvas;
          var urls = {};

          if (canvas.hasAttribute('data-vertex-url')) {
            urls.vertex = canvas.getAttribute('data-vertex-url');
          }

          if (canvas.hasAttribute('data-fragment-url')) {
            urls.fragment = canvas.getAttribute('data-fragment-url');
          }

          if (canvas.hasAttribute('data-vertex')) {
            _this2.vertexString = canvas.getAttribute('data-vertex');
          }

          if (canvas.hasAttribute('data-fragment')) {
            _this2.fragmentString = canvas.getAttribute('data-fragment');
          }

          if (Object.keys(urls).length) {
            Promise.all(Object.keys(urls).map(function (key, i) {
              var url = urls[key];
              return common_1.default.fetch(url) // .then((response) => response.text())
              .then(function (body) {
                if (key === 'vertex') {
                  return _this2.vertexString = body;
                } else {
                  return _this2.fragmentString = body;
                }
              });
            })).then(function (shaders) {
              resolve([_this2.vertexString, _this2.fragmentString]);
            });
          } else {
            resolve([_this2.vertexString, _this2.fragmentString]);
          }
        });
      }
    }, {
      key: "addListeners_",
      value: function addListeners_() {
        /*
        const resize = (e: Event) => {
            this.rect = this.canvas.getBoundingClientRect();
            this.trigger('resize', e);
        };
        */
        this.onScroll = this.onScroll.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onMousemove = this.onMousemove.bind(this);
        this.onMouseover = this.onMouseover.bind(this);
        this.onMouseout = this.onMouseout.bind(this);
        this.onTouchmove = this.onTouchmove.bind(this);
        this.onTouchend = this.onTouchend.bind(this);
        this.onTouchstart = this.onTouchstart.bind(this);
        this.onLoop = this.onLoop.bind(this); // window.addEventListener('resize', this.onResize);

        window.addEventListener('scroll', this.onScroll);
        document.addEventListener('mousemove', this.onMousemove, false);
        document.addEventListener('touchmove', this.onTouchmove);
        this.addCanvasListeners_();
      }
    }, {
      key: "addCanvasListeners_",
      value: function addCanvasListeners_() {
        if (this.canvas.hasAttribute('controls')) {
          this.canvas.addEventListener('click', this.onClick);
          this.canvas.addEventListener('mouseover', this.onMouseover);
          this.canvas.addEventListener('mouseout', this.onMouseout);
          this.canvas.addEventListener('touchstart', this.onTouchstart);

          if (!this.canvas.hasAttribute('data-autoplay')) {
            this.pause();
          }
        }
      }
    }, {
      key: "removeCanvasListeners_",
      value: function removeCanvasListeners_() {
        if (this.canvas.hasAttribute('controls')) {
          this.canvas.removeEventListener('click', this.onClick);
          this.canvas.removeEventListener('mouseover', this.onMouseover);
          this.canvas.removeEventListener('mouseout', this.onMouseout);
          this.canvas.removeEventListener('touchstart', this.onTouchstart);
        }
      }
    }, {
      key: "removeListeners_",
      value: function removeListeners_() {
        window.cancelAnimationFrame(this.rafId); // window.removeEventListener('resize', this.onResize);

        window.removeEventListener('scroll', this.onScroll);
        document.removeEventListener('mousemove', this.onMousemove);
        document.removeEventListener('touchmove', this.onTouchmove);
        this.removeCanvasListeners_();
      }
    }, {
      key: "onScroll",
      value: function onScroll(e) {
        this.rect = this.canvas.getBoundingClientRect();
      }
    }, {
      key: "onClick",
      value: function onClick(e) {
        this.toggle();
        this.trigger('click', e);
      }
    }, {
      key: "onMove",
      value: function onMove(mx, my) {
        /*
        const rect = this.rect, gap = 20;
        const x = Math.max(-gap, Math.min(rect.width + gap, (mx - rect.left) * this.devicePixelRatio));
        const y = Math.max(-gap, Math.min(rect.height + gap, (this.canvas.height - (my - rect.top) * this.devicePixelRatio)));
        */
        var rect = this.rect;
        var x = (mx - rect.left) * this.devicePixelRatio;
        var y = (rect.height - (my - rect.top)) * this.devicePixelRatio;

        if (x !== this.mouse.x || y !== this.mouse.y) {
          this.mouse.x = x;
          this.mouse.y = y;
          this.trigger('move', this.mouse);
        }
      }
    }, {
      key: "onMousemove",
      value: function onMousemove(e) {
        this.onMove(e.clientX || e.pageX, e.clientY || e.pageY);
      }
    }, {
      key: "onMouseover",
      value: function onMouseover(e) {
        this.play();
        this.trigger('over', e);
      }
    }, {
      key: "onMouseout",
      value: function onMouseout(e) {
        this.pause();
        this.trigger('out', e);
      }
    }, {
      key: "onTouchmove",
      value: function onTouchmove(e) {
        var touch = [].slice.call(e.touches).reduce(function (p, touch) {
          p = p || {
            x: 0,
            y: 0
          };
          p.x += touch.clientX;
          p.y += touch.clientY;
          return p;
        }, null);

        if (touch) {
          this.onMove(touch.x / e.touches.length, touch.y / e.touches.length);
        }
      }
    }, {
      key: "onTouchend",
      value: function onTouchend(e) {
        this.pause();
        this.trigger('out', e);
        document.removeEventListener('touchend', this.onTouchend);
      }
    }, {
      key: "onTouchstart",
      value: function onTouchstart(e) {
        this.play();
        this.trigger('over', e);
        document.addEventListener('touchend', this.onTouchend);
        document.removeEventListener('mousemove', this.onMousemove);

        if (this.canvas.hasAttribute('controls')) {
          this.canvas.removeEventListener('mouseover', this.onMouseover);
          this.canvas.removeEventListener('mouseout', this.onMouseout);
        }
      }
    }, {
      key: "onLoop",
      value: function onLoop(time) {
        this.checkRender();
        this.rafId = window.requestAnimationFrame(this.onLoop);
      }
    }, {
      key: "setUniform_",
      value: function setUniform_(key, values) {
        var _this3 = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        var uniform = uniforms_1.default.parseUniform(key, values, type);

        if (Array.isArray(uniform)) {
          if (uniforms_1.default.isArrayOfSampler2D(uniform)) {
            uniform.forEach(function (x) {
              return _this3.loadTexture(x.key, x.values[0], options);
            });
          } else {
            uniform.forEach(function (x) {
              return _this3.uniforms.set(x.key, x.values[0]);
            });
          }
        } else if (uniform) {
          switch (uniform.type) {
            case uniforms_1.UniformType.Sampler2D:
              this.loadTexture(key, values[0], options);
              break;

            default:
              this.uniforms.set(key, uniform);
          }
        }
      }
    }, {
      key: "parseTextures_",
      value: function parseTextures_(fragmentString) {
        var _this4 = this;

        var regexp = /uniform\s*sampler2D\s*([\w]*);(\s*\/\/\s*([\w|\:\/\/|\.|\-|\_]*)|\s*)/gm;
        var matches;

        while ((matches = regexp.exec(fragmentString)) !== null) {
          var key = matches[1];

          if (matches[3]) {
            var ext = matches[3].split('.').pop().toLowerCase();
            var url = matches[3];

            if (url && textures_1.TextureExtensions.indexOf(ext) !== -1) {
              this.textureList.push({
                key: key,
                url: url
              });
            }
          } else if (!this.buffers.has(key)) {
            // create empty texture
            this.textureList.push({
              key: key,
              url: null
            });
          }
        }

        if (this.canvas.hasAttribute('data-textures')) {
          var urls = this.canvas.getAttribute('data-textures').split(',');
          urls.forEach(function (url, i) {
            var key = 'u_texture' + i;

            _this4.textureList.push({
              key: key,
              url: url
            });
          });
        }

        return this.textureList.length > 0;
      }
    }, {
      key: "createUniforms_",
      value: function createUniforms_() {
        var _this5 = this;

        var gl = this.gl;
        var fragmentString = this.fragmentString;
        var BW = gl.drawingBufferWidth;
        var BH = gl.drawingBufferHeight;
        var timer = this.timer = new GlslCanvasTimer();
        var hasDelta = (fragmentString.match(/u_delta/g) || []).length > 1;
        var hasTime = (fragmentString.match(/u_time/g) || []).length > 1;
        var hasDate = (fragmentString.match(/u_date/g) || []).length > 1;
        var hasMouse = (fragmentString.match(/u_mouse/g) || []).length > 1;
        var hasTextures = this.parseTextures_(fragmentString);
        this.animated = hasTime || hasDate || hasMouse;

        if (this.animated) {
          this.canvas.classList.add('animated');
        } else {
          this.canvas.classList.remove('animated');
        }

        this.uniforms.create(uniforms_1.UniformMethod.Uniform2f, uniforms_1.UniformType.Float, 'u_resolution', [BW, BH]);

        if (hasDelta) {
          this.uniforms.create(uniforms_1.UniformMethod.Uniform1f, uniforms_1.UniformType.Float, 'u_delta', [timer.delta / 1000.0]);
        }

        if (hasTime) {
          this.uniforms.create(uniforms_1.UniformMethod.Uniform1f, uniforms_1.UniformType.Float, 'u_time', [timer.current / 1000.0]);
        }

        if (hasDate) {
          var date = new Date();
          this.uniforms.create(uniforms_1.UniformMethod.Uniform4f, uniforms_1.UniformType.Float, 'u_date', [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() * 0.001]);
        }

        if (hasMouse) {
          this.uniforms.create(uniforms_1.UniformMethod.Uniform2f, uniforms_1.UniformType.Float, 'u_mouse', [0, 0]);
        }

        for (var key in this.buffers.values) {
          var buffer = this.buffers.values[key];
          this.uniforms.create(uniforms_1.UniformMethod.Uniform1i, uniforms_1.UniformType.Sampler2D, buffer.key, [buffer.input.index]);
        }

        if (hasTextures) {
          this.textureList.filter(function (x) {
            return x.url;
          }).forEach(function (x) {
            _this5.setTexture(x.key, x.url, x.options);
          });
          this.textureList = [];
        }
      }
    }, {
      key: "updateUniforms_",
      value: function updateUniforms_() {
        var gl = this.gl;
        var BW = gl.drawingBufferWidth;
        var BH = gl.drawingBufferHeight;
        var timer = this.timer.next();
        this.uniforms.update(uniforms_1.UniformMethod.Uniform2f, uniforms_1.UniformType.Float, 'u_resolution', [BW, BH]);

        if (this.uniforms.has('u_delta')) {
          this.uniforms.update(uniforms_1.UniformMethod.Uniform1f, uniforms_1.UniformType.Float, 'u_delta', [timer.delta / 1000.0]);
        }

        if (this.uniforms.has('u_time')) {
          this.uniforms.update(uniforms_1.UniformMethod.Uniform1f, uniforms_1.UniformType.Float, 'u_time', [timer.current / 1000.0]);
        }

        if (this.uniforms.has('u_date')) {
          var date = new Date();
          this.uniforms.update(uniforms_1.UniformMethod.Uniform4f, uniforms_1.UniformType.Float, 'u_date', [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() * 0.001]);
        }

        if (this.uniforms.has('u_mouse')) {
          var mouse = this.mouse;
          this.uniforms.update(uniforms_1.UniformMethod.Uniform2f, uniforms_1.UniformType.Float, 'u_mouse', [mouse.x, mouse.y]);
          /*
          const rect = this.rect;
          if (mouse.x >= rect.left && mouse.x <= rect.right &&
              mouse.y >= rect.top && mouse.y <= rect.bottom) {
              const MX = (mouse.x - rect.left) * this.devicePixelRatio;
              const MY = (this.canvas.height - (mouse.y - rect.top) * this.devicePixelRatio);
              this.uniforms.update(UniformMethod.Uniform2f, UniformType.Float, 'u_mouse', [MX, MY]);
          }
          */
        }

        for (var key in this.buffers.values) {
          var buffer = this.buffers.values[key];
          this.uniforms.update(uniforms_1.UniformMethod.Uniform1i, uniforms_1.UniformType.Sampler2D, buffer.key, [buffer.input.index]);
        }

        for (var _key in this.textures.values) {
          var texture = this.textures.values[_key];
          texture.tryUpdate(gl);
          this.uniforms.update(uniforms_1.UniformMethod.Uniform1i, uniforms_1.UniformType.Sampler2D, texture.key, [texture.index]);
        }
      }
    }, {
      key: "isVisible_",
      value: function isVisible_() {
        var rect = this.rect;
        return rect.top + rect.height > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight);
      }
    }, {
      key: "isAnimated_",
      value: function isAnimated_() {
        return (this.animated || this.textures.animated) && !this.timer.paused;
      }
    }, {
      key: "isDirty_",
      value: function isDirty_() {
        return this.dirty || this.uniforms.dirty || this.textures.dirty;
      } // check size change at start of requestFrame

    }, {
      key: "sizeDidChanged_",
      value: function sizeDidChanged_() {
        var gl = this.gl;
        var W = Math.ceil(this.canvas.clientWidth),
            H = Math.ceil(this.canvas.clientHeight);

        if (this.width !== W || this.height !== H) {
          this.width = W;
          this.height = H; // Lookup the size the browser is displaying the canvas in CSS pixels
          // and compute a size needed to make our drawingbuffer match it in
          // device pixels.

          var BW = Math.ceil(W * this.devicePixelRatio);
          var BH = Math.ceil(H * this.devicePixelRatio);
          this.canvas.width = BW;
          this.canvas.height = BH;
          /*
          if (gl.canvas.width !== BW ||
              gl.canvas.height !== BH) {
              gl.canvas.width = BW;
              gl.canvas.height = BH;
              // Set the viewport to match
              // gl.viewport(0, 0, BW, BH);
          }
          */

          for (var key in this.buffers.values) {
            var buffer = this.buffers.values[key];
            buffer.resize(gl, BW, BH);
          }

          this.rect = this.canvas.getBoundingClientRect();
          this.trigger('resize'); // gl.useProgram(this.program);

          return true;
        } else {
          return false;
        }
      }
    }, {
      key: "load",
      value: function load(fragmentString, vertexString) {
        var _this6 = this;

        return Promise.all([context_1.default.getIncludes(fragmentString || this.fragmentString), context_1.default.getIncludes(vertexString || this.vertexString)]).then(function (array) {
          _this6.fragmentString = array[0];
          _this6.vertexString = array[1];
          return _this6.createContext_();
        });
      }
    }, {
      key: "getContext_",
      value: function getContext_() {
        var vertexString = this.vertexString;
        var fragmentString = this.fragmentString;
        this.vertexString = context_1.default.getVertex(vertexString, fragmentString);
        this.fragmentString = context_1.default.getFragment(vertexString, fragmentString);

        if (context_1.default.versionDiffers(this.gl, vertexString, fragmentString)) {
          this.destroyContext_();
          this.swapCanvas_();
          this.uniforms = new uniforms_1.default();
          this.buffers = new buffers_1.default();
          this.textures = new textures_1.default();
          this.textureList = [];
        }

        if (!this.gl) {
          var gl = context_1.default.tryInferContext(vertexString, fragmentString, this.canvas, this.options, this.options.onError);

          if (!gl) {
            return;
          }

          this.gl = gl;
        }

        return this.gl;
      }
    }, {
      key: "createContext_",
      value: function createContext_() {
        var gl = this.getContext_();

        if (!gl) {
          return;
        }

        var vertexShader, fragmentShader;

        try {
          vertexShader = context_1.default.createShader(gl, this.vertexString, gl.VERTEX_SHADER);
          fragmentShader = context_1.default.createShader(gl, this.fragmentString, gl.FRAGMENT_SHADER); // If Fragment shader fails load a empty one to sign the error

          if (!fragmentShader) {
            fragmentShader = context_1.default.createShader(gl, context_1.ContextDefaultFragment, gl.FRAGMENT_SHADER);
            this.valid = false;
          } else {
            this.valid = true;
          }
        } catch (e) {
          // !!!
          // console.error(e);
          this.trigger('error', e);
          return false;
        } // Create and use program


        var program = context_1.default.createProgram(gl, [vertexShader, fragmentShader]); //, [0,1],['a_texcoord','a_position']);

        gl.useProgram(program); // Delete shaders
        // gl.detachShader(program, vertexShader);
        // gl.detachShader(program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        this.program = program;

        if (this.valid) {
          try {
            this.buffers = buffers_1.default.getBuffers(gl, this.fragmentString, this.vertexString);
          } catch (e) {
            // console.error('load', e);
            this.valid = false;
            this.trigger('error', e);
            return false;
          }

          this.vertexBuffers = context_1.default.createVertexBuffers(gl, program);
          this.createUniforms_();
        } // Trigger event


        this.trigger('load', this);
        return this.valid;
      }
    }, {
      key: "test",
      value: function test(fragmentString, vertexString) {
        var _this7 = this;

        return new Promise(function (resolve, reject) {
          var vertex = _this7.vertexString;
          var fragment = _this7.fragmentString;
          var paused = _this7.timer.paused; // Thanks to @thespite for the help here
          // https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query/

          var extension = _this7.gl.getExtension('EXT_disjoint_timer_query');

          var query = extension.createQueryEXT();
          var wasValid = _this7.valid;

          if (fragmentString || vertexString) {
            _this7.load(fragmentString, vertexString);

            wasValid = _this7.valid;

            _this7.render();
          }

          _this7.timer.paused = true;
          extension.beginQueryEXT(extension.TIME_ELAPSED_EXT, query);

          _this7.render();

          extension.endQueryEXT(extension.TIME_ELAPSED_EXT);

          var waitForTest = function waitForTest() {
            _this7.render();

            var available = extension.getQueryObjectEXT(query, extension.QUERY_RESULT_AVAILABLE_EXT);

            var disjoint = _this7.gl.getParameter(extension.GPU_DISJOINT_EXT);

            if (available && !disjoint) {
              var result = {
                wasValid: wasValid,
                fragment: fragmentString || _this7.fragmentString,
                vertex: vertexString || _this7.vertexString,
                timeElapsedMs: extension.getQueryObjectEXT(query, extension.QUERY_RESULT_EXT) / 1000000.0
              };
              _this7.timer.paused = paused;

              if (fragmentString || vertexString) {
                _this7.load(fragment, vertex);
              }

              resolve(result);
            } else {
              window.requestAnimationFrame(waitForTest);
            }
          };

          waitForTest();
        });
      }
    }, {
      key: "destroyContext_",
      value: function destroyContext_() {
        var gl = this.gl;
        gl.useProgram(null);

        if (this.program) {
          gl.deleteProgram(this.program);
        }

        for (var key in this.buffers.values) {
          var buffer = this.buffers.values[key];
          buffer.destroy(gl);
        }

        for (var _key2 in this.textures.values) {
          var texture = this.textures.values[_key2];
          texture.destroy(gl);
        }

        this.buffers = null;
        this.textures = null;
        this.uniforms = null;
        this.program = null;
        this.gl = null;
      }
    }, {
      key: "swapCanvas_",
      value: function swapCanvas_() {
        var canvas = this.canvas;
        var canvas_ = canvas.cloneNode();
        canvas.parentNode.replaceChild(canvas_, canvas);
        this.canvas = canvas_;
        this.addCanvasListeners_();
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.removeListeners_();
        this.destroyContext_();
        this.animated = false;
        this.valid = false;
        GlslCanvas.items.splice(GlslCanvas.items.indexOf(this), 1);
      }
    }, {
      key: "loadTexture",
      value: function loadTexture(key, urlElementOrData) {
        var _this8 = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        if (this.valid) {
          // Logger.log('GlslCanvas.loadTexture', key, urlElementOrData);
          this.textures.createOrUpdate(this.gl, key, urlElementOrData, this.buffers.count, options, this.options.workpath).then(function (texture) {
            var index = texture.index;

            var uniform = _this8.uniforms.createTexture(key, index);

            uniform.texture = texture;
            var keyResolution = key.indexOf('[') !== -1 ? key.replace('[', 'Resolution[') : key + 'Resolution';

            var uniformResolution = _this8.uniforms.create(uniforms_1.UniformMethod.Uniform2f, uniforms_1.UniformType.Float, keyResolution, [texture.width, texture.height]); // Logger.log('loadTexture', key, url, index, texture.width, texture.height);


            return texture;
          }, function (error) {
            var message = Array.isArray(error.path) ? error.path.map(function (x) {
              return x.error ? x.error.message : '';
            }).join(', ') : error.message;
            logger_1.default.log('GlslCanvas.loadTexture.error', key, urlElementOrData, message);

            _this8.trigger('textureError', {
              key: key,
              urlElementOrData: urlElementOrData,
              message: message
            });
          });
        } else {
          this.textureList.push({
            key: key,
            url: urlElementOrData,
            options: options
          });
        }
      }
    }, {
      key: "setTexture",
      value: function setTexture(key, urlElementOrData) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return this.setUniform_(key, [urlElementOrData], options);
      }
    }, {
      key: "setUniform",
      value: function setUniform(key) {
        for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key3 = 1; _key3 < _len; _key3++) {
          values[_key3 - 1] = arguments[_key3];
        }

        return this.setUniform_(key, values);
      }
    }, {
      key: "setUniformOfInt",
      value: function setUniformOfInt(key, values) {
        return this.setUniform_(key, values, null, uniforms_1.UniformType.Int);
      }
    }, {
      key: "setUniforms",
      value: function setUniforms(values) {
        for (var key in values) {
          this.setUniform(key, values[key]);
        }
      }
    }, {
      key: "pause",
      value: function pause() {
        if (this.valid) {
          this.timer.pause();
          this.canvas.classList.add('paused');
          this.trigger('pause');
        }
      }
    }, {
      key: "play",
      value: function play() {
        if (this.valid) {
          this.timer.play();
          this.canvas.classList.remove('paused');
          this.trigger('play');
        }
      }
    }, {
      key: "toggle",
      value: function toggle() {
        if (this.valid) {
          if (this.timer.paused) {
            this.play();
          } else {
            this.pause();
          }
        }
      }
    }, {
      key: "checkRender",
      value: function checkRender() {
        if (this.isVisible_() && (this.sizeDidChanged_() || this.isAnimated_() || this.isDirty_())) {
          this.render();
          this.canvas.classList.add('playing');
        } else {
          this.canvas.classList.remove('playing');
        }
      }
    }, {
      key: "render",
      value: function render() {
        var gl = this.gl;

        if (!gl) {
          return;
        }

        var BW = gl.drawingBufferWidth;
        var BH = gl.drawingBufferHeight;
        this.updateUniforms_();

        for (var key in this.buffers.values) {
          var buffer = this.buffers.values[key];
          this.uniforms.apply(gl, buffer.program);
          buffer.render(gl, BW, BH);
        }

        gl.useProgram(this.program);
        this.uniforms.apply(gl, this.program);
        gl.viewport(0, 0, BW, BH);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        this.uniforms.clean();
        this.textures.clean();
        this.dirty = false;
        this.trigger('render', this);
      }
    }], [{
      key: "version",
      value: function version() {
        return '0.1.5';
      }
    }, {
      key: "of",
      value: function of(canvas) {
        return GlslCanvas.items.find(function (x) {
          return x.canvas === canvas;
        }) || new GlslCanvas(canvas);
      }
    }, {
      key: "loadAll",
      value: function loadAll() {
        var canvases = [].slice.call(document.getElementsByClassName('glsl-canvas')).filter(function (x) {
          return x instanceof HTMLCanvasElement;
        });
        return canvases.map(function (x) {
          return GlslCanvas.of(x);
        });
      }
    }]);

    return GlslCanvas;
  }(subscriber_1.default);

  GlslCanvas.logger = logger_1.default;
  GlslCanvas.items = [];
  exports.default = GlslCanvas;
  window.GlslCanvas = window.GlslCanvas || GlslCanvas; // (<any>(window)).GlslCanvas = GlslCanvas;

  if (document) {
    document.addEventListener("DOMContentLoaded", function () {
      GlslCanvas.loadAll();
    });
  }
});

},{"./buffers":4,"./common":5,"./context":6,"./logger":9,"./subscriber":10,"./textures":11,"./uniforms":12,"promise-polyfill":2}],8:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var NumberMap = function NumberMap() {
    _classCallCheck(this, NumberMap);
  };

  exports.NumberMap = NumberMap;
  ;

  var StringMap = function StringMap() {
    _classCallCheck(this, StringMap);
  };

  exports.StringMap = StringMap;
  ;

  var IterableStringMap =
  /*#__PURE__*/
  function () {
    function IterableStringMap() {
      _classCallCheck(this, IterableStringMap);

      this.values = new StringMap();
    }

    _createClass(IterableStringMap, [{
      key: "has",
      value: function has(key) {
        return this.values.hasOwnProperty(key);
      }
    }, {
      key: "set",
      value: function set(key, item) {
        this.values[key] = item;
      }
    }, {
      key: "get",
      value: function get(key) {
        return this.values[key];
      }
    }, {
      key: "forEach",
      value: function forEach(callbackfn) {
        var i = 0;

        for (var key in this.values) {
          callbackfn(this.values[key], i, this.values);
          i++;
        }
      }
    }, {
      key: "reduce",
      value: function reduce(callbackfn, initialValue) {
        var previous = initialValue,
            i = 0;

        for (var key in this.values) {
          previous = callbackfn(previous, this.values[key], i, this.values);
          i++;
        }

        return previous;
      }
    }]);

    return IterableStringMap;
  }();

  exports.default = IterableStringMap;
});

},{}],9:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var Logger =
  /*#__PURE__*/
  function () {
    function Logger() {
      _classCallCheck(this, Logger);
    }

    _createClass(Logger, null, [{
      key: "log",
      value: function log() {
        if (Logger.enabled) {
          var _console;

          (_console = console).log.apply(_console, arguments);
        }
      }
    }, {
      key: "warn",
      value: function warn() {
        if (Logger.enabled) {
          var _console2;

          (_console2 = console).warn.apply(_console2, arguments);
        }
      }
    }, {
      key: "error",
      value: function error() {
        if (Logger.enabled) {
          var _console3;

          (_console3 = console).error.apply(_console3, arguments);
        }
      }
    }]);

    return Logger;
  }();

  Logger.enabled = false;
  exports.default = Logger;
});

},{}],10:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./logger"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var logger_1 = __importDefault(require("./logger"));

  var Listener = function Listener(event, callback) {
    _classCallCheck(this, Listener);

    this.event = event;
    this.callback = callback;
  };

  exports.Listener = Listener;

  var Subscriber =
  /*#__PURE__*/
  function () {
    function Subscriber() {
      _classCallCheck(this, Subscriber);

      this.listeners = new Set();
    }

    _createClass(Subscriber, [{
      key: "logListeners",
      value: function logListeners() {
        this.listeners.forEach(function (x) {
          return logger_1.default.log(x);
        });
      }
    }, {
      key: "subscribe",
      value: function subscribe(listener) {
        this.listeners.add(listener);
      }
    }, {
      key: "unsubscribe",
      value: function unsubscribe(listener) {
        this.listeners.delete(listener);
      }
    }, {
      key: "unsubscribeAll",
      value: function unsubscribeAll() {
        this.listeners.clear();
      }
    }, {
      key: "on",
      value: function on(event, callback) {
        this.listeners.add(new Listener(event, callback));
        return this;
      }
    }, {
      key: "off",
      value: function off(event, callback) {
        var _this = this;

        if (callback) {
          this.listeners.delete(new Listener(event, callback));
        } else {
          this.listeners.forEach(function (x) {
            if (x.event === event) {
              _this.listeners.delete(x);
            }
          });
        }

        return this;
      }
    }, {
      key: "trigger",
      value: function trigger(event) {
        for (var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          data[_key - 1] = arguments[_key];
        }

        this.listeners.forEach(function (x) {
          if (x.event === event && typeof x.callback === 'function') {
            x.callback.apply(x, data);
          }
        });
        return this;
      }
    }]);

    return Subscriber;
  }();

  exports.default = Subscriber;
});

},{"./logger":9}],11:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./iterable", "./logger", "./subscriber"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  }); // import 'promise-polyfill';

  var iterable_1 = __importDefault(require("./iterable"));

  var logger_1 = __importDefault(require("./logger"));

  var subscriber_1 = __importDefault(require("./subscriber"));

  exports.TextureImageExtensions = ['jpg', 'jpeg', 'png'];
  exports.TextureVideoExtensions = ['ogv', 'webm', 'mp4'];
  exports.TextureExtensions = exports.TextureImageExtensions.concat(exports.TextureVideoExtensions);
  var TextureSourceType;

  (function (TextureSourceType) {
    TextureSourceType[TextureSourceType["Data"] = 0] = "Data";
    TextureSourceType[TextureSourceType["Element"] = 1] = "Element";
    TextureSourceType[TextureSourceType["Url"] = 2] = "Url";
  })(TextureSourceType || (TextureSourceType = {}));

  var TextureFilteringType;

  (function (TextureFilteringType) {
    TextureFilteringType["MipMap"] = "mipmap";
    TextureFilteringType["Linear"] = "linear";
    TextureFilteringType["Nearest"] = "nearest";
  })(TextureFilteringType || (TextureFilteringType = {}));

  var TextureInput = function TextureInput() {
    _classCallCheck(this, TextureInput);
  };

  exports.TextureInput = TextureInput;

  var TextureData = function TextureData() {
    _classCallCheck(this, TextureData);
  };

  exports.TextureData = TextureData;

  var TextureOptions = function TextureOptions() {
    _classCallCheck(this, TextureOptions);
  };

  exports.TextureOptions = TextureOptions; // GL texture wrapper object for keeping track of a global set of textures, keyed by a unique user-defined name

  var Texture =
  /*#__PURE__*/
  function (_subscriber_1$default) {
    _inherits(Texture, _subscriber_1$default);

    function Texture(gl, key, index) {
      var _this;

      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new TextureOptions();
      var workpath = arguments.length > 4 ? arguments[4] : undefined;

      _classCallCheck(this, Texture);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Texture).call(this));
      _this.valid = false;
      _this.dirty = false;
      _this.animated = false;
      _this.powerOf2 = false;
      _this.key = key;
      _this.index = index;
      _this.options = options;
      _this.workpath = workpath;

      _this.create(gl);

      return _this;
    }

    _createClass(Texture, [{
      key: "create",
      value: function create(gl) {
        this.texture = gl.createTexture();

        if (this.texture) {
          this.valid = true;
        } // Default to a 1-pixel black texture so we can safely render while we wait for an image to load
        // See: http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
        // [255, 255, 255, 255]


        this.setData(gl, 1, 1, new Uint8Array([0, 0, 0, 0]), {
          filtering: TextureFilteringType.Linear
        }); // this.bindTexture();
        // this.load(options);
      }
    }, {
      key: "load",
      value: function load(gl) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        this.options = options;

        if (typeof options.url === 'string') {
          if (this.url === undefined || options.url !== this.url) {
            return this.setUrl(gl, options.url, options);
          } else {
            return Promise.resolve(this);
          }
        } else if (options.element) {
          return this.setElement(gl, options.element, options);
        } else if (options.data && options.width && options.height) {
          return this.setData(gl, options.width, options.height, options.data, options);
        }
      }
    }, {
      key: "setUrl",
      value: function setUrl(gl, url) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        if (!this.valid) {
          return;
        }

        this.url = url; // save URL reference (will be overwritten when element is loaded below)

        this.source = url;
        this.sourceType = TextureSourceType.Url;
        this.options = Object.assign(this.options, options);
        var src = String(url.indexOf(':/') === -1 && this.workpath !== undefined ? "".concat(this.workpath, "/").concat(url) : url);
        var ext = url.split('.').pop().toLowerCase();
        var isVideo = exports.TextureVideoExtensions.indexOf(ext) !== -1;
        var element;
        var promise;

        if (isVideo) {
          logger_1.default.log('GlslCanvas.setUrl video', src);
          element = document.createElement('video'); // new HTMLVideoElement();

          element.setAttribute('preload', 'auto'); // element.setAttribute('autoplay', 'true');

          element.setAttribute('loop', 'true');
          element.setAttribute('muted', 'true');
          element.setAttribute('playsinline', 'true'); // element.autoplay = true;

          element.loop = true;
          element.muted = true;
          /*
          if (!(Texture.isSafari() && /(?<!http|https):\//.test(url))) {
              element.crossOrigin = 'anonymous';
          }
          */

          promise = this.setElement(gl, element, options);
          element.src = src;
          element.addEventListener('canplay', function () {
            element.play();
          });
        } else {
          logger_1.default.log('GlslCanvas.setUrl image', src);
          element = document.createElement('img'); // new HTMLImageElement();

          promise = this.setElement(gl, element, options);

          if (!(Texture.isSafari() && url.slice(0, 5) === 'data:')) {
            element.crossOrigin = 'anonymous';
          }

          element.src = src;
        }

        return promise;
      }
    }, {
      key: "setElement",
      value: function setElement(gl, element) {
        var _this2 = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        this.options = Object.assign(this.options, options);
        return new Promise(function (resolve, reject) {
          var originalElement = element; // a string element is interpeted as a CSS selector

          if (typeof element === 'string') {
            element = document.querySelector(element);
          }

          if (element instanceof HTMLCanvasElement || element instanceof HTMLImageElement || element instanceof HTMLVideoElement) {
            _this2.source = element;
            _this2.sourceType = TextureSourceType.Element;

            if (element instanceof HTMLVideoElement) {
              var video = element;
              video.addEventListener('loadeddata', function (event) {
                _this2.update(gl, options);

                _this2.setFiltering(gl, options);

                resolve(_this2);
              });
              video.addEventListener('error', function (error) {
                reject(error);
              });
            } else if (element instanceof HTMLImageElement) {
              element.addEventListener('load', function () {
                _this2.update(gl, options);

                _this2.setFiltering(gl, options);

                resolve(_this2);
              });
              element.addEventListener('error', function (error) {
                reject(error);
              });
            } else {
              _this2.update(gl, options);

              _this2.setFiltering(gl, options);

              resolve(_this2);
            }
          } else {
            var message = "the 'element' parameter (`element: ".concat(JSON.stringify(originalElement), "`) must be a CSS selector string, or a <canvas>, <image> or <video> object");
            logger_1.default.log("Texture '".concat(_this2.key, "': ").concat(message), options);
            reject(message);
          }
        });
      }
    }, {
      key: "setData",
      value: function setData(gl, width, height, data) {
        var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
        this.width = width;
        this.height = height;
        this.options = Object.assign(this.options, options);
        this.source = data;
        this.sourceType = TextureSourceType.Data;
        this.update(gl, options);
        this.setFiltering(gl, options);
        return Promise.resolve(this);
      } // Uploads current image or buffer to the GPU (can be used to update animated textures on the fly)

    }, {
      key: "update",
      value: function update(gl, options) {
        if (!this.valid) {
          return;
        }

        gl.activeTexture(gl.TEXTURE0 + this.index);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.UNPACK_FLIP_Y_WEBGL === false ? 0 : 1);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.UNPACK_PREMULTIPLY_ALPHA_WEBGL || 0);

        if (this.sourceType === TextureSourceType.Element) {
          if (this.source instanceof HTMLImageElement && this.source.naturalWidth && this.source.naturalHeight) {
            this.width = this.source.naturalWidth;
            this.height = this.source.naturalHeight;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
          } else if (this.source instanceof HTMLVideoElement && this.source.videoWidth && this.source.videoHeight) {
            this.width = this.source.videoWidth;
            this.height = this.source.videoHeight;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
          } else if (this.source instanceof HTMLCanvasElement) {
            this.width = this.source.width;
            this.height = this.source.height;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
          }
        } else if (this.sourceType === TextureSourceType.Data) {
          var imageBuffer = this.source;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageBuffer);
        }

        this.trigger('loaded', this);
      }
    }, {
      key: "tryUpdate",
      value: function tryUpdate(gl) {
        var dirty = false;

        if (this.animated) {
          dirty = true;
          this.update(gl, this.options);
        }

        return dirty;
      }
    }, {
      key: "destroy",
      value: function destroy(gl) {
        if (!this.valid) {
          return;
        }

        gl.deleteTexture(this.texture);
        this.texture = null;
        delete this.source;
        this.source = null;
        this.valid = false;
      }
    }, {
      key: "setFiltering",
      value: function setFiltering(gl, options) {
        if (!this.valid) {
          return;
        }

        var powerOf2 = Texture.isPowerOf2(this.width) && Texture.isPowerOf2(this.height);
        var filtering = options.filtering || TextureFilteringType.MipMap;
        var wrapS = options.TEXTURE_WRAP_S || (options.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        var wrapT = options.TEXTURE_WRAP_T || (options.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);

        if (!powerOf2) {
          filtering = filtering === TextureFilteringType.MipMap ? TextureFilteringType.Linear : filtering;
          wrapS = wrapT = gl.CLAMP_TO_EDGE;

          if (options.repeat || options.TEXTURE_WRAP_S || options.TEXTURE_WRAP_T) {
            logger_1.default.warn("GlslCanvas: cannot repeat texture ".concat(options.url, " cause is not power of 2."));
          }
        }

        this.powerOf2 = powerOf2;
        this.filtering = filtering; // this.bindTexture();
        // WebGL has strict requirements on non-power-of-2 textures:
        // No mipmaps and must clamp to edge
        // For power-of-2 textures, the following presets are available:
        // mipmap: linear blend from nearest mip
        // linear: linear blend from original image (no mips)
        // nearest: nearest pixel from original image (no mips, 'blocky' look)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        if (this.filtering === TextureFilteringType.MipMap) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // TODO: use trilinear filtering by defualt instead?

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.generateMipmap(gl.TEXTURE_2D);
        } else if (this.filtering === TextureFilteringType.Nearest) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else if (this.filtering === TextureFilteringType.Linear) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
      }
    }], [{
      key: "isPowerOf2",
      value: function isPowerOf2(value) {
        return (value & value - 1) === 0;
      }
    }, {
      key: "isSafari",
      value: function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      }
    }, {
      key: "isTextureUrl",
      value: function isTextureUrl(text) {
        return /\.(jpg|jpeg|png|ogv|webm|mp4)$/i.test(text);
      }
    }, {
      key: "isTexture",
      value: function isTexture(urlElementOrData) {
        var options = Texture.getTextureOptions(urlElementOrData);
        return options !== undefined;
      }
    }, {
      key: "getMaxTextureSize",
      value: function getMaxTextureSize(gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
      }
    }, {
      key: "getTextureOptions",
      value: function getTextureOptions(urlElementOrData) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (typeof urlElementOrData === 'string' && urlElementOrData !== '') {
          if (Texture.isTextureUrl(urlElementOrData)) {
            options.url = urlElementOrData;
            return options;
          }

          if (document) {
            urlElementOrData = document.querySelector(urlElementOrData); // Logger.log(urlElementOrData);
          }
        }

        if (urlElementOrData instanceof HTMLCanvasElement || urlElementOrData instanceof HTMLImageElement || urlElementOrData instanceof HTMLVideoElement) {
          options.element = urlElementOrData;
          return options;
        } else if (urlElementOrData instanceof TextureData) {
          options.data = urlElementOrData.data;
          options.width = urlElementOrData.width;
          options.height = urlElementOrData.height;
          return options;
        }
      }
    }]);

    return Texture;
  }(subscriber_1.default);

  exports.Texture = Texture;

  var Textures =
  /*#__PURE__*/
  function (_iterable_1$default) {
    _inherits(Textures, _iterable_1$default);

    function Textures() {
      var _this3;

      _classCallCheck(this, Textures);

      _this3 = _possibleConstructorReturn(this, _getPrototypeOf(Textures).apply(this, arguments));
      _this3.count = 0;
      _this3.dirty = false;
      _this3.animated = false;
      return _this3;
    }

    _createClass(Textures, [{
      key: "clean",
      value: function clean() {
        for (var key in this.values) {
          this.values[key].dirty = false;
        }

        this.dirty = false;
      }
    }, {
      key: "createOrUpdate",
      value: function createOrUpdate(gl, key, urlElementOrData) {
        var _this4 = this;

        var index = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
        var workpath = arguments.length > 5 ? arguments[5] : undefined;
        var texture;
        var textureOptions = Texture.getTextureOptions(urlElementOrData, options);
        texture = this.get(key);

        if (!texture) {
          texture = new Texture(gl, key, index + this.count, textureOptions, workpath);
          this.count++;
          this.set(key, texture);
        }

        if (textureOptions !== undefined) {
          return texture.load(gl, textureOptions).then(function (texture) {
            if (texture.source instanceof HTMLVideoElement) {
              var video = texture.source; // Logger.log('video', video);

              video.addEventListener('play', function () {
                // Logger.log('play', texture.key);
                texture.animated = true;
                _this4.animated = true;
              });
              video.addEventListener('pause', function () {
                // Logger.log('pause', texture.key);
                texture.animated = false;
                _this4.animated = _this4.reduce(function (flag, texture) {
                  return flag || texture.animated;
                }, false);
              });
              video.addEventListener('seeked', function () {
                // Logger.log('seeked');
                texture.update(gl, texture.options);
                _this4.dirty = true;
              }); // Logger.log('video');

              /*
              video.addEventListener('canplaythrough', () => {
                  // !!!
                  this.intervalID = setInterval(() => {
                      this.update(gl, options);
                  }, 15);
              }, true);
              video.addEventListener('ended', () => {
                  video.currentTime = 0;
                  video.play();
              }, true);
              */
            }

            return texture;
          });
        } else {
          return Promise.resolve(texture);
        }
      }
    }]);

    return Textures;
  }(iterable_1.default);

  exports.default = Textures;
});

},{"./iterable":8,"./logger":9,"./subscriber":10}],12:[function(require,module,exports){
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./iterable", "./logger", "./textures"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var iterable_1 = __importDefault(require("./iterable"));

  var logger_1 = __importDefault(require("./logger"));

  var textures_1 = require("./textures");

  var UniformMethod;

  (function (UniformMethod) {
    UniformMethod[UniformMethod["Unknown"] = 0] = "Unknown";
    UniformMethod["Uniform1i"] = "uniform1i"; // Uniform1i  = 'uniform1i', // (boolUniformLoc,   v);                // for bool
    // Uniform1i  = 'uniform1i', // (sampler2DUniformLoc,   v);           // for sampler2D
    // Uniform1i  = 'uniform1i', // (samplerCubeUniformLoc,   v);         // for samplerCube

    UniformMethod["Uniform2i"] = "uniform2i";
    UniformMethod["Uniform3i"] = "uniform3i";
    UniformMethod["Uniform4i"] = "uniform4i";
    UniformMethod["Uniform1f"] = "uniform1f";
    UniformMethod["Uniform2f"] = "uniform2f";
    UniformMethod["Uniform3f"] = "uniform3f";
    UniformMethod["Uniform4f"] = "uniform4f"; //

    UniformMethod["Uniform1iv"] = "uniform1iv"; // Uniform1iv = 'uniform1iv', // (boolUniformLoc, [v]);                // for bool or bool array
    // Uniform1iv = 'uniform1iv', // (sampler2DUniformLoc, [v]);           // for sampler2D or sampler2D array
    // Uniform1iv = 'uniform1iv', // (samplerCubeUniformLoc, [v]);         // for samplerCube or samplerCube array

    UniformMethod["Uniform2iv"] = "uniform2iv";
    UniformMethod["Uniform3iv"] = "uniform3iv";
    UniformMethod["Uniform4iv"] = "uniform4iv"; //

    UniformMethod["Uniform1fv"] = "uniform1fv";
    UniformMethod["Uniform2fv"] = "uniform2fv";
    UniformMethod["Uniform3fv"] = "uniform3fv";
    UniformMethod["Uniform4fv"] = "uniform4fv"; //

    UniformMethod["UniformMatrix2fv"] = "uniformMatrix2fv";
    UniformMethod["UniformMatrix3fv"] = "uniformMatrix3fv";
    UniformMethod["UniformMatrix4fv"] = "uniformMatrix4fv";
  })(UniformMethod = exports.UniformMethod || (exports.UniformMethod = {}));

  var UniformType;

  (function (UniformType) {
    UniformType[UniformType["Unknown"] = 0] = "Unknown";
    UniformType[UniformType["Float"] = 1] = "Float";
    UniformType[UniformType["Int"] = 2] = "Int";
    UniformType[UniformType["Bool"] = 3] = "Bool";
    UniformType[UniformType["Sampler2D"] = 4] = "Sampler2D";
    UniformType[UniformType["SamplerCube"] = 5] = "SamplerCube";
    UniformType[UniformType["Matrix2fv"] = 6] = "Matrix2fv";
    UniformType[UniformType["Matrix3fv"] = 7] = "Matrix3fv";
    UniformType[UniformType["Matrix4fv"] = 8] = "Matrix4fv";
  })(UniformType = exports.UniformType || (exports.UniformType = {}));

  var METHODS_INT = [UniformMethod.Uniform1i, UniformMethod.Uniform2i, UniformMethod.Uniform3i, UniformMethod.Uniform4i];
  var METHODS_FLOAT = [UniformMethod.Uniform1f, UniformMethod.Uniform2f, UniformMethod.Uniform3f, UniformMethod.Uniform4f];
  var METHODS_INTV = [UniformMethod.Uniform1iv, UniformMethod.Uniform2iv, UniformMethod.Uniform3iv, UniformMethod.Uniform4iv];
  var METHODS_FLOATV = [UniformMethod.Uniform1fv, UniformMethod.Uniform2fv, UniformMethod.Uniform3fv, UniformMethod.Uniform4fv];

  var Uniform = function Uniform(options) {
    var _this = this;

    _classCallCheck(this, Uniform);

    this.dirty = true;

    if (options) {
      Object.assign(this, options);
    }

    this.apply = function (gl, program) {
      if (_this.dirty) {
        gl.useProgram(program);
        var location = gl.getUniformLocation(program, _this.key); // Logger.log(this.key, this.method, this.values);
        // (gl as any)[this.method].apply(gl, [location].concat(this.values));

        gl[_this.method].apply(gl, [location].concat(_this.values));
      }
    };
  };

  exports.Uniform = Uniform;

  var UniformTexture =
  /*#__PURE__*/
  function (_Uniform) {
    _inherits(UniformTexture, _Uniform);

    function UniformTexture(options) {
      _classCallCheck(this, UniformTexture);

      return _possibleConstructorReturn(this, _getPrototypeOf(UniformTexture).call(this, options));
    }

    return UniformTexture;
  }(Uniform);

  exports.UniformTexture = UniformTexture;

  var Uniforms =
  /*#__PURE__*/
  function (_iterable_1$default) {
    _inherits(Uniforms, _iterable_1$default);

    function Uniforms() {
      var _this2;

      _classCallCheck(this, Uniforms);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(Uniforms).apply(this, arguments));
      _this2.dirty = false;
      return _this2;
    }
    /*
    // slow
    static isDifferent(a: any, b: any): boolean {
        return JSON.stringify(a) !== JSON.stringify(b);
    }
    */


    _createClass(Uniforms, [{
      key: "create",
      value: function create(method, type, key, values) {
        var uniform = new Uniform({
          method: method,
          type: type,
          key: key,
          values: values
        });
        this.set(key, uniform);
        this.dirty = true;
        return uniform;
      }
    }, {
      key: "createTexture",
      value: function createTexture(key, index) {
        var uniform;

        if (key.indexOf(']') !== -1) {
          uniform = new UniformTexture({
            method: UniformMethod.Uniform1iv,
            type: UniformType.Sampler2D,
            key: key,
            values: [[index]]
          });
        } else {
          uniform = new UniformTexture({
            method: UniformMethod.Uniform1i,
            type: UniformType.Sampler2D,
            key: key,
            values: [index]
          });
        }

        this.set(key, uniform);
        this.dirty = true;
        return uniform;
      }
    }, {
      key: "update",
      value: function update(method, type, key, values) {
        var uniform = this.get(key);

        if (uniform && (uniform.method !== method || uniform.type !== type || Uniforms.isDifferent(uniform.values, values))) {
          uniform.method = method;
          uniform.type = type;
          uniform.values = values;
          uniform.dirty = true;
          this.dirty = true;
        }
      }
    }, {
      key: "createOrUpdate",
      value: function createOrUpdate(method, type, key, values) {
        if (this.has(key)) {
          this.update(method, type, key, values);
        } else {
          this.create(method, type, key, values);
        }
      }
    }, {
      key: "apply",
      value: function apply(gl, program) {
        for (var key in this.values) {
          // if (typeof this.values[key].apply === 'function') {
          this.values[key].apply(gl, program); // }
        } // this.forEach(uniform => uniform.apply(gl, program));

      }
    }, {
      key: "clean",
      value: function clean() {
        for (var key in this.values) {
          this.values[key].dirty = false;
        }

        this.dirty = false;
      }
    }], [{
      key: "isDifferent",
      value: function isDifferent(a, b) {
        return a.length !== b.length || a.reduce(function (f, v, i) {
          return f || v !== b[i];
        }, false);
      }
    }, {
      key: "isArrayOfInteger",
      value: function isArrayOfInteger(array) {
        return array.reduce(function (flag, value) {
          return flag && Number.isInteger(value);
        }, true);
      }
    }, {
      key: "isArrayOfNumber",
      value: function isArrayOfNumber(array) {
        return array.reduce(function (flag, value) {
          return flag && typeof value === 'number';
        }, true);
      }
    }, {
      key: "isArrayOfBoolean",
      value: function isArrayOfBoolean(array) {
        return array.reduce(function (flag, value) {
          return flag && typeof value === 'boolean';
        }, true);
      }
    }, {
      key: "isArrayOfTexture",
      value: function isArrayOfTexture(array) {
        return array.reduce(function (flag, value) {
          return flag && textures_1.Texture.isTexture(value);
        }, true);
      }
    }, {
      key: "isArrayOfSampler2D",
      value: function isArrayOfSampler2D(array) {
        return array.reduce(function (flag, value) {
          return flag && value.type === UniformType.Sampler2D;
        }, true);
      }
    }, {
      key: "getType_",
      value: function getType_(values) {
        var type = UniformType.Unknown;
        var isVector = values.length === 1 && Array.isArray(values[0]);
        var subject = isVector ? values[0] : values;

        if (Uniforms.isArrayOfNumber(subject)) {
          type = UniformType.Float;
        } else if (Uniforms.isArrayOfBoolean(subject)) {
          type = UniformType.Bool;
        } else if (Uniforms.isArrayOfTexture(subject)) {
          type = UniformType.Sampler2D;
        }

        return type;
      }
    }, {
      key: "getMethod_",
      value: function getMethod_(type, values) {
        var method = UniformMethod.Unknown;
        var isVector = values.length === 1 && Array.isArray(values[0]);
        var subject = isVector ? values[0] : values;
        var length = subject.length;
        var i = length - 1;

        switch (type) {
          case UniformType.Float:
            if (isVector) {
              method = i < METHODS_FLOATV.length ? METHODS_FLOATV[i] : UniformMethod.Unknown;
            } else {
              method = i < METHODS_FLOAT.length ? METHODS_FLOAT[i] : UniformMethod.Uniform1fv;
            }

            break;

          case UniformType.Int:
          case UniformType.Bool:
            if (isVector) {
              method = i < METHODS_INTV.length ? METHODS_INTV[i] : UniformMethod.Unknown;
            } else {
              method = i < METHODS_INT.length ? METHODS_INT[i] : UniformMethod.Uniform1iv;
            }

            break;

          case UniformType.Sampler2D:
            if (isVector) {
              method = UniformMethod.Uniform1iv;
            } else {
              method = length === 1 ? UniformMethod.Uniform1i : UniformMethod.Uniform1iv;
            }

            break;
        }

        return method;
      }
    }, {
      key: "parseUniform",
      value: function parseUniform(key, values) {
        var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var uniform;
        type = type || Uniforms.getType_(values);
        var method = Uniforms.getMethod_(type, values);

        if (type !== UniformType.Unknown && method !== UniformMethod.Unknown) {
          // Logger.log('Uniforms.parseUniform', key, UniformType[type], method, values);
          if (type === UniformType.Sampler2D && method === UniformMethod.Uniform1iv) {
            return values[0].map(function (texture, index) {
              return new Uniform({
                method: method,
                type: type,
                key: "".concat(key, "[").concat(index, "]"),
                values: [texture]
              });
            });
          } else {
            uniform = new Uniform({
              method: method,
              type: type,
              key: key,
              values: values
            });
          }
        } else {
          logger_1.default.error('Uniforms.parseUniform.Unknown', key, values);
        } // return this.parseUniform__bak(key, values);


        return uniform;
      }
    }]);

    return Uniforms;
  }(iterable_1.default);

  exports.default = Uniforms;
});

},{"./iterable":8,"./logger":9,"./textures":11}]},{},[7]);
