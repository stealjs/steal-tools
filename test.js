var steal = require("stealjs");

steal("build","build/apps", function(b, apps){
	// the following isn't all that's required
	//s2.config('root','');
	build = b;

	var buildOptions = {
			compressor: "uglify" // uglify is much faster
	};

	steal.build.apps(["build/apps/test/multibuild/app_x",
		"build/apps/test/multibuild/app_y",
		"build/apps/test/multibuild/app_z"], buildOptions, function(){
			console.log("all done");
		});
});
