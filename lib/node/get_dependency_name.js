
module.exports = function(node, identifier) {
	let idx = node.load.deps.indexOf(identifier);
	return node.load.dependencies[idx];
};
