var config: Config = {
    flow: "Flow1",
    compareFaceThreshold: 0.7,
    workerExpiredDay: 150,
    privacyFields: [
        "name",
        "phone",
        "email"
    ]
};
export default config;

type Flow = 'Flow1';
export type IPrivacyFields = 'name' | 'phone' | 'email' | 'image' | 'idcard';

export interface Config {
    flow: Flow;
    compareFaceThreshold: number;

    workerExpiredDay: number;

    privacyFields: IPrivacyFields[];
}
