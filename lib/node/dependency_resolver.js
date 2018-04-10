
exports.moduleNameFromSpecifier = function(node, identifier) {
	let {
		deps: identifiers,
		dependencies: moduleNames
	} = node.load.metadata;
	//let identifiers = node.load.metadata.deps;
	let idx = identifiers.indexOf(identifier);
	return moduleNames[idx];
};

exports.moduleSpecifierFromName = function(node, name){
	let {
		deps: specifiers,
		dependencies: moduleNames
	} = node.load.metadata;
	let idx = moduleNames.indexOf(name);
	return specifiers[idx];
};
