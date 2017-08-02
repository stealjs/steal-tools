import foo from './foo';
import Bar from './bar';

window.circular = {
	bar: foo.getBar(),
	foo: (new Bar()).getFoo()
};
