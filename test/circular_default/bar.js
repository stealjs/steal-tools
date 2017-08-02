import foo from './foo';

export let name = 'bar';

class Bar {
	constructor() {
		this.bar = foo.getBar();
	}
	getFoo() {
		return this.bar;
	}
}

export default Bar;
