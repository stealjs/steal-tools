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
