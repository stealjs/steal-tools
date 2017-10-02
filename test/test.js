require("./recycle_test");

// Unit tests
require("./clean_address_test");
require("./clean_test");
require("../lib/bundle/bundle_test");
require("./cli/cmd_build_test");
require("./cli/cmd_bundle_test");
require("./cli/cmd_build_int_test");
require("./cli/cmd_transform_test");
require("./cli/make_steal_config_test");
require("./cli/cmd_export_test");
require("./cli/make_outputs_test");
require("./cli/cmd_live_test");
require("./get_es_module_imports_test");
require("./cli/make_build_options_test");
require("./slim_build_conditionals_test");
require("./minify_js_test");

// Integration tests
require("./test_cli");
require("./test_live");
require("./bundle_name_test");
require("./dependencygraph_test");
require("./bundle_test");
require("./order_test");

require("./multibuild_test");
require("./multi_main_build_test");
require("./transform_test");
require("./export_test");
require("./export_global_js_test");
require("./export_global_css_test");
require("./export_standalone_test");
require("./continuous_test");
require("./concat_test");
require("./graph_stream_test");
require("./transpile_test");
require("./write_stream_test");
require("./build_conditionals_test");
require("./dev_bundle_build_test");
require("./babel_presets_test");
require("./babel_plugins_test");
require("./slim_build_test");
require("./slim_loader_size_test");

// external steal-tools plugins
require("./bundle_assets_test");
//require("./serviceworker_test"); skip for now