steal("underscore",
	"fs",
	"path",
	"./parse.js",
	"steal-tools/build/open",
	"./open.js",
	"steal-tools/build/js",
	"steal-tools/node/utils.js",
	"steal-tools/build/css",
	function(_, fs, path, parse, open, opener, js, utils, css){

	var readFile = utils.readFile;
	var BLANK_HTML = path.resolve(__dirname, "../../node/blank.html");
	var noop = function(){};

	function clone(o){
		return JSON.parse(JSON.stringify(o));
	}

	var ignores = [
		'steal/dev/dev.js',
		'stealconfig.js'
	];

	/**
	 *
	 * @param ids
	 * @param options
	 * @param callback
	 */
	function pluginify(ids, options, callback) {
		options.minify = typeof options.minify === "boolean"
			? options.minify : true;

		if(!options.steal) {
			var config = pluginify.loadConfig();
			var shim = clone(config.shim);
		}

		var stealData = _.extend({}, options.steal, {
			startId: ids
		});

		var getSteals = opener.steals;
		var thingToBuild = /\.html$/i.test(ids) ? ids : BLANK_HTML;

		open(thingToBuild, stealData, function (opener) {
			var steals = getSteals(opener.rootSteal, options);

			// Call pluginifySteals and extend the options with the opener Steal
			pluginify.pluginifySteals(steals, _.extend({
				opener: opener,
				shim: shim,
				ignore: ignores.concat(options.ignore||[])
			}, options), callback || noop);
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
			var cssSteals = [];

			// This is the out filename for the compiled JavaScript
			var out = options.out || options.to;

			var pageSteal = options.opener.steal;
			_.each(options.shim, function(variable, id) {
				var val = variable.exports
					? variable.exports : variable;
				nameMap[pageSteal.id(id)] = val;
			});

			var extractContent = function(stl){
				var filename = path.resolve('' + pageSteal.config('root'),
					stl.options.src+"");

				return readFile(filename);
			};

			// Go through all dependencies
			opener.visit(steals, function (stl, id, visited, index) {
				// If this is a css steal, add it to the css array.
				if(~[stl.options.type, stl.options.buildType].indexOf('css')) {
					return cssSteals.push(stl.options);
				}

				// If the steal has its content loaded (done by the opener) and we don't have a registered
				// variable name for that module
				if(stl.options.type !== "fn" && !nameMap[id]
					&& !pluginify.ignores(id, options.ignore || [])){

					if(!stl.options.text){
						var text = extractContent(stl);
						stl.options.text = text;
					}
					stl.options.parsed = opener.parseContent(stl.options.text);
				}


				if (stl.options.text && !nameMap[id] && !pluginify.ignores(id, options.ignore || [])) {
					steal.print("\ \ +", id);

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

					// Create the dependency as strings, so undefineds work.
					var depStrs = dependencies.map(function(d){ return d || "undefined"; });

					// Render the template for this module
					var part = _.template(options.moduleTemplate, {
						moduleName: id,
						variableName: variableName,
						parsed: stl.options.parsed,
						dependencies: depStrs
					});

					contents.push(part);
				}

			});

			if(!contents.length) {
				throw new Error('No files to pluginify');
			}

			// CSS
			var makeCss = !cssSteals.length ? null : function(callback){
				css.makePackage(cssSteals, null, callback);
			};

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

			if(out) {
				// Save out the built JavaScript
				var finalize = pluginify.finalize;
				var jsout = pluginify.outFileName(out, "js");
				var minifier = options.minify ? js.minify.bind(null, javascript, {}) : null;

				// Save out the JavaScript and then CSS, if there is any.
				finalize(javascript, jsout, minifier, function(){
					if(makeCss) {
						makeCss(function(cssobj){
							var dir = path.dirname(jsout);
							var cssout = pluginify.outFileName(dir, "css");
							finalize(cssobj.code, cssout, null, callback);
						});
					} else {
						callback();
					}
				});

			} else {
				callback(javascript);
			}
		},

		loadConfig: function(){
			var fileName = path.resolve(process.cwd(), "stealconfig.js");
			var rawContents = readFile(fileName);
			var getConfig = new Function("steal", "return " + rawContents);
			var data = getConfig({
				config: function(o) { return o; }
			});
			return data;
		},

		/*
		 * Normalizes files/directories into usable
		 * out file names.
		 * @param {String} inFileName filename to normalize
		 * @param {String} ext The file extension.
		 */
		outFileName: function(inFileName, ext){
			// If the file doesn't exist, immediately return it.
			if(!fs.existsSync(inFileName)) {
				return inFileName;
			}

			var stats = fs.statSync(inFileName);
			if(stats.isDirectory()) {
				return path.resolve(inFileName + "/", "production." + ext);
			}

			return inFileName;
		},

		/*
		 * Finalizes the build, saving the file to their destination
		 * and optionally minifying the source

		 * @param {String} data The data to save
		 * @param {String} filename The filename to save out to.
		 * @param {Function} minifier A minifier function, if desired
		 * @param {Function} callback Function to call when complete
		 */
		finalize: function(data, filename, minifier, callback){
			var save = pluginify.save;
			var fun = minifier || function(cb) { cb(data); };

			fun(function(data){
				save(data, filename);
				callback();
			});
		},

		save: function(data, out){
			var uri = new steal.URI(out);
			uri.save(data);
		},

		getFunction: parse
	});

	return steal.build.pluginify = pluginify;

});
