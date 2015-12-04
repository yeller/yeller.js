describe("yeller", function () {
  var yeller, transport;
  beforeEach(function () {
    transport = jasmine.createSpy('transport');

  });

  it("sends an exception", function () {
    yeller = new Yeller(transport, {});
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent().args[1].type).toBe('Error');
    expect(transport.calls.mostRecent().args[1].message).toBe('err');
  });

  it("transforms an exception if there is a transform", function () {
    yeller = new Yeller(transport,
        {
          transform: function(error) {
            error.message = "transformed";
            return error;
          }
        }
      );
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent().args[1].type).toBe('Error');
    expect(transport.calls.mostRecent().args[1].message).toBe('transformed');
  });

  it("if the transform throws an error, still sends the exception", function () {
    yeller = new Yeller(transport,
        {
          transform: function(error) {
            error.message = "transformed";
            throw 'lol';
          }
        }
      );
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent().args[1].type).toBe('Error');
    expect(transport.calls.mostRecent().args[1].message).toBe('transformed');
  });

  it("if the transform returns false, doesn't send the exception", function () {
    yeller = new Yeller(transport,
        {
          transform: function(error) {
            return false;
          }
        }
      );
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent()).toBe(undefined);
  });

  it("if the filter returns true, sends the exception", function () {
    yeller = new Yeller(transport,
        {
          filter: function(error) {
            return true;
          }
        }
      );
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent().args[1].type).toBe('Error');
    expect(transport.calls.mostRecent().args[1].message).toBe('err');
  });

  it("if the filter returns false, doesn't send the exception", function () {
    yeller = new Yeller(transport,
        {
          filter: function(error) {
            return false;
          }
        }
      );
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent()).toBe(undefined);
  });
});
