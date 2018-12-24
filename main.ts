import { app } from 'core/main.gen';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
import './custom/shells/auto-index';

import './custom/agents';
import { Agent } from 'models/agents';


console.log('agents?', JSON.stringify(Agent.all(), null, 2) );

import { FRSAgent } from './custom/agents/frs-agent';
let frs = new FRSAgent({
    frs: {
        ip: "172.16.10.88",
        port: 8088,
        wsport: 7077,
        account: "val",
        password: "123456"
    }
});
frs.Start();
frs.SearchRecords({
    starttime: new Date(2018, 11, 10, 0,0,0),
    endtime: new Date(2018, 11, 10, 23,59,59)
}).subscribe( (data) => {
    console.log({...data, face_feature: undefined});
}, () => {}, () => console.log('search complete'));
    