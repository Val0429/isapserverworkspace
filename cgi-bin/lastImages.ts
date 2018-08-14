import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import frs from 'workspace/custom/services/frs-service';
import { UserType, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/core';
import { filterFace } from 'workspace/custom/services/frs-service/filter-face';

export interface Input {
    sessionId: string;
    /**
     * start, end time of faces.
     * if null, load default time.
     */
    start?: number;
    end?: number;
    /**
     * ignore search part.
     */
    pureListen?: boolean;
    /**
     * keep returning latest faces.
     */
    alive?: boolean;
    /**
     * name filter.
     */
    name?: string;
    /**
     * groups filter.
     */
    groups?: string;
    /**
     * cameras filter.
     */
    cameras?: string;
}

var action = new Action<Input>({
    loginRequired: true,
});

action.ws(async (data) => {
    var socket = data.socket;

    let subscription;
    socket.io.on("close", () => {
        subscription && subscription.unsubscribe();
    });

    let start = data.parameters.start ? +data.parameters.start : null;
    let end = data.parameters.end ? +data.parameters.end : null;
    let alive = (data.parameters.alive as any as string) === 'true' ? true : false;
    let pureListen = (data.parameters.pureListen as any as string) === 'true' ? true : false;
    let name = data.parameters.name ? data.parameters.name : null;
    let groups = data.parameters.groups ? data.parameters.groups.split(",") : null;
    let cameras = data.parameters.cameras ? data.parameters.cameras.split(",") : null;

    // /// old method
    // var subscription = frs.lastImages(start, end, { excludeFaceFeature: true })
    //     .subscribe({
    //         next: (data) => {
    //             socket.send(JSON.stringify(data));
    //         },
    //         complete: () => {
    //             socket.closeGracefully();
    //         }
    //     });

    /// new method
    var searchedFaces = frs.lastImages(start, end, { excludeFaceFeature: true, name, groups, cameras });
    var liveFaces = frs.sjLiveFace;

    /// search face until complete
    if (!pureListen) {
        subscription = searchedFaces
            .subscribe({
                next: (data) => {
                    socket.send(JSON.stringify(data));
                },
                complete: () => {
                    if (!alive) socket.closeGracefully();
                }
            });
    }

    /// get last face
    let lastSearchedFace = searchedFaces.takeLast(1);
    let pLastSearchedFace = lastSearchedFace.toPromise();

    /// final step: fetch new faces
    let fetchFaces = () => {
        /// hook new faces
        subscription = liveFaces
            .filter( localFilter )
            .subscribe( (data) => {
                Send(data);
            });
    }

    let localFilter = (data: RecognizedUser | UnRecognizedUser): boolean => {
        /// filter name, groups, cameras
        /// 1) name
        if (name) {
            if (data.type === UserType.UnRecognized) return false;
            else if (data.type === UserType.Recognized && data.person_info.fullname.indexOf(name) < 0) return false;
        }
        /// 2) groups
        if (groups) {
            if (data.type === UserType.UnRecognized && groups.indexOf("No Match") < 0) return false;
            else if (data.type === UserType.Recognized) {
                let groupname = data.groups === null || data.groups.length === 0 ? null : data.groups[0].name;
                if (groupname === null) return false;
                if (groups.indexOf(groupname) < 0) return false;
            }
        }

        /// 3) cameras
        if (cameras) {
            if (cameras.indexOf(data.channel) < 0) return false;
        }

        return true;
    }

    let Send = (data: RecognizedUser | UnRecognizedUser) => {
        socket.send(JSON.stringify({...data, face_feature: undefined}));
    }

    /// buffer live faces until searched face complete
    if (pureListen) {
        fetchFaces();

    } else if (alive && !pureListen) {
        liveFaces
            .filter( localFilter )
            .bufferWhen( () => lastSearchedFace )
            .first()
            .subscribe( async (data) => {
                /// merge faces input while searching faces
                let lastface = await pLastSearchedFace;
                if (lastface) {
                    while (data.length > 0) {
                        let current = data[0];
                        let timestamp = current.timestamp;
                        if (lastface.timestamp < timestamp) break;
                        /// todo. get multiple faces with same timestamp
                        data.shift();
                    }
                }
                /// output latest face
                for (let obj of data) Send(obj);

                fetchFaces();
            });
    }

});

export default action;