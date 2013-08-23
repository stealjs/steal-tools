steal('can', function (can) {
	/**
	 * @constructor cookbook/models/recipe
	 * @alias Recipe
	 * @parent cookbook
	 * @inherits can.Model
	 *
	 * Wraps backend recipe services.
	 */
	return can.Model(
	/* @static */
	{
		/**
 		 * Find all recipes
		 */
		findAll : "GET /recipes",
		/**
 		 * Find one recipe
		 */
		findOne : "GET /recipes/{id}",
		/**
 		 * Create a recipe
		 */
		create : "POST /recipes",
		/**
		 * Update a recipe
		 */
		update : "PUT /recipes/{id}",
		/**
		 * Destroy a recipe
		 */
		destroy : "DELETE /recipes/{id}"
	},
	/* @Prototype */
	{});
});