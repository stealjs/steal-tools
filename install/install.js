debugger;

steal("install/install_steal.js", function(installSteal){

	/*
	 * In the future install will be able to pull from
	 * NPM, Bower, GitHub, and other places where modules
	 * live, but for now it only installs stealjs.
	 */
	module.exports = function(options, callback){
		return installSteal(options, callback);
	};

	return module.exports;

});
