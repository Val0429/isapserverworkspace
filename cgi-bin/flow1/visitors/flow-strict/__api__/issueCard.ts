
// Actions:

// (A) Save into Enrolled Database
//     with column: invitation, visit_date, person_id, cardno, name, image
// (B) Do Enroll into FRS & Hikvision Tablet
// (C) Check Invitation
// (D) Issue VisitorCode
// (E) Email encoded VisitorCode (QRCode)

// When:

// 1) When Visitor walk-in & check-in complete
// 	2.1) do (D) (E) (B) (A).
// 2) When Visitor do pre-register complete (or invitation complete & already pre-registered)
// 	1.1) If the day is today, do (D) (E) (B) (A).
// 	1.2) If not today, do nothing.
// 3) At Everyday 00:00 or when Server Restart
// 	3.1) Check (A) for outdated data, and then remove (B) (A)
// 	3.2) do (C) & today & only if not exists in A), do (D) (E) (B) (A)

import QRCode from 'services/qr-code';
import VisitorCode from 'workspace/custom/services/visitor-code';
import { HikvisionTablet } from 'services/hikvision-tablet';
import { ScheduleControllerEmail_IssueCard } from 'workspace/custom/schedulers/controllers/email-@issue-card';
import { getOutdatedCardsByDate, getInvitationByDate } from './core';
import { IEnrolledCards, EnrolledCards } from 'workspace/custom/models/enrolledCards';
import { Tablets } from 'workspace/custom/models/tablets';

type IIssueCard = Pick<IEnrolledCards, "name" | "email" | "invitation">;
export async function IssueCard(data: IIssueCard): Promise<EnrolledCards> {
    let { name, email, invitation } = data;

    /// (D)
    let visitorcode = await VisitorCode.next();
    /// (E)
    let qrcode = await QRCode.make(visitorcode);
    let today = new Date();
    let enroll = new EnrolledCards({
        visitDate: today,
        invitation,
        cardno: visitorcode,
        name,
        email,
        qrcode
    });
    new ScheduleControllerEmail_IssueCard()
        .do(enroll);
    /// (B)
    let tablets = await new Parse.Query(Tablets)
        .find();
    if (tablets) {
        for (let tablet of tablets) {
            let tabletController = HikvisionTablet.getInstance(tablet.attributes);
            tabletController.createCard({
                cardno: visitorcode,
                name
            });
        }
    }
    /// (A)
    await enroll.save();
    return enroll;
}

export async function IssueCardDaily() {
    // Actions:

    // (A) Save into Enrolled Database
    //     with column: invitation, visit_date, person_id, cardno, name, image
    // (B) Do Enroll into FRS & Hikvision Tablet
    // (C) Check Invitation
    // (D) Issue VisitorCode
    // (E) Email encoded VisitorCode (QRCode)

    // 3) At Everyday 00:00 or when Server Restart
    // 	3.1) Check (A) for outdated data, and then remove (B) (A)
    let today = new Date();
    let outdated = await getOutdatedCardsByDate(today);
    if (outdated && outdated.length > 0) {
        let tablets = await new Parse.Query(Tablets).find();
        outdated.forEach( (outdateCard) => {
            let { cardno, email, visitDate } = outdateCard.attributes;
            tablets.forEach( (tablet) => {
                HikvisionTablet.getInstance(tablet.attributes).removeCard({ cardno });
            });
            outdateCard.destroy();
        });
    }
    // 	3.2) do (C) & today & only if not exists in A), do (D) (E) (B) (A)
    let invitations = await getInvitationByDate(today);
    let valids = await getOutdatedCardsByDate(today, true);
    /// filter out with already valid
    let validMap = valids.reduce((final, o) => {
        let { invitation } = o.attributes;
        if (!invitation) return final;
        final[invitation.id] = true;
        return final;
    }, {});
    invitations = invitations.filter( (o) => {
        if (validMap[o.id]) return false;
        return true;
    });

    for (let invitation of invitations) {
        let visitor = invitation.attributes.visitor;
        try {
            await visitor.fetch();
        } catch(e) {
            continue;
        }
        let { name, email } = visitor.attributes;
        await IssueCard({
            invitation, name, email
        });
    }

}