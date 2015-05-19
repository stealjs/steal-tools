
module.exports = function(bundle){
	if(bundle.buildType === "js") {
		bundle.nodes.unshift({
			load:{name:""},
			minifiedSource: "\"format amd\";"
		});
	}
};
