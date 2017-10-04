(function webpackUniversalModuleDefinition(root, factory) {
	if (typeof exports === "object" && typeof module === "object")
		module.exports = factory();
	else if (typeof define === "function" && define.amd) define([], factory);
	else if (typeof exports === "object") exports["io"] = factory();
	else root["io"] = factory();
})(this, function() {
	return "io";
});
