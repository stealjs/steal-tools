var baseHelper = require("./base");
var globalJS = require("./global").js;

/**
 * @module {function} steal-tools/lib/build/helpers/standalone standalone
 * @parent steal-tools.helpers
 *
 * Helper that make exporting to [syntax.global] formats easier.
 *
 * @signature `"+standalone": { ... OVERRIDES ... }`
 *
 * Exports all Javascript into a single file, including all dependencies.
 *
 * @body
 *
 * ## Use
 *
 * Add in `+standalone` in an output name to export your project to a single
 * file which will include NPM dependencies. This is the option you most often
 * want when creating a build meant to be used in a script tag or jsbin, etc.
  *
 * ```
 * stealTools.export({
 *   system: {
 *     config: __dirname+"/package.json!npm"
 *   },
 *   outputs: {
 *	   "+standalone": {
 *       dest: __dirname + "/mylib.js"
 *	   }
 *   }
 * });
 * ```
 */
var standalone = {
	modules: globalJS.modules,
	format: function(){
		return "global";
	},
	dest: globalJS.dest,
	useNormalizedDependencies: globalJS.useNormalizedDependencies,
	normalize: globalJS.normalize,
	ignore: function(){
		return false;
	}
};

module.exports = baseHelper.makeHelper(standalone);
