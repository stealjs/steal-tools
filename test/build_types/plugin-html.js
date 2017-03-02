function getDocument() {
	if(typeof document !== "undefined")
		return document;
}

exports.instantiate = function(load){
	var doc = getDocument();
	if(doc) {
		var frag = document.createDocumentFragment();
		var div = document.createElement("div");
		div.innerHTML = load.source;
		var node = div.firstChild, next;
		while(node) {
			next = node.nextSibling;
			frag.appendChild(node);
			node = next;
		}
	}
	load.metadata.prependModuleName = false;
	load.metadata.deps = [];
	load.metadata.format = "html";
	load.metadata.execute = function(){
		doc.body.appendChild(frag);
	};
};

exports.buildType = "html";
exports.includeInBuild = true;
