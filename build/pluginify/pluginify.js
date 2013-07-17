
steal("underscore",
	"./parse.js",
	"./open.js",
	"build/js",
	function(_, parse, opener, js){

	/**
	 *
	 * @param ids
	 * @param options
	 * @param callback
	 */
	function pluginify(ids, options, callback) {
		options.minify = typeof options.minify === "boolean"
			? options.minify : true;

		opener(ids, options.steal || {}, function (error, rootSteals, opener) {
			// Call pluginifySteals and extend the options with the opener Steal
			pluginify.pluginifySteals(rootSteals, _.extend({
				opener: opener
			}, options), callback);
		});
	}

	_.extend(pluginify, {
		defaults: {
			wrapper: '(function(undefined) {\n<%= content %>\n\n' +
				'<%= exports.join("\\n") %>\n' +
				'})();\n',
			exportsTemplate: 'window[\'<%= name %>\'] = <%= module %>;',
			moduleTemplate: '\n// ## <%= moduleName %>\nvar <%= variableName %> = ' +
				'(<%= parsed %>)(<%= dependencies.join(", ") %>);'
		},

		/**
		 * Returns if the given id should be ignored
		 *
		 * @param {String} id The id to check
		 * @param {Array} ignores A list of regular expressions or strings to check.
		 * Strings ending with `/` will be treated as folders.
		 * @returns {Boolean} Whether to ignore the id or not
		 */
		ignores: function(id, ignores) {
			return _.some(ignores, function(current) {
				if(current.test) {
					return current.test(id);
				}
				if(/\/$/.test(current)) {
					return id.indexOf(current) === 0;
				}
				return current === id;
			});
		},

		/**
		 * Pluginify a list of steal dependencies
		 *
		 * @param steals
		 * @param options
		 * @param callback
		 */
		pluginifySteals: function(steals, options, callback) {
			if (!callback) {
				callback = options;
				options = {};
			}

			options = _.extend({}, pluginify.defaults, options);

			// Stores mappings from module ids to pluginified variable names
			var nameMap = {};
			var contents = [];

			_.each(options.shim, function(variable, id) {
				nameMap[options.opener.id(id)] = variable;
			});

			// Go through all dependencies
			opener.visit(steals, function (stl, id, visited, index) {
				// If the steal has its content loaded (done by the opener) and we don't have a registered
				// variable name for that module
				if (stl.options.text && !nameMap[id] && !pluginify.ignores(id, options.ignore || [])) {
					// Create a variable name containing the visited array length
					var variableName = '__m' + index;
					// Set the variable name for the current id
					nameMap[id] = variableName;

					// When we come back from the recursive call all our dependencies are already
					// parsed and have a name. Now create a list of all the variables names.
					var dependencies = stl.dependencies.map(function (dep) {
						return nameMap['' + dep.options.id];
					});

					// The last dependency is the module itself, we don't need that
					dependencies.pop();

					// Render the template for this module
					var part = _.template(options.moduleTemplate, {
						moduleName: id,
						variableName: variableName,
						parsed: stl.options.parsed,
						dependencies: dependencies
					});

					contents.push(part);
				}
			});

			if(!contents.length) {
				throw new Error('No files to pluginify');
			}

			var exportModules = [];
			if (options.exports) {
				// Get all the modules to export
				exportModules = _.map(options.exports, function (name, moduleId) {
					// options.opener should be the Steal instance used to retrieve the pluginified
					// steals so that we can map ids with the correct configuration. Use `steal.load` as a fallback
					return _.template(options.exportsTemplate, {
						name: name,
						module: nameMap['' + options.opener.id(moduleId)]
					});
				});
			}

			var javascript = _.template(options.wrapper, {
				content: contents.join('\n'),
				exports: exportModules
			});

			if(options.out) {
				var save = pluginify.save;

				var fun = options.minify
					? js.minify.bind(null, javascript, {})
					: function(cb) { cb(javascript); };

				fun(function(data){
					save(data, options.out);
					callback();
				});

			} else {
				callback(javascript);
			}
		},

		save: function(data, out){
			var uri = new steal.URI(out);
			uri.save(data);
		},

		getFunction: parse
	});

	steal.build.pluginify = pluginify;

	return pluginify;

});
