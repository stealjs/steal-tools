(function(global) {
	global.jQuery = {};

	global.jQuery.ajax = function() {
		return Promise.resolve();
	};

	return global.jQuery;
})(window);
