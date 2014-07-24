describe("ErrorFormatter", function () {
  it("takes the type from the reported exception", function () {
    var result = Yeller.ErrorFormatter.format({error: new Error()});
    expect(result.type).toEqual('Error');
  });

  it("the passed in type takes preference", function () {
    var result = Yeller.ErrorFormatter.format({error: new Error(), type: 'myerror'});
    expect(result.type).toEqual('myerror');
  });

  it("takes the message from the reported exception", function () {
    var result = Yeller.ErrorFormatter.format({error: new Error("err")});
    expect(result.message).toEqual('err');
  });
});
