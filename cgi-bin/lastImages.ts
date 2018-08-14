import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import frs from 'workspace/custom/services/frs-service';
import { RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/core';
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
    console.log(data.parameters, alive);
    let pureListen = (data.parameters.pureListen as any as string) === 'true' ? true : false;

    // console.log(data.parameters, start, end);

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
    var searchedFaces = frs.lastImages(start, end, { excludeFaceFeature: true });
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
            .subscribe( (data) => {
                socket.send( JSON.stringify({...data, face_feature: undefined}) );
            });
    }

    /// buffer live faces until searched face complete
    if (pureListen) {
        fetchFaces();

    } else if (alive && !pureListen) {
        liveFaces
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
                for (let input of data) socket.send(JSON.stringify(input));

                fetchFaces();
            });
    }

});

export default action;