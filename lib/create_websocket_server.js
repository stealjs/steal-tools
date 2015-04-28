var WebSocketServer = require("ws").Server;
var http = require("http");

module.exports = function(options){
	var port = options.liveReloadPort || 8012;
	var server = http.createServer().listen(port);
	
	var wss = new WebSocketServer({ server: server });
	wss.on("connection", function(){
		console.error("Received client connection");
	});

	return wss;
};
