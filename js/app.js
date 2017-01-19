(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AudioSignal, JSONLoader, Main, Socket,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

JSONLoader = require('./net/JsonLoader');

Socket = require('./net/Socket');

AudioSignal = require('./media/AudioSignal');

Main = (function() {
  function Main() {
    this._closeSocket = bind(this._closeSocket, this);
    this._sendSignal = bind(this._sendSignal, this);
    this._onLoaded = bind(this._onLoaded, this);
    this._loadConfig();
  }

  Main.prototype._loadConfig = function() {
    JSONLoader.load('data/config.json', this._onLoaded);
    return false;
  };

  Main.prototype._onLoaded = function(e, data) {
    var bt;
    this._config = data;
    this._socket = new Socket(this._config['socket'], this._config['port']);
    this._signal = new AudioSignal(this._config['signal']);
    this._inputN = document.getElementById('inputN');
    bt = document.getElementById('bt');
    bt.addEventListener('click', this._sendSignal);
    window.onbeforeunload = this._closeSocket;
    return false;
  };

  Main.prototype._sendSignal = function(e) {
    var n;
    n = parseInt(this._inputN.value);
    console.log('n', n);
    return this._signal.sendSignal(n);
  };

  Main.prototype._closeSocket = function() {
    return this._socket.stop();
  };

  return Main;

})();

window.onload = (function(_this) {
  return function() {
    var app;
    return app = new Main();
  };
})(this);


},{"./media/AudioSignal":4,"./net/JsonLoader":5,"./net/Socket":6}],2:[function(require,module,exports){
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
var AudioSignal, EventDispatcher, NumberUtils,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NumberUtils = require('../utils/NumberUtils');

EventDispatcher = require('../events/eventdispatcher');

AudioSignal = (function(superClass) {
  extend(AudioSignal, superClass);

  function AudioSignal(_config) {
    this._config = _config;
    this._sendMessage = bind(this._sendMessage, this);
    this._high = this._config['high']['freq'] || 19000;
    this._low = this._config['low']['freq'] || 17000;
    this._hD = this._config['high']['detection'] || -65;
    this._lD = this._config['low']['detection'] || -65;
    this._baseInterval = this._config['baseInterval'] || 50;
    this._iterations = this._config['iterations'] || 4;
    this._context = new AudioContext();
    this._gainA = this._context.createGain();
    this._oscA = this._context.createOscillator();
    this._oscA.frequency.value = this._high;
    this._oscA.type = "triangle";
    this._oscA.connect(this._gainA);
    this._oscA.start();
  }

  AudioSignal.prototype.sendSignal = function(p_message) {
    this._message = NumberUtils.toBin(p_message).split('');
    console.log('@_message', this._message);
    this._totalSig = this._message.length;
    return this._sendMessage();
  };

  AudioSignal.prototype._sendMessage = function() {
    var freq, i, j, k, ref, results, sig, startTime;
    this._current = 0;
    this._gainA.connect(this._context.destination);
    this._gainA.gain.value = 0;
    startTime = this._context.currentTime;
    results = [];
    for (i = k = 0, ref = this._iterations; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      startTime += 2;
      this._gainA.gain.setValueAtTime(1, startTime);
      results.push((function() {
        var l, len, ref1, results1;
        ref1 = this._message;
        results1 = [];
        for (j = l = 0, len = ref1.length; l < len; j = ++l) {
          sig = ref1[j];
          sig = parseInt(sig);
          freq = sig ? this._high : this._low;
          this._oscA.frequency.setValueAtTime(freq, startTime);
          this._gainA.gain.setValueAtTime(1, startTime);
          startTime += this._baseInterval / 1000;
          this._gainA.gain.setValueAtTime(0, startTime);
          results1.push(startTime += this._baseInterval / 1000);
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  AudioSignal.prototype._stopMessage = function() {
    return this._oscA.disconnect(this._gainA);
  };

  return AudioSignal;

})(EventDispatcher);

module.exports = AudioSignal;


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
