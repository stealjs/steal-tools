var through = require("through2");
var clone = require("lodash/cloneDeep");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			next(null, clone(data));
		} catch (err) {
			next(err);
		}
	});
};
