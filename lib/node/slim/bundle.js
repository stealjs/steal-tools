var template = require("lodash/template");

module.exports = template(`
	(__steal_bundles__ = window.__steal_bundles__ || []).push([
		<%= bundleId %>,
		<%= bundleNodes %>
	]);
`);
