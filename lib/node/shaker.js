

module.exports = function(node){
	if(node.load.metadata.format === "es6") {
		return require("../shaker/es");
	}
	// TODO commonjs?
	else {
		return require("../shaker/default");
	}
}
