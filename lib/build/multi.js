var createBundleGraphStream = require("../graph/make_graph_with_bundles").createBundleGraphStream;
var multiBuild = require("../stream/build");
var createWriteStream = require("../bundle/write_bundles").createWriteStream;
var continuousBuild = require("./continuous");

module.exports = function(config, options){
	// Use the build-development environment.
	if(!options) options = {};
	options.localStealConfig = {
		env: "build-development"
	};

	// Watch mode, return a continously building stream.
	if(options.watch) {

		return continuousBuild(config, options);

	} else {
		// Get a stream containing the bundle graph
		var graphStream = createBundleGraphStream(config, options);
		// Pipe the bundle graph into the multiBuild
		var buildStream = graphStream.pipe(multiBuild(config, options));

		// Return a Promise that will resolve after bundles have been written;
		return new Promise(function(resolve, reject){
			// Pipe the multi build result into a write stream.
			var writeStream = buildStream.pipe(createWriteStream());

			writeStream.on("data", function(data){
				this.end();

				// If bundleAssets is truthy run the bundler after the build.
				if(options && options.bundleAssets) {
					require("steal-bundler")(data, options.bundleAssets)
						.then(function(){
							resolve(data);
						});
					return;
				}

				resolve(data);
			});

			[ graphStream, buildStream, writeStream ].forEach(function(stream){
				stream.on("error", reject);
			});

			graphStream.write(config.main);
		});
	}

};
