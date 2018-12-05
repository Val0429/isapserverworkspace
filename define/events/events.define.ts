import { Config } from './../../../models/events/events.define';

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Config[] = [
    /// 100~ for system ////////////////////////
    ["101", "ConfigChanged", `
        key: string;
        value: any;
    `],
    ////////////////////////////////////////////
];

export default events;
