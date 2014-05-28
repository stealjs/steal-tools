// map fixtures for this application
steal("can/util/fixture", function(fixture) {

	var store = fixture.store(5, function(i){
		return {
			name: "recipe "+i,
			description: "recipe " + i
		}
	});
	
	fixture({
		'GET /recipes' : store.findAll,
		'GET /recipes/{id}' : store.findOne,
		'POST /recipes' : store.create,
		'PUT /recipes/{id}' : store.update,
		'DELETE /recipes/{id}' : store.destroy
	});

	return store;
});