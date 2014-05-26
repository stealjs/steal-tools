// # lib/bundle/write_bundles.js
// Given an array of bundles and the baseURL
// Writes them out to the file system.

var makeBundleDir = require("./mkdir"),
	bundleFilename = require("./filename"),
	concatSource = require("../bundle/concat_source"),
	fs = require('fs');
	
module.exports = function(bundles, baseURL){
	
	// Create the bundle directory
	var bundleDirDef = makeBundleDir(baseURL),
		bundleNames = {};
	
	// A deferred containing a deferred that resolves when all
	// deferreds have been built.
	var builtBundleDeferreds = [];
	
	bundles.forEach(function(bundle){
		builtBundleDeferreds.push(new Promise(function(resolve, reject){
			//console.log("BUNDLE:",bundleFilename(bundle));
			
			//bundle.nodes.forEach(function(node){
			//	console.log("+  ",node.load.name);
			//});
			
			concatSource(bundle);
			
			bundleDirDef.then(function(bundleDir){
				
				fs.writeFile(baseURL+""+bundleFilename(bundle), bundle.source, function(err) {
				    if(err) {
				        reject(err);
				    } else {
				        resolve(bundle);
				    }
				}); 
				
			}).catch(function(err){
				reject(err);
			});
		}));

	});
	
	return Promise.all(builtBundleDeferreds);
	
};

		