import { getBar } from './foo';
import { getFoo } from './bar';

// true in dev, false in production
window.circularWorks = (getBar() === 'bar') &&
	(getFoo() === 'foo');
