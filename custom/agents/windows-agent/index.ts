import { Agent } from 'models/agents';
var os = require('os');

import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';

import * as fs from 'fs';
const screenshot = require('screenshot-desktop');
import { doClick, doRightClick, doDoubleClick } from './lib/libmouseclick';
import { Log } from 'helpers/utility';
import { Binary } from 'bson';

interface IOutputFreeMemory {
    value: number;
}

interface IOutputFreeMemory2 {
    value: Buffer;
}

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
interface IOutputDesktop {
    image: Buffer;
}

interface Test1 {
    type: "Person" | "Group";
    change: "create" | "modify" | "delete";
}
interface Test2 {

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
        return new Observable( (observer: Observer<any>) => {
            fs.readdir(config.path, (err, files) => {
                if (err) return observer.error(err);
                observer.next(files);
                observer.complete();
            });
        });
    }

    @Agent.Function({
        inputType: "any",
        outputType: "IOutputFreeMemory",
        description: "Free memory."
    })    
    public FreeMemory(): Observable<IOutputFreeMemory> {
        return this.makeObservable<IOutputFreeMemory>((observer, isStopped) => {
            observer.next({
                value: os.freemem()
            });
            observer.complete();
        });
    }

    @Agent.Function({
        inputType: "any",
        outputType: "IOutputFreeMemory2",
        description: "Free memory."
    })    
    public FreeMemory2(): Observable<IOutputFreeMemory2> {
        return this.makeObservable<IOutputFreeMemory2>((observer, isStopped) => {
            let timer = setInterval( () => {
                observer.next({
                    value: new Buffer(os.freemem()+"", "utf8")
                });
                isStopped() && clearInterval(timer);
            }, 1000);
        });
    }

    @Agent.Function({
        inputType: "IListDirectory",
        description: "Download file."
    })
    public Download(config: IListDirectory): Observable<IOutputDownload> {
        return new Observable( (observer: Observer<IOutputDownload>) => {
            let data = fs.readFileSync(config.path).toString('base64');
            observer.next({
                path: config.path,
                data
            });
            observer.complete();
        });
    }

    @Agent.Function({
        outputType: "IOutputDesktop",
        description: "Stream desktop image back."
    })
    public Desktop(): Observable<IOutputDesktop> {
        return this.makeObservable( (observer, isStopped) => {
            screenshot().then( (image) => {
                observer.next({ image });
                observer.complete();
            });
        });
        // return new Observable( (observer: Observer<IOutputDesktop>) => {
        //     setInterval( () => {
        //         let token = `take snapshot ${new Date().valueOf()}`;
        //         console.time(token)
        //         screenshot().then((image) => {
        //             console.timeEnd(token);
        //             console.log('length', image.length);
        //             //observer.next(img.toString('base64'));
        //             observer.next({ image });
        //         });
        //     }, config.interval);
        //     // observer.complete();
        // });
    }

    @Agent.Function({
        inputType: "IMouseEvent",
        description: "Send mouse event."
    })
    public TeamViewer(config: IMouseEvent): Observable<void> {
        return new Observable( (observer: Observer<void>) => {
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
