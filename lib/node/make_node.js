module.exports = function(name, source, type){
	return {
		load: {
			metadata: {format: type || global},
			source: source || "",
			name: name
		},
		dependencies: [],
		deps: [],
		activeSource: source || "",
		activeSourceKeys: [],
		transforms: {}
	};
};
