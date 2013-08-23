steal('can', 'cookbook/models/recipe.js', './init.ejs', 'jquery/dom/form_params',
	function (can, Recipe, initEJS) {

	/**
	 * @constructor cookbook/recipe/create
	 * @alias RecipeCreate
	 * @parent cookbook
	 * @inherits can.Control
	 * Creates recipes
	 */
	return can.Control(
	/** @Prototype */
	{
		/**
		 *  Render the initial template
		 */
		init: function () {
			this.element.html(initEJS());
		},
		/**
		 *  Submit handler. Create a new recipe from the form.
		 */
		submit: function (el, ev) {
			ev.preventDefault();
			el.find('[type=submit]').val('Creating...')
			new Recipe(el.formParams()).save(function() {
				el.find('[type=submit]').val('Create');
				el[0].reset()
			});
		}
	});
});