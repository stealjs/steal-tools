// # lib/bundle/write_bundles.js
// Given an array of bundles and the baseURL
// Writes them out to the file system.

var makeBundleDir = require("./mkdir"),
	bundleFilename = require("./filename"),
	concatSource = require("../bundle/concat_source"),
	normalizeSource = require('./normalize_source'),
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
			var bundlePath = baseURL+""+bundleFilename(bundle);
			
			// Adjusts URLs
			normalizeSource(bundle, bundlePath);
			
			// Combines the source
			concatSource(bundle);
			
			// Once a folder has been created, write out the bundle source
			bundleDirDef.then(function(bundleDir){
				
				fs.writeFile(bundlePath, bundle.source, function(err) {
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

		