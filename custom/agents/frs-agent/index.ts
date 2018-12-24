import { Agent } from 'models/agents';

import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable } from 'rxjs';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/live-faces';
import 'workspace/custom/services/frs-service/modules/search-records';

interface IEnableLiveFaces {
    enable: boolean;
}

interface ISearchRecords {
    starttime: Date;
    endtime: Date;
}

@Agent.Register({
    name: "FRS Agent",
    description: "Middleware of FRS Service.",
    initialize: {
        inputType: "IFRSServiceConfig"
    }
})
export class FRSAgent extends Agent.Base<IFRSServiceConfig> {
    private frs: FRSService;
    constructor(config: IFRSServiceConfig, remote?: Agent.IRemoteAgent) {
        super(config, remote);
        this.frs = new FRSService(config);
    }

    public Start() {
        this.frs.start();
    }

    public Stop() {
        this.frs.stop();
    }

    @Agent.Function({
        inputType: "IEnableLiveFaces",
        description: "Enable live recognized face & unrecognized face via websocket."
    })
    public EnableLiveFaces(config: IEnableLiveFaces): Observable<RecognizedUser | UnRecognizedUser> {
        this.frs.enableLiveFaces(config.enable);
        return this.frs.sjLiveStream.asObservable();
    }

    @Agent.Function({
        
    })
    public SearchRecords(config: ISearchRecords): Observable<RecognizedUser | UnRecognizedUser> {
        return this.frs.searchRecords(config.starttime, config.endtime, undefined, 10).asObservable();
    }
}
