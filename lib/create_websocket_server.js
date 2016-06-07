var WebSocketServer = require("ws").Server;
var http = require("http");

module.exports = function(options){
	var port = options.liveReloadPort || 8012;

	return new Promise(function(resolve, reject){
		var server = http.createServer().listen(port);

		server.on("listening", function(){
			var wss = new WebSocketServer({ server: server });
			wss.on("connection", function(){
				console.error("Received client connection");
			});

			resolve(wss);
		});

		server.on("error", function(err){
			if(err.errno === "EADDRINUSE") {
				console.error("Can not start live-reload on port " + port +
					".\nAnother application is already using it.");
			}
			reject(err);
		});
	});
};
