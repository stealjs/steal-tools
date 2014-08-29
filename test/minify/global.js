"format global";

(function() {

	var anotherVeryLongName = 'from global';

	window.global = {
		value: anotherVeryLongName
	};

})();
