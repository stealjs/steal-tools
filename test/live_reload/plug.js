
exports.translate = function(load){
	var loader = this;
	var locate = this.locate;
	var fetch = this.fetch;

	var depLoad = { name: "nested_dep.txt", metadata: {} };
	return locate.call(this, depLoad).then(function(address){
		load.metadata.includedDeps = [
			address.substr(0, address.length - 3) // remove .js
		];

		return "module.exports = '';";
	});
};
