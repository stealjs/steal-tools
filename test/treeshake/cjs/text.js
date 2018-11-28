
exports.translate = function(load) {
	load.metadata.importSpecifiers = {
		"./dep": {
			start: { line: 1, column: 28 },
			end: { line: 1, column: 30 },
		}
	};
	return "require('./dep'); module.exports = function(){};";
};
