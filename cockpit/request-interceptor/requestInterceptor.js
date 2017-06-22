// define a new module to be loaded
define([], function() {
  // inject original open function of the native XMLHttpRequest
  (function(open) {
    // override native opening function of XMLHttpRequest prototype
    XMLHttpRequest.prototype.open = function() {
      // call the original open function
      open.apply(this, arguments);

      // set the withCredentials property of the request
      this.withCredentials = true;

      // optionally set request headers, if needed
      // this.setRequestHeader('X-Something-I-Need-Just-To-Test', 'works');
    };
  })(XMLHttpRequest.prototype.open);
});
