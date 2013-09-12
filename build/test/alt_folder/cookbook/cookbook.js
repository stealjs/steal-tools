steal(
	'cookbook/recipe/create',
	'cookbook/recipe/list',
	'./cookbook.less',
	'./models/fixtures/fixtures.js',
function(RecipeCreate, RecipeList){
	
	new RecipeList('#recipes');
	new RecipeCreate('#create');
})