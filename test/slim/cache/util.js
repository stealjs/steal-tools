module.exports = function(prop) {
	var _props = window._props || {};
	_props[prop] = prop;
	window._props = _props;
};
