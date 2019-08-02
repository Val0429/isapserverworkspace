import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import { createMongoDB } from 'helpers/parse-server/parse-helper';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

interface ISearch {
    start: Date;
    end: Date;
}

interface ISource {
    fid: string;
    frsId: string;
    channel: string;
    snapshot: string;
}

interface IOutputSearchData {
    source: ISource;
    url: string;
    timestamp: Date;
}

interface IOutputSearchUnit {
    startperiod: Date;
    data: IOutputSearchData;
}
type IOutputSearch = IOutputSearchUnit[];

/// R: get search //////////////////////////
type InputR = Restful.InputR<ISearch>;
type OutputR = Restful.OutputR<IOutputSearchUnit>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let { start, end } = data.inputType;
    console.log('server query start', start.toISOString(), end.toISOString());
    console.time("server query total cost");
    let final: IOutputSearch = [];
    const { client, db } = await createMongoDB();
    this.db = db;
    this.client = client;
    let col = db.collection("NxNRecords");
    let result = await col.find({
        $and: [
            { timestamp: { $gte: start } },
            { timestamp: { $lt: end } }
        ]
    }).sort({ timestamp: 1 }).toArray();

    /// consolidate result
    let lastTime: Date;
    let summary;
    let summarize = () => {
        if (!summary) return;
        let keys = Object.keys(summary);
        if (keys.length === 0) return;
        let ary = keys.map( (key) => {
            return summary[key];
        });
        final.push({
            startperiod: new Date( ary[0].timestamp.valueOf() - (ary[0].timestamp.valueOf() % (10*60*1000)) ),
            data: ary as any
        });
    }
    for (let data of result) {
        let { _fid, source, url, timestamp } = data;
        // if (_fid === "UvS-7YoRp" || _fid === "e0edyMzrhO") _fid = "HYUJzU_AJ";
        if (!lastTime ||
            ( Math.floor(lastTime.valueOf() / (10*60*1000)) !== Math.floor(timestamp.valueOf() / (10*60*1000)) )
            ) {
            /// remake summary
            if (summary) {
                summarize();
            }
            summary = {};
        }
        lastTime = timestamp;
        let key = `${_fid}/${source.frsId}/${source.channel}`;
        if (summary[key]) continue;
        summary[key] = {
            source: { fid: _fid, ...source, faceFeature: undefined }, url, timestamp
        };
    }
    summarize();
    console.timeEnd("server query total cost");

    return final as any;
    //return ParseObject.toOutputJSON(final) as any;
});
///////////////////////////////////////////

export default action;
