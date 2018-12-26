import { Agent } from 'models/agents';

import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';

import * as fs from 'fs';
const screenshot = require('screenshot-desktop');
import { doClick, doRightClick, doDoubleClick } from './lib/libmouseclick';
import { Log } from 'helpers/utility';

interface IListDirectory {
    path: string;
}

interface IOutputDownload {
    path: string;
    data: string;
}

interface IMouseEvent {
    type: "left" | "right" | "double";
    x: number;
    y: number;
}

interface IDesktop {
    interval: number;
}

@Agent.Register({
    name: "Windows Agent",
    description: "Windows machine agent.",
    initialize: {
        inputType: "any"
    }
})
export class WindowsAgent extends Agent.Base<any> {
    protected doStart() {}
    protected doStop() {}

    @Agent.Function({
        inputType: "IListDirectory",
        description: "List Windows machine's directory."
    })
    public ListDirectory(config: IListDirectory): Observable<string[]> {
        return Observable.create( (observer: Observer<any>) => {
            fs.readdir(config.path, (err, files) => {
                if (err) return observer.error(err);
                observer.next(files);
                observer.complete();
            });
        });
    }

    @Agent.Function({
        inputType: "IListDirectory",
        description: "Download file."
    })
    public Download(config: IListDirectory): Observable<IOutputDownload> {
        return Observable.create( (observer: Observer<IOutputDownload>) => {
            let data = fs.readFileSync(config.path).toString('base64');
            observer.next({
                path: config.path,
                data
            });
            observer.complete();
        });
    }

    @Agent.Function({
        inputType: "any",
        description: "Stream desktop image back."
    })
    public Desktop(config: IDesktop): Observable<string> {
        config.interval = config.interval || 300;
        return Observable.create( (observer: Observer<string>) => {
            setInterval( () => {
                let token = `take snapshot ${new Date().valueOf()}`;
                console.time(token)
                screenshot().then((img) => {
                    console.timeEnd(token);
                    console.log('length', img.length);
                    observer.next(img.toString('base64'));
                });
            }, config.interval);
            // observer.complete();
        });
    }

    @Agent.Function({
        inputType: "IMouseEvent",
        description: "Send mouse event."
    })
    public TeamViewer(config: IMouseEvent): Observable<void> {
        return Observable.create( (observer: Observer<void>) => {
            switch (config.type) {
                case "left":
                    Log.Info("TeamViewer", `Single Click on (${config.x}, ${config.y})`);
                    doClick(config); break;
                case "right":
                    Log.Info("TeamViewer", `Right Click on (${config.x}, ${config.y})`);
                    doRightClick(config); break;
                case "double":
                    Log.Info("TeamViewer", `Double Click on (${config.x}, ${config.y})`);
                    doDoubleClick(config); break;
                default:
                    break;
            }
            observer.complete();
        });
    }
}
