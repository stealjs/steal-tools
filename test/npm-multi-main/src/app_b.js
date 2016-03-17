define(['./lib/dep_a_b', './lib/dep_all'], function(ab, all){
	window.app = {
		ab: ab,
		all: all,
		name: "b"
	};
});