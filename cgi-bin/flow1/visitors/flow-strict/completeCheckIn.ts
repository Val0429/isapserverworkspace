import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject, FileHelper, Config,
    Events,
    Flow1Invitations,
    EventFlow1StrictCompleteCheckIn,
    Flow1Visitors
} from 'core/cgi-package';

import { Pin } from 'services/pin-code';
import { tryCheckInWithPinCode } from './__api__/core';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/group-and-person';
import { Flow1WorkPermit } from 'workspace/custom/models/Flow1/crms/work-permit';

type Invitations = Flow1Invitations;

type EventStrictCompleteCheckIn = EventFlow1StrictCompleteCheckIn;
let EventStrictCompleteCheckIn = EventFlow1StrictCompleteCheckIn;

export interface Input {
    pin: Pin;

    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
    /**
     * Raffle Link special
     */
    unitNumber?: string;
    vehicleNumber?: string;

    liveFace: string;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk],
    postSizeLimit: 100*1024*1024
})
.post(async (data) => {
const FRS = FRSService.sharedInstance();
    let { pin, name, images, idnumber, birthdate, unitNumber, vehicleNumber, liveFace } = data.inputType;
    let request = data.request;

    let { owner, invitation, result, company, visitors, index } = await tryCheckInWithPinCode(pin);
    /// find out visitor
    let idx = visitors.findIndex( (value) => {
        return value.attributes.name === name;
    });
    let visitor: Flow1Visitors;
    if (idx >= 0) visitor = visitors[idx];
    else {
        /// get back WorkPermit!
        let workPermit = await new Parse.Query(Flow1WorkPermit)
            .equalTo("invitation", invitation)
            .include("company")
            .first();
        let company = workPermit.getValue("company");
        /// add new visitor
        visitor = new Flow1Visitors({
            name,
            phone: "",
            idcard: {
                name,
                birthdate,
                idnumber,
                images
            },
            company,

            contractorCompanyName: workPermit.getValue("contractorCompanyName"),
            unitNumber,
            vehicle: vehicleNumber
        });
        await visitor.save();
        /// save into invitation
        visitors.push(visitor);
        invitation.setValue("visitors", visitors);
        await invitation.save();

        /// save backto workPermit
        let persons = workPermit.getValue("persons");
        persons.push({
            name,
            nric: idnumber,
            companyName: company.getValue("name"),
            unitNo: unitNumber,
            vehicle: vehicleNumber,
            occupation: "",
            phone: "",
            shift: ""
        });
        workPermit.setValue("persons", persons);
        await workPermit.save();
    }

    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, kiosk, visitor, visitorName: name };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictCompleteCheckIn(eventData);
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, kiosk, purpose, visitor, visitorName: name});
    }
    saveEvent();
    
    /// enroll into FRS
    /// 1) get all groups
    /// 1.1) find visitor group. if no go 1.2)
    /// 1.2) create visitor group
    /// 2) create person
    /// 2.1) find last compare face
    /// 2.2) create person
    /// 2.3) add person into group
    
    /// 1)
    //let acgroups = ["Visitor", ...invitation.getValue("accessGroups").map( (v) => v.doorName )];
    let acgroups = invitation.getValue("accessGroups").map( (v) => v.doorName );
    let groups = await FRS.getGroupList();
    /// 1.1)
    let groupids: any[] = groups.reduce<any[]>( (final, value) => {
        //if (final) return final;
        //if (value.name === 'Visitor') return value.group_id;
        if (acgroups.indexOf(value.name) >= 0) final.push({id: value.group_id, groupname: value.name});
        return final;
    }, []);
    /// 1.2)
    //if (groupid === undefined) {
    //    let res = await FRS.createGroup("Visitor");
    //    groupid = res.group_id;
    //}
    /// 2)
    /// 2.1)
    /// 2.2)
    let person = await FRS.createPerson(name, liveFace, '', invitation.getValue("dates")[index].end, groupids);
    /// 2.3)
    //for (let groupid of groupids) {
    //    await FRS.applyGroupsToPerson(person.person_id, groupid);
    //}
    //let rr = await FRS.applyGroupsToPerson(person.person_id, groupids);

    return ParseObject.toOutputJSON({
        invitation: {
            ...invitation.attributes,
            visitors: invitation.attributes.visitors.map( (v) => v.attributesRemovePrivacy )
        }
    });
});

