steal('can','./init.ejs', 'cookbook/models/recipe.js',
function (can, initEJS, Recipe) {
	/**
	 * @constructor cookbook/recipe/list
	 * @alias RecipeList
	 * @parent cookbook
	 * @inherits can.Control
	 * Lists recipes and lets you destroy them.
	 */
	return can.Control(
	/** @Static */
	{
		/**
		 * adding default options
		 */
		defaults : {
			Recipe: Recipe
		}
	},
	/** @Prototype */
	{
		/**
		 * Create a recipe list, render it, and make a request for finding all recipes.
		 */
		init: function () {
			this.list = new Recipe.List();
			this.element.html(initEJS(this.list));
			this.list.replace(Recipe.findAll());
		},
		/**
		 * Click handler for destroy link.
		 */
		'.destroy click': function (el) {
			if (confirm("Are you sure you want to destroy?")) {
				el.closest('.recipe').data('recipe').destroy();
			}
		},
		/**
		 * Handler for recipe creation.  Pushes to the list of instances.
		 */
		"{Recipe} created": function (Model, ev, instance) {
			this.list.push(instance);
		}
	});
});