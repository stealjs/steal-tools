steal(function(){

	/*
	 * Run all functions, sequentially.
	 * Return the result from the last funtion ran.
	 */
	return function doAll(/* args */){
		var fn = Array.prototype.shift.call(arguments);
		if(!arguments.length) {
			return fn();
		} else {
			fn();
			return doAll.apply(null, arguments);
		}
	};

});
