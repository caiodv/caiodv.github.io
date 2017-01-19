(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var JSONLoader, ReceiverMain, SignalReceiver, Socket,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

JSONLoader = require('./net/JsonLoader');

Socket = require('./net/Socket');

SignalReceiver = require('./media/SignalReceiver');

console.log('hey');

ReceiverMain = (function() {
  function ReceiverMain() {
    this._onSignal = bind(this._onSignal, this);
    this._startReceiving = bind(this._startReceiving, this);
    this._onLoaded = bind(this._onLoaded, this);
    console.log('start');
    this._loadConfig();
  }

  ReceiverMain.prototype._loadConfig = function() {
    JSONLoader.load('data/config.json', this._onLoaded);
    return false;
  };

  ReceiverMain.prototype._onLoaded = function(e, data) {
    var bt;
    this._config = data;
    console.log('loaded');
    this._label = document.getElementById('label');
    this._receiver = new SignalReceiver(this._config['signal']);
    this._receiver.on(SignalReceiver.SIGNAL_RECEIVED, this._onSignal);
    bt = document.getElementById('bt');
    return bt.addEventListener('click', this._startReceiving);
  };

  ReceiverMain.prototype._startReceiving = function() {
    return this._receiver.receiveSignal();
  };

  ReceiverMain.prototype._onSignal = function(e, data) {
    if (data.message.length === 4) {
      this._label.innerHTML += data.message + ' ';
    }
    return false;
  };

  return ReceiverMain;

})();

window.onload = (function(_this) {
  return function() {
    var app;
    return app = new ReceiverMain();
  };
})(this);


},{"./media/SignalReceiver":4,"./net/JsonLoader":5,"./net/Socket":6}],2:[function(require,module,exports){
var EventDispatcher,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

EventDispatcher = (function() {
  function EventDispatcher() {
    this._triggerStacked = bind(this._triggerStacked, this);
    this.trigger = bind(this.trigger, this);
  }

  EventDispatcher.prototype._events = null;

  EventDispatcher.prototype.on = function(p_event, p_handler) {
    if (!this._events) {
      this._events = {};
    }
    if (!this._events[p_event]) {
      this._events[p_event] = [];
    }
    if (!(indexOf.call(this._events[p_event], p_handler) >= 0)) {
      return this._events[p_event].unshift(p_handler);
    }
  };

  EventDispatcher.prototype.off = function(p_event, p_handler) {
    var events, i;
    if (p_event == null) {
      p_event = null;
    }
    if (p_handler == null) {
      p_handler = null;
    }
    if (!this._events) {
      this._events = {};
      return;
    }
    if ((p_event != null) && Boolean(this._events[p_event])) {
      events = this._events[p_event];
      if (!p_handler) {
        return this._events[p_event].length = 0;
      } else {
        while ((i = events.indexOf(p_handler)) >= 0) {
          events.splice(i, 1);
        }
        return this._events[p_event] = events;
      }
    } else {
      return this._events = {};
    }
  };

  EventDispatcher.prototype.trigger = function(evt, data, target, sourceEvent) {
    var e, events, i, j, k, len, results, v;
    if (data == null) {
      data = null;
    }
    if (target == null) {
      target = null;
    }
    if (sourceEvent == null) {
      sourceEvent = null;
    }
    if (Array.isArray(evt)) {
      for (j = 0, len = evt.length; j < len; j++) {
        e = evt[j];
        this.trigger(evt, data);
      }
      return;
    }
    if (!this._events) {
      this._events = {};
    }
    events = this._events[evt];
    if (!events || events.length === 0) {
      return;
    }
    if (!target) {
      target = this;
    }
    e = {
      type: evt,
      target: target,
      currentTarget: this,
      originalEvent: sourceEvent
    };
    if (sourceEvent != null) {
      e.preventDefault = function() {
        return typeof sourceEvent.preventDefault === "function" ? sourceEvent.preventDefault() : void 0;
      };
      e.stopPropagation = function() {
        return typeof sourceEvent.stopPropagation === "function" ? sourceEvent.stopPropagation() : void 0;
      };
    }
    if (typeof data === 'object') {
      for (k in data) {
        v = data[k];
        if (!e[k]) {
          e[k] = v;
        }
      }
    }
    i = events.length;
    results = [];
    while (i-- > 0) {
      results.push(typeof events[i] === "function" ? events[i](e, data) : void 0);
    }
    return results;
  };

  EventDispatcher.prototype.hasEvent = function(p_event, p_handler) {
    var event;
    if (!this._events) {
      this._events = {};
      return;
    }
    for (event in this._events) {
      if (event === p_event) {
        if (this._events[event].indexOf(p_handler) > -1) {
          return true;
        }
      }
    }
    return false;
  };

  EventDispatcher.prototype.stackTrigger = function(evt, data, target) {
    if (data == null) {
      data = null;
    }
    if (target == null) {
      target = null;
    }
    if (!this._stackTriggerer) {
      this._stackTriggerer = [];
    }
    this._stackTriggerer.push([evt, data, target]);
    clearTimeout(this._stackTriggerTimeout);
    return this._stackTriggerTimeout = setTimeout(this._triggerStacked, 0);
  };

  EventDispatcher.prototype._triggerStacked = function() {
    var i, l;
    l = this._stackTriggerer.length;
    i = -1;
    while (++i < l) {
      this.trigger.apply(this, this._stackTriggerer[i]);
    }
    return this._stackTriggerer.length = 0;
  };

  return EventDispatcher;

})();

module.exports = EventDispatcher;


},{}],3:[function(require,module,exports){
var EventDispatcher,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

EventDispatcher = (function() {
  function EventDispatcher() {
    this._triggerStacked = bind(this._triggerStacked, this);
    this.trigger = bind(this.trigger, this);
  }

  EventDispatcher.prototype._events = null;

  EventDispatcher.prototype.on = function(p_event, p_handler) {
    if (!this._events) {
      this._events = {};
    }
    if (!this._events[p_event]) {
      this._events[p_event] = [];
    }
    if (!(indexOf.call(this._events[p_event], p_handler) >= 0)) {
      return this._events[p_event].unshift(p_handler);
    }
  };

  EventDispatcher.prototype.off = function(p_event, p_handler) {
    var events, i;
    if (p_event == null) {
      p_event = null;
    }
    if (p_handler == null) {
      p_handler = null;
    }
    if (!this._events) {
      this._events = {};
      return;
    }
    if ((p_event != null) && Boolean(this._events[p_event])) {
      events = this._events[p_event];
      if (!p_handler) {
        return this._events[p_event].length = 0;
      } else {
        while ((i = events.indexOf(p_handler)) >= 0) {
          events.splice(i, 1);
        }
        return this._events[p_event] = events;
      }
    } else {
      return this._events = {};
    }
  };

  EventDispatcher.prototype.trigger = function(evt, data, target, sourceEvent) {
    var e, events, i, j, k, len, results, v;
    if (data == null) {
      data = null;
    }
    if (target == null) {
      target = null;
    }
    if (sourceEvent == null) {
      sourceEvent = null;
    }
    if (Array.isArray(evt)) {
      for (j = 0, len = evt.length; j < len; j++) {
        e = evt[j];
        this.trigger(evt, data);
      }
      return;
    }
    if (!this._events) {
      this._events = {};
    }
    events = this._events[evt];
    if (!events || events.length === 0) {
      return;
    }
    if (!target) {
      target = this;
    }
    e = {
      type: evt,
      target: target,
      currentTarget: this,
      originalEvent: sourceEvent
    };
    if (sourceEvent != null) {
      e.preventDefault = function() {
        return typeof sourceEvent.preventDefault === "function" ? sourceEvent.preventDefault() : void 0;
      };
      e.stopPropagation = function() {
        return typeof sourceEvent.stopPropagation === "function" ? sourceEvent.stopPropagation() : void 0;
      };
    }
    if (typeof data === 'object') {
      for (k in data) {
        v = data[k];
        if (!e[k]) {
          e[k] = v;
        }
      }
    }
    i = events.length;
    results = [];
    while (i-- > 0) {
      results.push(typeof events[i] === "function" ? events[i](e, data) : void 0);
    }
    return results;
  };

  EventDispatcher.prototype.hasEvent = function(p_event, p_handler) {
    var event;
    if (!this._events) {
      this._events = {};
      return;
    }
    for (event in this._events) {
      if (event === p_event) {
        if (this._events[event].indexOf(p_handler) > -1) {
          return true;
        }
      }
    }
    return false;
  };

  EventDispatcher.prototype.stackTrigger = function(evt, data, target) {
    if (data == null) {
      data = null;
    }
    if (target == null) {
      target = null;
    }
    if (!this._stackTriggerer) {
      this._stackTriggerer = [];
    }
    this._stackTriggerer.push([evt, data, target]);
    clearTimeout(this._stackTriggerTimeout);
    return this._stackTriggerTimeout = setTimeout(this._triggerStacked, 0);
  };

  EventDispatcher.prototype._triggerStacked = function() {
    var i, l;
    l = this._stackTriggerer.length;
    i = -1;
    while (++i < l) {
      this.trigger.apply(this, this._stackTriggerer[i]);
    }
    return this._stackTriggerer.length = 0;
  };

  return EventDispatcher;

})();

module.exports = EventDispatcher;


},{}],4:[function(require,module,exports){
var EventDispatcher, NumberUtils, SignalReceiver,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NumberUtils = require('../utils/NumberUtils');

EventDispatcher = require('../events/eventdispatcher');

if (!navigator.getUserMedia) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
}

SignalReceiver = (function(superClass) {
  extend(SignalReceiver, superClass);

  SignalReceiver.SIGNAL_RECEIVED = 'signalReceivedSignalReceiver';

  function SignalReceiver(_config) {
    this._config = _config;
    this._listen = bind(this._listen, this);
    this._successGetUserMedia = bind(this._successGetUserMedia, this);
    this._notAllowed = bind(this._notAllowed, this);
    this._high = this._config['high']['freq'] || 19000;
    this._low = this._config['low']['freq'] || 17000;
    this._highPeak = this._config['high']['peak'] || -65;
    this._lowPeak = this._config['low']['peak'] || -65;
    this._baseInterval = this._config['baseInterval'] || 50;
    this._iterations = this._config['iterations'] || 4;
    this._context = new AudioContext();
    this._fftSize = 2048;
    this._analyser = this._context.createAnalyser();
    this._analyser.smoothingTimeConstant = 0;
    this._analyser.fftSize = this._fftSize;
    this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
    this._freqFData = new Float32Array(this._analyser.frequencyBinCount);
    this._data = [];
  }

  SignalReceiver.prototype.receiveSignal = function() {
    return navigator.getUserMedia({
      audio: true
    }, this._successGetUserMedia, this._notAllowed);
  };

  SignalReceiver.prototype.stopListening = function() {
    this._stream.getAudioTracks()[0].stop();
    return window.cancelAnimationFrame(this._raf);
  };

  SignalReceiver.prototype._notAllowed = function() {
    return console.log('no mic access');
  };

  SignalReceiver.prototype._successGetUserMedia = function(_stream) {
    var sr;
    this._stream = _stream;
    console.log('got mic');
    this._audioInput = this._context.createMediaStreamSource(this._stream);
    this._audioInput.connect(this._analyser);
    this._data = [];
    sr = this._context.sampleRate;
    this._freqBin = sr / this._fftSize;
    this._nH = ~~(this._high / this._freqBin);
    this._nL = ~~(this._low / this._freqBin);
    this._raf = window.requestAnimationFrame(this._listen);
    return setTimeout((function(_this) {
      return function() {
        console.log('stop');
        _this.stopListening();
        return _this._analyseData();
      };
    })(this), 10000);
  };

  SignalReceiver.prototype._listen = function() {
    var data, i, j, len, ref;
    this._analyser.getFloatFrequencyData(this._freqFData);
    ref = this._freqFData;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      data = ref[i];
      if ((data > this._lowPeak && this._nL === i) || (data > this._highPeak && this._nH === i)) {
        console.log('push', i * this._freqBin);
        this._data.push({
          freq: i * this._freqBin,
          time: Date.now()
        });
      }
    }
    return this._raf = window.requestAnimationFrame(this._listen);
  };

  SignalReceiver.prototype._analyseData = function() {
    var data, dt, j, lastF, lastT, len, message, ref, results, sameF;
    lastT = null;
    lastF = null;
    message = '';
    ref = this._data;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      data = ref[j];
      if ((lastT != null) && (lastF != null)) {
        dt = data['time'] - lastT;
        sameF = lastF === data['freq'];
        if (dt >= 1000 || data === this._data[this._data.length - 1]) {
          message += Math.abs(this._high - lastF) < Math.abs(this._low - lastF) ? '1' : '0';
          this.trigger(SignalReceiver.SIGNAL_RECEIVED, {
            message: NumberUtils.fromBin(message)
          });
          message = '';
          lastT = null;
          lastF = null;
        }
        if (dt > this._baseInterval * 0.5) {
          message += Math.abs(this._high - lastF) < Math.abs(this._low - lastF) ? '1' : '0';
        }
      }
      lastT = data['time'];
      results.push(lastF = data['freq']);
    }
    return results;
  };

  return SignalReceiver;

})(EventDispatcher);

module.exports = SignalReceiver;


},{"../events/eventdispatcher":3,"../utils/NumberUtils":7}],5:[function(require,module,exports){
var EventDispatcher, JsonLoader,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventDispatcher = require('../events/EventDispatcher');

JsonLoader = (function(superClass) {
  extend(JsonLoader, superClass);

  JsonLoader.LOADED = 'jsonLoader_loaded';

  JsonLoader.load = function(src, callback, data) {
    var jsonLoader;
    if (data == null) {
      data = null;
    }
    jsonLoader = new JsonLoader(src, null, data);
    if (callback) {
      jsonLoader.on(JsonLoader.LOADED, callback);
    }
    return jsonLoader;
  };

  function JsonLoader(src, method, data) {
    if (src == null) {
      src = null;
    }
    if (method == null) {
      method = 'GET';
    }
    if (data == null) {
      data = null;
    }
    this._loaded = bind(this._loaded, this);
    this.load = bind(this.load, this);
    this.data = data;
    this._request = new XMLHttpRequest();
    this._request.addEventListener('load', this._loaded);
    this._method = method;
    if (src) {
      setTimeout(this.load, 0, src);
    }
  }

  JsonLoader.prototype.load = function(src) {
    this._request.open(this._method, src, true);
    return this._request.send();
  };

  JsonLoader.prototype._loaded = function(e) {
    var data;
    if (this._request.readyState === 4) {
      data = this._request.responseText;
      data = data.replace(/^\s*\/\/.*?$/gm, '');
      this.response = JSON.parse(data);
      this.trigger(JsonLoader.LOADED, this.response);
      this._request.removeEventListener('load', this._loaded);
      return this.off();
    }
  };

  return JsonLoader;

})(EventDispatcher);

module.exports = JsonLoader;


},{"../events/EventDispatcher":2}],6:[function(require,module,exports){
var EventDispatcher, Socket,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventDispatcher = require('../events/eventdispatcher');

Socket = (function(superClass) {
  extend(Socket, superClass);

  Socket.CLIENT_CONNECT = 'clientConnectSocket';

  Socket.CLIENT_CLOSE = 'clientCloseSocket';

  function Socket(_address, _port, _type) {
    this._address = _address;
    this._port = _port;
    this._type = _type != null ? _type : null;
    this._wsReturn = bind(this._wsReturn, this);
    this._onSocketClose = bind(this._onSocketClose, this);
    this._onSocketOpen = bind(this._onSocketOpen, this);
    this.setClientId = bind(this.setClientId, this);
    this.idClientSocket = Math.random() * (99999999999999999999 - 1) + 1;
    console.log('@idClientSocket', this.idClientSocket);
    this._socket = null;
    this._open = false;
    false;
  }

  Socket.prototype.start = function() {
    this.stop();
    this._socket = new WebSocket(this._address + ":" + this._port);
    if (this._type != null) {
      this._socket.binaryType = 'arraybuffer';
    }
    this._socket.onopen = this._onSocketOpen;
    this._socket.onmessage = this._wsReturn;
    this._socket.onclose = this._onSocketClose;
  };

  Socket.prototype.send = function(p_data) {
    var e;
    if (this._open) {
      try {
        this._socket.send(p_data);
      } catch (error) {
        e = error;
        console.log('error send:', e);
      }
    }
    return false;
  };

  Socket.prototype.stop = function() {
    if (this._open) {
      return this._socket.close();
    }
  };

  Socket.prototype.setClientId = function() {
    var data, e;
    try {
      data = {
        type: 'handshake',
        data: this.idClientSocket
      };
      this._socket.send(JSON.stringify(data));
      return this.trigger(Socket.CLIENT_CONNECT);
    } catch (error) {
      e = error;
      console.log('couldnt connect, trying again in 10ms', e);
      return setTimeout(this.setClientId, 10);
    }
  };

  Socket.prototype._onSocketOpen = function(e) {
    console.log('socket open');
    this._open = true;
    this.setClientId();
    return false;
  };

  Socket.prototype._onSocketClose = function(e) {
    this._open = false;
    this.trigger(Socket.CLIENT_CLOSE);
    return false;
  };

  Socket.prototype._wsReturn = function(e) {
    return console.log(e.data);
  };

  return Socket;

})(EventDispatcher);

module.exports = Socket;


},{"../events/eventdispatcher":3}],7:[function(require,module,exports){
var NumberUtils;

NumberUtils = (function() {
  function NumberUtils() {}

  NumberUtils.toBin = function(p_n) {
    return 0 + p_n.toString(2);
  };

  NumberUtils.fromBin = function(p_n) {
    return parseInt(p_n, 2).toString(10);
  };

  return NumberUtils;

})();

module.exports = NumberUtils;


},{}]},{},[1]);
