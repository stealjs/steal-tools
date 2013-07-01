steal(function(){

	/*
	 * Run all functions, sequentially.
	 * Return the result from the last funtion ran.
	 */
	function doAll(/* args */){
		var fn = Array.prototype.shift.call(arguments);
		if(!arguments.length) {
			return fn();
		} else {
			fn();
			return doAll.apply(null, arguments);
		}
	}

	/*
	 * Return a callback function that, when called,
	 * will run `doAll` on the incoming function arguments.
	 */
	doAll.after = function(/* args */){
		var args = arguments;

		return function(){
			return doAll.apply(null, args);
		};
	};

	return doAll;

});
