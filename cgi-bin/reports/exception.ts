import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, EventSubjects, ParseObject,
    Action, Errors, EventStrictCompareFace, O,
} from 'core/cgi-package';

export interface Input {
    start: Date;
    end: Date;
    kioskIds: string;
}

export interface OutputData {
    totalException: number;
    date: string;
}

export interface Output {
    data: OutputData[];
}

var action = new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

action.get({inputType: "Input"}, async (data) => {
    let kiosks: string[] = data.inputType.kioskIds.split(",");

    /// query all
    let query = await new Parse.Query(EventStrictCompareFace)
        .greaterThanOrEqualTo("createdAt", data.inputType.start)
        .lessThan("createdAt", data.inputType.end)
        .select("kiosk", "score")
        .find();

    /// arrange
    let index: { [date: string]: number } = {};
    for (let col of query) {
        /// filter out high score result
        if (col.attributes.score >= 0.7) continue;
        let createdAt = col.createdAt;
        let kioskid = O(col.attributes.kiosk).id;
        if (!kioskid) continue;
        if (kiosks.indexOf(kioskid) < 0) continue;
        let datestring = `${createdAt.getFullYear()}-${createdAt.getMonth()+1}-${createdAt.getDate()}`;
        index[datestring] = (index[datestring] || 0)+1;
    }

    /// sort out
    let result: OutputData[] = [];
    for (let key in index) {
        let value = index[key];
        result.push({
            totalException: value,
            date: key
        });
    }

    return {
        data: result
    }

});

export default action;
