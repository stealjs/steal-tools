var Mocha = require("mocha");
var path = require("path");

var mocha = new Mocha();

var testFiles = [
	"./recycle_test",

	// Unit tests
	"./clean_address_test",
	"./clean_test",
	"../lib/bundle/bundle_test",
	"./cli/cmd_build_test",
	"./cli/cmd_bundle_test",
	"./cli/cmd_build_int_test",
	"./cli/cmd_transform_test",
	"./cli/make_steal_config_test",
	"./cli/cmd_export_test",
	"./cli/make_outputs_test",
	"./cli/cmd_live_test",
	"./get_es_module_imports_test",
	"./cli/make_build_options_test",
	"./slim_build_conditionals_test",
	"./minify_js_test",
	"./tree_shaking_test",

	// Integration tests
	"./test_cli",
	"./test_live",
	"./bundle_name_test",
	"./dependencygraph_test",
	"./bundle_test",
	"./order_test",

	"./multibuild_test",
	"./multi_main_build_test",
	"./transform_test",
	"./export_test",
	"./export_global_js_test",
	"./export_global_css_test",
	"./export_standalone_test",
	"./export_bundled_es_test",
	"./continuous_test",
	"./concat_test",
	"./graph_stream_test",
	"./transpile_test",
	"./write_stream_test",
	"./build_conditionals_test",
	"./dev_bundle_build_test",
	"./babel_presets_test",
	"./babel_plugins_test",
	"./slim_build_test",
	"./slim_loader_size_test",

	// external steal-tools plugins
	"./bundle_assets_test"
	//"./serviceworker_test", skip for now
];

testFiles.forEach(function(file) {
	mocha.addFile(path.join(__dirname, file + ".js"));
});

try {
	mocha.run(function(failures) {
		// exit with non-zero status if there were failures
		process.exit(failures ? 1 : 0);
	});
} catch (error) {
	console.error(error);
	process.exit(1);
}