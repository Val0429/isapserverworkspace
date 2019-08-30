import { routerBlock } from "helpers/routers/router-block";

var config: Config = {
    flow: "Flow1",
    compareFaceThreshold: 0.7,
    workerExpiredDay: 30,
    privacyFields: [
        "name",
        "phone",
        "email",
        "image",
        "idcard"
    ],
    crmsWebPort: 6061,
    strictMode: false
};
export default config;

type Flow = 'Flow1' | 'Flow2';
export type IPrivacyFields = 'name' | 'phone' | 'email' | 'image' | 'idcard';

export interface Config {
    flow: Flow;
    compareFaceThreshold: number;
    workerExpiredDay: number;
    privacyFields: IPrivacyFields[];
    crmsWebPort: number;
    strictMode: boolean;
}

/// config router blocking
routerBlock(/^flow/, config.flow.toLowerCase());