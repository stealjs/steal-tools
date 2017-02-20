var _ = require("lodash");
var winston = require("winston");
var stealTools = require("../../index");
var clone = require("lodash/cloneDeep");
var options = clone(require("./options"));
var makeStealConfig = require("./make_steal_config");

var pathsToOmit = [
	"bundles-path",
	"bundle-steal",
	"watch"
];

var bundleOptions = _.assign(
	{},
	_.omit(options, pathsToOmit),
	{
		dest: {
			alias: "d",
			type: "string",
			default: "",
			describe: "Defaults to root folder, a directory to save the bundles"
		},
		filter: {
			alias: "f",
			default: "**",
			type: "string",
			describe: "Glob pattern to match modules to be included in the bundle"
		},
		dev: {
			type: "boolean",
			default: false,
			describe: "Generates a development bundle; sets filter to `node_modules/**/*`"
		}
	}
);

module.exports = {
	command: "bundle",

	describe: "Creates a custom bundle",

	builder: bundleOptions,

	handler: function(argv) {
		var options = argv;
		var config = makeStealConfig(argv);

		_.defaults(options, {
			filter: options.dev ? "node_modules/**/*" : options.filter
		});

		return stealTools.bundle(config, options)
			.then(function() {
				winston.info("\nBundle created successfully".green);
			})
			.catch(function(e) {
				e = typeof e === "string" ? new Error(e) : e;

				winston.error(e.message.red);
				winston.error("\nBuild failed".red);

				process.exit(1);
			});
	}
};
