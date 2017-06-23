"format cjs";

exports.translate = function(load) {
  return `
		define(function() {
			return ${load.source};
		});
	`;
};

exports.excludeFromBuild = true;
exports.thisShouldNotBeInTheBundle = true;
