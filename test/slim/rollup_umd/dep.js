(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined"
		? factory(exports)
		: typeof define === "function" && define.amd
			? define(["exports"], factory)
			: factory((global.Kefir = global.Kefir || {}));
})(this, function(exports) {
	exports.bar = "bar";
});
