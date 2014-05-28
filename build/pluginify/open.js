
steal("underscore",
	"./parse.js",
	function(_, parse){

	return {

		/**
		 * Returns the callback function from the given text
		 * with removal hints removed.
		 *
		 * @param {String} text
		 * @returns {String}
		 */
		parseContent: function(text) {
			return parse(text)
				.replace(/(\s?)\/\/!steal-remove-start((.|\n)*?)\/\/!steal-remove-end/gim, '')
				.replace(/(\s?)\/\/!pluginify-remove-start((.|\n)*?)\/\/!pluginify-remove-end/gim, '');
		},

		/**
		 * Return the steals from a given root steal
		 *
		 * @param {Function} rootSteal
		 * @param {Object} options
		 * @returns {Array}
		 */
		steals: function(rootSteal, options){
			var ignore = options.ignore || [];

			// Filter out empty and ignored dependencies'
			return _.filter(rootSteal.dependencies, function (dep) {
				if (!dep) { return false; }
				return ignore.indexOf(dep.options.id.toString()) === -1;
			});
		},

		/**
		 * Visit every dependency depth first and call the callback with it.
		 *
		 * @param steals The initial list of Steal dependencies
		 * @param callback The callback to call
		 * @returns {*}
		 */
		visit: function visit(steals, callback, visited) {
			
			visited = visited || [];
			_.toArray(steals).forEach(function (stl) {
				var id = '' + stl.options.id;
				// Only visit if we haven't yet
				if (visited.indexOf(id) === -1) {
					var length = visited.push(id);
					// Depth first
					visit(stl.dependencies, callback, visited);
					callback(stl, id, visited, length);
				}
			});
			return visited;
		}

	};

});
