/*jshint scripturl:true*/
(function(self) {
  var get_browser = function() {
    if (bowser.name === 'interactive' || bowser.name === 'complete' || bowser.name === 'loading') {
      return false;
    }
    var result = {
      name: bowser.name,
      version: bowser.version
    };
    return result;
  };
  var ErrorFormatter = {};
  ErrorFormatter.format = function(options) {
    var tracekitResult = options.tracekit_info || TraceKit.computeStackTrace(options.error);
    var result = {
      type: options.type || options.error.name || tracekitResult.name || 'Error',
      message: options.error.message,
      stacktrace: ErrorFormatter.formatStackTrace(tracekitResult),
      url: options.url || tracekitResult.url,
      'client-version' : 'JavaScript: 0.0.1'
    };
    if (options.environment) {
      result['application-environment'] = options.environment;
    }
    if (options.location) {
      result.location = options.location;
    }
    if (options.custom_data) {
      result['custom-data'] = options.custom_data;
    } else {
      result['custom-data'] = {};
    }
    return ErrorFormatter.addCustomData(result);
  };

  ErrorFormatter.addCustomData = function (result) {
    var browser = get_browser();
    if (browser) {
      result['custom-data'].browser = browser;
    }
    if (document.readyState) {
      result['custom-data'].readyState = document.readyState;
    }
    if (document.referrer) {
      result['custom-data'].referrer = document.referrer;
    }
    if (window.history && window.history.state) {
      result['custom-data'].history = JSON.stringify(window.history.state);
    }
    return result;
  };

  ErrorFormatter.formatStackTrace = function(stacktrace) {
    var out = [];
    for (var i in stacktrace.stack) {
      var frame = stacktrace.stack[i];
      var lineCol = "";
      if (frame.column) {
          lineCol += frame.line.toString() + ":" + frame.column.toString();
      } else {
          lineCol += frame.line.toString();
      }
      out.push([frame.url.toString(), lineCol, frame.func.toString()]);
    }
    return out;
  };

  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var crossDomainPendings = [];

  var crossDomainPost = function (token, payload) {
    if (!document.body) {
      crossDomainPendings.push({token: token, payload: payload});
      return;
    }
    var iframe = document.createElement('iframe');
    var uniqueNameOfFrame = 'yeller' + (new Date().getTime());
    document.body.appendChild(iframe);
    iframe.style.display = 'none';
    iframe.contentWindow.name = uniqueNameOfFrame;

    var form = document.createElement('form');
    form.target = uniqueNameOfFrame;
    form.action = "https://collector" + getRandomInt(1, 5) + ".yellerapp.com/" + token;
    form.method = 'POST';

    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = "__payload";
    var serializedPayload = JSON.stringify(payload);
    if (payload && serializedPayload !== 'undefined' && token) {
      input.value = serializedPayload;
        form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
    }
  };

  var Yeller = function (transport, options) {
    this.transport = transport;
    this.environment = options.environment;
    this.location = options.location;
    this.token = options.token;
    this.ignored_environments = options.ignored_environments || ['development', 'test'];
    this.eventsRemaining = 10;
    this.filter = options.filter;
  };

  Yeller.prototype.report = function (err, options) {
    if (options === undefined) {
      options = {};
    }
    var withClientParams = this.fillInPerClientParams(this, options);
    for (var i in this.ignored_environments) {
      var env = this.ignored_environments[i];
      if (withClientParams.environment === env) {
        return false;
      }
    }
    if (typeof err == 'string') {
      err = new Error(err);
    } else if (err instanceof Error) {
    } else if (err instanceof Object) {
      for (var k in err) {
        if (err.hasOwnProperty(k)) {
          var value = err[k];
          withClientParams['custom-data'] = withClientParams['custom-data'] || {};
          withClientParams["custom-data"][k] = value;
        }
      }
    }
    withClientParams.error = err;
    this.eventsRemaining = this.eventsRemaining - 1;
    if (0 >= this.eventsRemaining) {
      return false;
    }
    var formattedError = ErrorFormatter.format(withClientParams);
    if (this.filter && !this.filter(formattedError)) {
      return false;
    }
    this.transport(this.token, formattedError);
    return true;
  };

  Yeller.prototype.fillInPerClientParams = function(client, options) {
    if (client.environment) {
      options.environment = client.environment;
    } else {
      options.environment = 'production';
    }
    if (client.location) {
      options.location = client.location;
    }
    return options;
  };

  Yeller.checkValidOptions = function(options) {
    if (typeof(options.token) !== 'string') {
      console.warn('options.token should be a string, but was: ' + options.token);
      return false;
    }
    if (typeof(options.environment || 'production') !== 'string') {
      console.warn('options.environment should be a string, but was: ' + options.environment);
      return false;
    }
    if (typeof(options.location || 'location') !== 'string') {
      console.warn('options.location should be a string, but was: ' + options.location);
      return false;
    }
    return true;
  };

  Yeller.configure = function (options) {
    if (!Yeller.checkValidOptions(options)) {
      return false;
    }
    Yeller.client = new Yeller(crossDomainPost, options || {});
    self.TraceKit = self.TraceKit.noConflict();
    if (options.automaticCatch !== false) {
      self.TraceKit.collectWindowErrors = true;
      self.TraceKit.remoteFetching = false;
      self.TraceKit.report.subscribe(function(tracekitInfo) {
        Yeller.client.report(
          {name: tracekitInfo.name, message: tracekitInfo.message},
          {tracekit_info: tracekitInfo}
          );
      });
    }
    return Yeller.client;
  };

  Yeller.report = function (err, options) {
    if (Yeller.client) {
      return Yeller.client.report(err, options);
    } else {
      console.warn('Yeller client not initialized. Please call Yeller.configure before calling Yeller.report');
      return false;
    }
  };

  window.addEventListener('load', function() {
    for (var i in crossDomainPendings) {
      var pendingRequest = crossDomainPendings[i];
      crossDomainPost(pendingRequest.token, pendingRequest.payload);
    }
  });
  self.Yeller = Yeller;
  self.Yeller.ErrorFormatter = ErrorFormatter;
  self.Yeller.CrossDomainTransport = crossDomainPost;
}
)(window);
