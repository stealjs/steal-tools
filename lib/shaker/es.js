var types = require("ast-types");

exports.collect = function({ast}) {
	let identifier;
	let imports = [];
	let exports = [];

	types.visit(ast, {
		visitImportDeclaration(path) {
			identifier = path.value.source.value;
			this.traverse(path);
		},
		visitImportDefaultSpecifier(path) {
			imports.push({identifier, exportName: "default"});
			this.traverse(path);
		},
		visitImportNamespaceSpecifier(path) {
			throw new Error('Namespace specifiers are not currently supported.');
			this.traverse(path);
		},
		visitImportSpecifier(path) {
			let exportName = path.value.imported.name;
			imports.push({ identifier, exportName });
			this.traverse(path);
		},
		visitExportNamedDeclaration(path) {
			if(path.value.declaration) {
				let exportName;
				if(path.value.declaration.id) {
					exportName = path.value.declaration.id.name
				} else {
					exportName = path.get("declaration").get("declarations")
						.get(0).get("id").get("name").value;
				}

				exports.push({ exportName, path });
			} else if(path.value.specifiers) {
				let specPath = path.get("specifiers");
				for(var i = 0; i < specPath.value.length; i++) {
					let expPath = specPath.get(i);
					let exportName = expPath.value.exported.name;
					exports.push({ exportName, path: expPath });
				}
			} else {
				throw new Error('I do not understand this type of export.');
			}

			this.traverse(path);
		}
	});

	return { imports, exports };
};

// Edge is not settled, need to traverse.
exports.settleEdge = function(){
	return false;
};

exports.getImports = function*({ast}){
	let identifier;
	let imports = [];

	types.visit(ast, {
		visitImportDeclaration(path) {
			identifier = path.value.source.value;
			this.traverse(path);
		},
		visitImportDefaultSpecifier(path) {
			imports.push({identifier, exportName: "default"});
			this.traverse(path);
		},
		visitImportNamespaceSpecifier(path) {
			throw new Error('Namespace specifiers are not currently supported.');
			this.traverse(path);
		},
		visitImportSpecifier(path) {
			let exportName = path.value.imported.name;
			imports.push({ identifier, exportName });
			this.traverse(path);
		}
	});

	for(let imp of imports) {
		yield imp;
	}
};

exports.getExports = function({ast}){
	let exports = [];

	types.visit(ast, {
		visitExportNamedDeclaration(path) {
			if(path.value.declaration) {
				let exportName;
				if(path.value.declaration.id) {
					exportName = path.value.declaration.id.name
				} else {
					exportName = path.get("declaration").get("declarations")
						.get(0).get("id").get("name").value;
				}

				exports.push({ exportName, path });
			} else if(path.value.specifiers) {
				let specPath = path.get("specifiers");
				for(var i = 0; i < specPath.value.length; i++) {
					let expPath = specPath.get(i);
					let exportName = expPath.value.exported.name;
					exports.push({ exportName, path: expPath });
				}
			} else {
				throw new Error('I do not understand this type of export.');
			}

			this.traverse(path);
		}
	});

	return exports;
};

// Shaken out the path, if we can
exports.shakeOut = function({exportName, path}, {ast}){
	let used = false;

	// Determine if this export is used internal to the module.
	// If so it should not be treeshaken.
	types.visit(ast, {
		visitIdentifier(path) {
			if(path.get("name").value === exportName) {
				switch(path.parentPath.value.type) {
					case "CallExpression":
						used = true;
						return false;
					// TODO
					// Default should probably be true.
					// special case for the exports and the assignment stuff.
					default:
						break;
				}
			}

			this.traverse(path);
		}
	});

	if(!used) {
		path.prune();
	}
};
