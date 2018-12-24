import { Agent } from 'models/agents';

import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable } from 'rxjs';

interface IEnableLiveFaces {
    enable: boolean;
}

@Agent.Register({
    name: "FRS Agent",
    description: "Middleware of FRS Service.",
    initialize: {
        inputType: "IFRSServiceConfig"
    }
})
export class FRSAgent extends Agent.Base<IFRSServiceConfig> {
    public Start() {
        
    }

    public Stop() {
        
    }

    private sjLiveFaces: Subject<RecognizedUser | UnRecognizedUser> = new Subject();
    @Agent.Function({
        inputType: "IEnableLiveFaces",
        description: "Enable live recognized face & unrecognized face via websocket."
    })
    public EnableLiveFaces(config: IEnableLiveFaces): Observable<RecognizedUser | UnRecognizedUser> {
        return this.sjLiveFaces.asObservable();
    }
}

// console.log('???')
// new FRSAgent({} as any);
