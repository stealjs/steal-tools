module.exports = function() {
	var div = document.createElement("div");
	div.classList.add("foo");
	div.textContent = "foo";
	document.body.appendChild(div);
};
