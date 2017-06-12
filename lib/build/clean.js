module.exports = function(original, options) {
	var result = original;
	var removeTags = options.removeTags || [];

	if(!options.dev) {
		removeTags.push('steal-remove');
	}

	removeTags.forEach(function(tag) {
		result = result.replace(new RegExp('(\\s?)\/\/!(\\s?)' + tag + '-start((.|\n)*?)\/\/!(\\s?)' + tag + '-end', 'gim'), '');
	});

	return result;
};
