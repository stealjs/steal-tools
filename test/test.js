var isIOjs = process.version.substr(0, 3) !== "v0.";

require("./test_cli");
require("./grunt_tasks/steal_build");

// Node 0.10 doesn't support Symbols so the live-reload tests will
// not pass on it.
if(typeof Symbol !== "undefined") {
	require("./test_live");
}

require("./dependencygraph_test");
require("./bundle_test");
require("./order_test");

// mock-fs doesn't work in iojs 3.0 right now so skipping until that is fixed.
if(!isIOjs) {
	require("./recycle_test");
}

require("./multibuild_test");
require("./transform_test");
require("./export_test");
