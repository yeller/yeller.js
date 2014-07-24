describe("yeller", function () {
  var yeller, transport;
  beforeEach(function () {
    transport = jasmine.createSpy('transport');
    yeller = new Yeller(transport, {});

  });

  it("sends an exception", function () {
    try {
      throw "err";
    } catch(err) {
      yeller.report(err);
    }
    expect(transport.calls.mostRecent().args[1].type).toBe('Error');
    expect(transport.calls.mostRecent().args[1].message).toBe('err');
  });
});
