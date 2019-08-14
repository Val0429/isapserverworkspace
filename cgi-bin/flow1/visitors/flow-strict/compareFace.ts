import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, EventFlow1StrictCompareFace, Flow1VisitorStatus, Flow1Invitations
} from 'core/cgi-package';

import { Pin } from 'services/pin-code';
import { tryCheckInWithPinCode } from './__api__/core';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/compare-face';

type Invitations = Flow1Invitations;
type VisitorStatus = Flow1VisitorStatus;
let VisitorStatus = Flow1VisitorStatus;
type EventStrictCompareFace = EventFlow1StrictCompareFace;
let EventStrictCompareFace = EventFlow1StrictCompareFace;


export interface Input {
    pin: Pin;

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
    let { pin, cardImage, liveImage } = data.inputType;

    let { owner, invitation, result, company, visitors } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, kiosk, image: null, score: 0, result: false };

    let saveEvent = async () => {
        let pimage = await FileHelper.toParseFile(liveImage);
        let purpose = invitation.getValue("purpose");
        eventData.image = pimage;
        /// save event
        let event = new EventStrictCompareFace(eventData);
        Events.save(event, {owner, invitation, company, kiosk, purpose});
    }

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

    eventData.score = score;
    let scoreResult = score >= Config.vms.compareFaceThreshold;
    eventData.result = scoreResult;

    saveEvent();

    return {
        score,
        result: scoreResult
    }
});
