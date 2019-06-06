import { autoIndex } from 'helpers/shells/auto-index';
import * as Main from '../../main';

Main.ready$.subscribe({
    next: async () => {
        autoIndex(`${__dirname}/../agents`);
        autoIndex(`${__dirname}/../models`);
    },
});
