import { app } from 'core/main.gen';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
import './custom/shells/auto-index';

import './custom/agents';
import { Agent } from 'models/agents';


console.log('agents?', JSON.stringify(Agent.all(), null, 2) );
