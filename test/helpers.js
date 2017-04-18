var path = require("path");
var Browser = require("zombie");
var connect = require("connect");
var serveStatic = require("serve-static");

// Helpers
exports.find = function(browser, property, callback, done){
	var start = new Date();
	var check = function(){
		if(browser.window && browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+property+" in "+browser.window.location.href);
		}
	};
	check();
};

var server;
exports.open = function(url, callback, done){
	if(server && server.address()) {
		return server.close(function(){
			exports.open(url, callback, done);
		});
	}

	server = connect()
		.use(serveStatic(path.join(__dirname, "..")))
		.listen(8081);

	var browser = new Browser();
	browser.visit("http://localhost:8081/"+url)
		.then(function(){
			callback(browser, function(err){
				server.close(function(){
					done(err);
				});
			})
		}).catch(function(e){
			server.close(function(){
				done(e);
			});
		});
};

// Uses promises instead of callbacks, better for chaining
exports.popen = function(root, url) {
	// if a single argument is passed assume `root` as steal-tools root folder
	if (url == null) {
		url = root;
		root = path.join(__dirname, "..");
	}

	if (server && server.address()) {
		return new Promise(function(resolve, reject) {
			server.close(function(err) {
				if (err) {
					reject(err);
				}
				resolve(exports.popen(root, url));
			});
		});
	}

	server = connect()
		.use(serveStatic(root))
		.listen(8081);

	var browser = new Browser();
	return browser.visit("http://localhost:8081/" + url)
		.then(function() {
			return {
				browser: browser,
				close: server.close.bind(server)
			};
		});
};

// Uses promises instead of callbacks, better for chaining
exports.pfind = function(browser, property) {
	return new Promise(function(resolve, reject) {
		var start = new Date();

		var check = function() {
			if (browser.window && browser.window[property]) {
				resolve(browser.window[property]);
			}
			else if(new Date() - start < 2000) {
				setTimeout(check, 20);
			}
			else {
				reject(new Error("Failed to find '" + property + "' in " +
					browser.window.location.href));
			}
		};

		check();
	});
};
