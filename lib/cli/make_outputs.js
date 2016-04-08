var _keys = require("lodash/keys");
var _some = require("lodash/some");
var _merge = require("lodash/merge");

module.exports = function(options) {
	var result = {};

	var outputs = {
		cjs: { "+cjs": {} },
		amd: { "+amd": {} },
		global: {
			"+global-css": {},
			"+global-js": {
				exports: { "jquery": "jQuery" }
			}
		}
	};

	var hasSetOptions = _some(_keys(outputs), function(out) {
		return options[out];
	});

	_keys(outputs).forEach(function(out) {
		if (!hasSetOptions || options.all || options[out]) {
			_merge(result, outputs[out]);
		}
	});

	return result;
};
