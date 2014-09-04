define(['dep_a_b', 'dep_all'], function(ab, all){
	var mod = {
		name: "a",
		ab: ab,
		all: "all"
	};
	
	//!steal-remove-start
	mod.clean = false
	//!steal-remove-end

	return mod;
});
