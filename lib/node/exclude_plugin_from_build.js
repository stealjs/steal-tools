module.exports = function(node) {
	return node.isPlugin &&
		!node.value.includeInBuild &&
		!node.load.metada.includeInBuild;
};
