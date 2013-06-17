global.steal = {
	types: require("./types")
};

/*
 * We need to keep steal attached to global
 * because all of the old code expects it there.
 */
module.exports = global.steal = require("stealjs");
