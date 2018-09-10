import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, EventStrictCompareFace, IEventStrictCompareFace
} from 'core/cgi-package';

import { Pin } from 'services/pin-code/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../custom/models/invitations';
import { tryCheckInWithPinCode } from './__api__/core';
import FRS from './../../../custom/services/frs-service';

export interface Input {
    pin: Pin;

    image: string;
}

export interface Output {
    score: number;
}

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    let { pin, image } = data.inputType;

    let { owner, invitation, result, company, visitor } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, visitor, kiosk, image: null, score: 0 };

    let saveEvent = async () => {
        let pimage = await FileHelper.toParseFile(image);
        eventData.image = pimage;
        /// save event
        let event = new EventStrictCompareFace(eventData);
        Events.save(event);
    }
    /// get images
    let images: Parse.File[] = [
        ...(visitor.getValue("image") ? [visitor.getValue("image")] : []),
        ...( ((visitor.getValue("idcard") || {}) as any).images || [] )
    ];
    if (images.length === 0) throw Errors.throw(Errors.CustomBadRequest, ["No valid uploaded image or idcard."]);

    /// Send compare
    var score = 0;
    for (var imageFile of images) {
        var url = imageFile.url();
        /// todo, make it right.
        url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
        var res = await Parse.Cloud.httpRequest({ url });
        var b64image = res.buffer.toString('base64');
        try {
            let compResult = await FRS.compareFace(b64image, FileHelper.removeBase64Meta(image));
            score = Math.max(score, compResult);
        } catch(e) { throw JSON.stringify(e) }
    }
    eventData.score = score;

    saveEvent();

    return {
        score
    }
});
