var foo = require("foo");

module.exports = function baz() {
	window.baz = "baz";
	return foo();
};
