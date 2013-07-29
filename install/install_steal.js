steal("fs", "mkpath", "path", function(fs, mkpath, path){

	// When called, recursively installs all of the steal files.
	module.exports = function(options, callback){
		if(typeof options == "function") {
			callback = options;
			options = {};
		}

		function doNext(){
			var f = Object.keys(files)[0];
			if(!f) {
				callback && callback();
				return;
			}

			saveFile(files[f], f, doNext);
		}
		doNext();
	};


	var files = {
		"steal/steal.js": path.resolve(__dirname, "../node_modules/steal/steal.js"),
		"steal/steal.production.js": path.resolve(__dirname, "../node_modules/steal/steal.production.js"),
		"steal/dev/dev.js": path.resolve(__dirname, "../node_modules/steal/dev/dev.js"),
		"steal/less/less.js": path.resolve(__dirname, "../node_modules/steal/less/less.js"),
		"steal/less/less_engine.js": path.resolve(__dirname, "../node_modules/steal/less/less_engine.js"),
		"steal/coffee/coffee.js": path.resolve(__dirname, "../node_modules/steal/coffee/coffee.js"),
		"steal/coffee/coffee-script.js": path.resolve(__dirname, "../node_modules/steal/coffee/coffee-script.js"),
		"stealconfig.js": path.resolve(__dirname, "../node_modules/steal/stealconfig.js")
	};

	function wrapped(fn){
		return function(err){
			if(err) {
				console.error(err);
				return;
			}

			fn.apply(this, [].slice.call(arguments, 1));
		};
	}

	function saveFile(location, destination, callback){
		fs.readFile(location, 'utf8', wrapped(function(data){
			var completePath = path.resolve(process.cwd(), destination),
					dirPath = path.dirname(completePath);

			mkpath(dirPath, function(){
				fs.writeFile(completePath, data, wrapped(function(){
					steal.print("Created", destination);
					delete files[destination];
					callback();
				}));
			});
		}));
	}

	return module.exports;

});
