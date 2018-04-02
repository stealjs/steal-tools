var steal = require("@steal");

// fake plugin to register the dynamic import below
require("./template.plug!plug");

module.exports = steal.import("./app_a");