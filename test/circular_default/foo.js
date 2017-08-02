import { name as barName } from './bar';

export let name = 'foo';

export default {
	getBar() {
		return barName;
	}
};
