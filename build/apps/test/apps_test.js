global.steal = {
	root: require("path").resolve(__dirname, "../../../.."),
	nodeRequire: require
};

var steal = require("stealjs")
  , path = require("path")
  , readFile = require("../../../node/utils").readFile
  , rimraf = require("rimraf").sync
  , jsdom = require("jsdom").jsdom;

global.STEALPRINT = true;

suite("Apps");

var build;
before(function(done) {
		/**
		 * Setup for multi-build packaging tests
		 *
		 * Project module dependency diagram:
		 *
		 * app_x           app_y         app_z
		 *
		 *  ^          7    ^           7   ^
		 *  |        /      |         /     |
		 *  |      /        |       /       |
		 *
		 * plugin_xy       plugin_yz     plugin_z
		 *
		 *  ^             7
		 *  |           /
		 *  |         /
		 *
		 * nested_plugin_xyz
		 *
		 *
		 * Modules should be grouped up into packages, based upon shared
		 * dependencies. The packages should be structured as follows:
		 *
		 * packages/0 -> (contains) -> nested_plugin_xyz
		 *
		 * packages/1 -> (depends on) -> packages/0 for nested_plugin_xyz
		 *            -> (contains) -> plugin_xy
		 *
		 *
		 * packages/2 -> (depends on) -> packages/0 for nested_plugin_xyz
		 *            -> (contains) -> plugin_yz
		 *
		 * app_x/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/1 for plugin_xy
		 *                  -> (contains) -> app_x
		 *
		 * app_y/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/1 for plugin_xy
		 *                  -> (loads) -> packages/2 for plugin_yz
		 *                  -> (contains) -> app_y
		 *
		 * app_z/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/2 for plugin_yz
		 *                  -> (contains) -> plugin_z
		 *                  -> (contains) -> app_z
		 *
		 * This test multi-build project will allow testing of a few cases:
		 * - Packaging a direct dependency
		 * - Packaging an indirect dependency (dependency of another dependency)
		 * - Packaging an indirect dependency once, when it is imported more than once
		 * - Including a direct dependency
		 *   (plugin_z, because it is only imported in one app module)
		 *
		 */

		this.timeout(99999);
		debugger;

		steal("steal/build","steal/build/apps", function(b, apps){
			// the following isn't all that's required
			build = b;
		
			var buildOptions = {
				compressor: "uglify", // uglify is much faster
				root: steal.config("root")+""
			};

			var oldRoot = steal.config("root")+"";
			steal.config("root", path.resolve(__dirname, "../../.."));

			apps(["build/apps/test/multibuild/app_x",
				"build/apps/test/multibuild/app_y",
				"build/apps/test/multibuild/app_z"], buildOptions, function(){
					steal.config("root", oldRoot);
					done();
				});
		});
});

after(function(){
	// Tear down
	/*console.log("tearing down!");
	rimraf("build/apps/test/multibuild/app_x/production.js");
	rimraf("build/apps/test/multibuild/app_y/production.js");
	rimraf("build/apps/test/multibuild/app_z/production.js");
	rimraf("build/apps/test/multibuild/app_x/production.css");
	rimraf("build/apps/test/multibuild/app_y/production.css");
	rimraf("build/apps/test/multibuild/app_z/production.css");
	rimraf("packages/0.js");
	rimraf("packages/1.js");
	rimraf("packages/2.js");
	rimraf("packages/0.css");
	rimraf("packages/1.css");
	rimraf("packages/2.css");*/
});

test("multibuild creates JS/CSS packages with the right contents", function(){
	expect(14);

	var contents;
	contents = readFile("packages/app_x-app_y-app_z.js");
	equal(/init_nested_plugin_xyz/.test(contents), true,
					"content of nested_plugin_xyz.js should be packaged");

	contents = readFile("packages/app_x-app_y.js");
	equal(/init_plugin_xy/.test(contents), true,
					"content of plugin_xy.js should be packaged");

	contents = readFile("packages/app_y-app_z.js");
	equal(/init_plugin_yz/.test(contents), true,
					"content of plugin_yz.js should be packaged");

	contents = readFile("build/apps/test/multibuild/app_x/production.js");
	equal(/init_app_x/.test(contents), true,
					"content of app_x.js should be packaged");

	contents = readFile("build/apps/test/multibuild/app_y/production.js");
	equal(/init_app_y/.test(contents), true,
					"content of app_y.js should be packaged");

	contents = readFile("build/apps/test/multibuild/app_z/production.js");
	equal(/init_app_z/.test(contents), true,
					"content of app_z.js should be packaged");
	equal(/init_plugin_z/.test(contents), true,
					"content of plugin_z.js should be packaged");
					
					
	contents = readFile("packages/app_x-app_y-app_z.css");
	equal(/#nested_plugin_xyz_styles/.test(contents), true,
					"content of nested_plugin_xyz.css should be packaged");

	contents = readFile("packages/app_x-app_y.css");
	equal(/#plugin_xy_styles/.test(contents), true,
					"content of plugin_xy.css should be packaged");

	contents = readFile("packages/app_y-app_z.css");
	equal(/#plugin_yz_styles/.test(contents), true,
					"content of plugin_yz.css should be packaged");

	contents = readFile("build/apps/test/multibuild/app_x/production.css");
	equal(/#app_x_styles/.test(contents), true,
					"content of app_x.css should be packaged");

	contents = readFile("build/apps/test/multibuild/app_y/production.css");
	equal(/#app_y_styles/.test(contents), true,
					"content of app_y.css should be packaged");

	contents = readFile("build/apps/test/multibuild/app_z/production.css");
	equal(/#app_z_styles/.test(contents), true,
					"content of app_z.css should be packaged");
	equal(/#plugin_z_styles/.test(contents), true,
					"content of plugin_z.css should be packaged");

});
