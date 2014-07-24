/*jshint scripturl:true*/
(function(self) {
  var ErrorFormatter = {};
  ErrorFormatter.format = function(options) {
    var tracekitResult = TraceKit.computeStackTrace(options.error);
    var result = {
      type: options.type || options.error.name,
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
    }
    return result;
  };

  ErrorFormatter.formatStackTrace = function(stacktrace) {
    var out = [];
    for (var i in stacktrace.stack) {
      var frame = stacktrace.stack[i];
      out.push([frame.url.toString(), frame.line.toString(), frame.func.toString()]);
    }
    return out;
  };

  var crossDomainPost = function (token, payload) {
    var iframe = document.createElement('iframe');
    var uniqueNameOfFrame = 'yeller' + (new Date().getTime());
    document.body.appendChild(iframe);
    iframe.style.display = 'none';
    iframe.contentWindow.name = uniqueNameOfFrame;

    var form = document.createElement('form');
    form.target = uniqueNameOfFrame;
    form.action = "https://collector1.yellerapp.com/" + token;
    form.method = 'POST';

    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = "__payload";
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  };

  var Yeller = function (transport, options) {
    this.transport = transport;
    this.environment = options.environment;
    this.location = options.location;
    this.token = options.token;
    this.ignored_environments = options.ignored_environments || ['development', 'test'];
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
          withClientParams["custom-data"][k] = v;
        }
      }
    }
    withClientParams.error = err;
    this.transport(this.token, ErrorFormatter.format(withClientParams));
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

  Yeller.configure = function (options) {
    return new Yeller(crossDomainPost, options || {});
  };
  self.Yeller = Yeller;
  self.Yeller.ErrorFormatter = ErrorFormatter;
  self.Yeller.CrossDomainTransport = crossDomainPost;
}
)(window);
