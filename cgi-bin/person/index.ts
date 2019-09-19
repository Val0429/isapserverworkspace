import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, FRS, Suntec, EntryPass, HikVision, DateTime } from '../../custom/helpers';
import * as Middleware from '../../custom/middlewares';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 *
 */
export namespace FRSService {
    /**
     * Login
     * @param config
     */
    export async function Login(config: FRS.IConfig): Promise<FRS> {
        try {
            let frs: FRS = new FRS();
            frs.config = config;

            frs.Initialization();

            await frs.Login();

            return frs;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Verify Blacklist
     * @param buffer
     * @param config
     */
    export async function VerifyBlacklist(buffer: Buffer, config: FRS.IConfig): Promise<void> {
        try {
            let frs: FRS = await Login(config);

            let face = await frs.VerifyBlacklist(buffer, 0.9);
            if (!!face) {
                throw 'this face was in blacklist';
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Add Blacklist
     * @param name
     * @param buffer
     * @param config
     */
    export async function AddBlacklist(name: string, buffer: Buffer, config: FRS.IConfig): Promise<string> {
        try {
            let frs: FRS = await Login(config);

            let groups = await frs.GetUserGroups();
            let blacklist = groups.find((n) => n.name.toLocaleLowerCase() === 'blacklist');
            if (!blacklist) {
                throw 'group blacklist not found';
            }

            let personId: string = await frs.AddPerson(name, new Date(2035, 0, 1, 0, 0, 0, 0), [blacklist], buffer);

            return personId;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Remove Blacklist
     * @param personId
     * @param config
     */
    export async function RemoveBlacklist(personId: string, config: FRS.IConfig): Promise<void> {
        try {
            let frs: FRS = await Login(config);

            try {
                await frs.RemovePerson(personId);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        } catch (e) {
            throw e;
        }
    }
}

/**
 *
 */
export namespace SuntecAppService {
    /**
     * Suntec App Create
     * @param person
     * @param buildingName
     * @param companyName
     * @param config
     */
    export async function Create(person: IDB.PersonStaff, building: IDB.LocationBuildings, company: IDB.LocationCompanies, config: IDB.ISettingSuntecApp): Promise<void> {
        try {
            if (person.getValue('isUseSuntecReward')) {
                let buildingName: string = !building ? '' : building.getValue('name');
                let companyName: string = !company ? '' : company.getValue('name');

                let suntec = Suntec.Suntec.getInstance();
                suntec.setConnection({
                    protocal: 'https',
                    host: config.host,
                    token: config.token,
                });

                await suntec.signup({
                    AccessId: person.id,
                    Email: person.getValue('email'),
                    FirstName: person.getValue('name'),
                    OfficeBuilding: buildingName,
                    CompanyName: companyName,
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Suntec App Delete
     * @param person
     * @param config
     */
    export async function Delete(person: IDB.PersonStaff, config: IDB.ISettingSuntecApp): Promise<void> {
        try {
            if (person.getValue('isUseSuntecReward')) {
                let suntec = Suntec.Suntec.getInstance();
                suntec.setConnection({
                    protocal: 'https',
                    host: config.host,
                    token: config.token,
                });

                await suntec.revoke({
                    AccessId: person.id,
                });
            }
        } catch (e) {
            throw e;
        }
    }
}

/**
 *
 */
export namespace EntryPassService {
    /**
     * EntryPass Create
     * @param person
     * @param accessGroup
     * @param config
     */
    export async function Create(person: IDB.PersonStaff | IDB.PersonVisitor, building: IDB.LocationBuildings, config: { ip: string; port: number; serviceId: string }): Promise<void> {
        try {
            let acsGroup: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
                .equalTo('building', building)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!acsGroup) {
                throw 'acs group not found';
            }

            let worker = EntryPass.CreateInstance(config.ip, config.port, config.serviceId);
            if (!!worker) {
                let staffInfo: EntryPass.EntryPassStaffInfo = {
                    name: person.get('name'),
                    serialNumber: person.id,
                };

                let cardInfo: EntryPass.EntryPassCardInfo = {
                    serialNumber: person.get('card').toString(),
                    accessGroup: acsGroup.getValue('group'),
                };

                let ret: EntryPass.OperationReuslt = await worker.AddCard(staffInfo, cardInfo);
                if (!ret.result) {
                    throw ret.errorMessage;
                }
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * EntryPass Delete
     * @param person
     * @param accessGroup
     * @param config
     */
    export async function Delete(person: IDB.PersonStaff | IDB.PersonVisitor, building: IDB.LocationBuildings, config: { ip: string; port: number; serviceId: string }): Promise<void> {
        try {
            let acsGroup: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
                .equalTo('building', building)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!acsGroup) {
                throw 'acs group not found';
            }

            let worker = EntryPass.CreateInstance(config.ip, config.port, config.serviceId);
            if (!!worker) {
                let staffInfo: EntryPass.EntryPassStaffInfo = {
                    name: person.get('name'),
                    serialNumber: person.id,
                };

                let cardInfo: EntryPass.EntryPassCardInfo = {
                    serialNumber: person.get('card').toString(),
                    accessGroup: acsGroup.getValue('group'),
                };

                let ret: EntryPass.OperationReuslt = await worker.DeleteCard(staffInfo, cardInfo);
                if (!ret.result) {
                    throw ret.errorMessage;
                }
            }
        } catch (e) {
            throw e;
        }
    }
}

/**
 *
 */
export namespace HikVisionService {
    /**
     * HikVision Login
     * @param config
     */
    export async function Login(config: HikVision.I_DeviceInfo): Promise<HikVision.Hikvision> {
        try {
            let hikVision = new HikVision.Hikvision();

            let deviceInfo: HikVision.I_DeviceInfo = config;

            let result = hikVision.createInstance(deviceInfo);
            if (!!result.result) {
                return hikVision;
            } else {
                throw result.errorMessage;
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get HikVision Date
     * @param config
     */
    export function GetDate(date: Date): HikVision.I_ValidPeriodTime {
        try {
            date = new Date(date || new Date(2035, 0, 1, 0, 0, 0, 0));
            20;
            let hikVisionDate: HikVision.I_ValidPeriodTime = {
                year: DateTime.ToString(date, 'YYYY'),
                month: DateTime.ToString(date, 'MM'),
                day: DateTime.ToString(date, 'DD'),
                hour: DateTime.ToString(date, 'HH'),
                minute: DateTime.ToString(date, 'mm'),
                second: DateTime.ToString(date, 'ss'),
            };

            return hikVisionDate;
        } catch (e) {
            throw e;
        }
    }

    /**
     * HikVision Create
     * @param person
     * @param buffer
     * @param floors
     */
    export async function Create(person: IDB.PersonStaff | IDB.PersonVisitor, buffer: Buffer, floors: IDB.LocationFloors[]): Promise<void> {
        try {
            let hikVisions: IDB.ClientHikVision[] = await new Parse.Query(IDB.ClientHikVision)
                .containedIn('floor', floors)
                .find()
                .fail((e) => {
                    throw e;
                });

            await Promise.all(
                hikVisions.map(async (value, index, array) => {
                    let hikVision: HikVision.Hikvision = await Login({
                        ipAddress: value.getValue('ip'),
                        port: value.getValue('port').toString(),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                    });

                    try {
                        let result = hikVision.createCardItem({
                            cardNo: person.get('card').toString(),
                            employeeNo: person.id,
                            name: person.get('name'),
                            beginTime: GetDate(person.get('startDate')),
                            endTime: GetDate(person.get('endDate')),
                        });
                        if (!result.result) {
                            throw result.errorMessage;
                        }

                        if (!!buffer) {
                            result = hikVision.enrollFace({
                                cardNo: person.get('card').toString(),
                                faceLen: buffer.length,
                                faceBuffer: buffer,
                            });
                            if (!result.result) {
                                throw result.errorMessage;
                            }
                        }
                    } catch (e) {
                        throw e;
                    } finally {
                        hikVision.disposeInstance();
                    }
                }),
            );
        } catch (e) {
            throw e;
        }
    }

    /**
     * HikVision Delete
     * @param person
     * @param floors
     */
    export async function Delete(person: IDB.PersonStaff | IDB.PersonVisitor, floors: IDB.LocationFloors[]): Promise<void> {
        try {
            let hikVisions: IDB.ClientHikVision[] = await new Parse.Query(IDB.ClientHikVision)
                .containedIn('floor', floors)
                .find()
                .fail((e) => {
                    throw e;
                });

            await Promise.all(
                hikVisions.map(async (value, index, array) => {
                    let hikVision: HikVision.Hikvision = await Login({
                        ipAddress: value.getValue('ip'),
                        port: value.getValue('port').toString(),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                    });

                    try {
                        let result = hikVision.removeCardItem(person.get('card').toString());
                        if (!result.result) {
                            throw result.errorMessage;
                        }

                        result = hikVision.removeFace(person.get('card').toString());
                        if (!result.result) {
                            throw result.errorMessage;
                        }
                    } catch (e) {
                        throw e;
                    } finally {
                        hikVision.disposeInstance();
                    }
                }),
            );
        } catch (e) {
            throw e;
        }
    }
}
