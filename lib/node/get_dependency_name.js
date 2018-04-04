
module.exports = function(node, identifier) {
	let {
		deps: identifiers,
		dependencies: moduleNames
	} = node.load.metadata;
	//let identifiers = node.load.metadata.deps;
	let idx = identifiers.indexOf(identifier);
	return moduleNames[idx];
};
