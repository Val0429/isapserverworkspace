import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, Flow1Invitations
} from 'core/cgi-package';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/compare-face';

export interface Input {
    cardImage: string;
    liveImage: string;
}

export interface Output {
    score: number;
    result: boolean;
}

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk],
    postSizeLimit: 1024*1024*10
})
.post(async (data) => {
    const FRS = FRSService.sharedInstance();
    let { cardImage, liveImage } = data.inputType;

    /// Send compare
    let score = 0;
    try {
        let compResult = await FRS.compareFace({
            image1: FileHelper.removeBase64Meta(cardImage),
            image2: FileHelper.removeBase64Meta(liveImage)
        });
        score = Math.max(score, +(compResult as any).score);
    } catch(e) {
        throw JSON.stringify(e);
    }
    let scoreResult = score >= Config.vms.compareFaceThreshold;

    return {
        score,
        result: scoreResult
    }
});
