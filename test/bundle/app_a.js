define(['dep_a_b', 'dep_all'], function(ab, all){
	window.appA = true;
	return {
		name: "a",
		ab: ab,
		all: "all"
	};
});