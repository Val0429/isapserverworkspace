import { Response } from '~express/lib/response';
import { FRSService } from '../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-service/libs/core';
import { padLeft } from 'helpers/utility';

interface IGroupInfo {
    name: string;
    group_id: string;
}

interface IResponsePersonInfo {
    person_id: string;
}

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        getGroupList(): Promise<IGroupInfo[]>;
        createGroup(name: string): Promise<IGroupInfo>;
        createPerson(name: string, image: string, employeeno?: string, expirationDate?: Date, groups?: string[]): Promise<IResponsePersonInfo>;
        applyGroupsToPerson(personId: string, groupId: string | string[]): Promise<any>;
    }
}

FRSService.prototype.getGroupList = async function(times: number = 0): Promise<IGroupInfo[]> {
    return retry<IGroupInfo[]>( async (resolve, reject) => {
        await this.waitForLogin();
        const url: string = this.makeUrl(`frs/cgi/getgrouplist`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { session_id: this.sessionId, page_size: 999, skip_pages: 0 }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            return resolve(body.group_list.groups);
        });
    }, times, "FRSService.getGroupList");
}

FRSService.prototype.createGroup = async function(name: string, times: number = 1): Promise<IGroupInfo> {
    return retry<IGroupInfo>( async (resolve, reject) => {
        await this.waitForLogin();
        const url: string = this.makeUrl(`frs/cgi/creategroup`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { session_id: this.sessionId, name, group_info: { actions: [] } }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            return resolve(body);
        });
    }, times, "FRSService.createGroup");
}

FRSService.prototype.createPerson = async function(name: string, image: string, employeeno?: string, expirationDate?: Date, groups?: string[], times: number = 1): Promise<IResponsePersonInfo> {
    return retry<IResponsePersonInfo>( async (resolve, reject) => {
        await this.waitForLogin();
        const url: string = this.makeUrl(`frs/cgi/createperson`);

        const convertDateString = (date: Date): string => {
            return `${padLeft(date.getMonth()+1, 2)}/${padLeft(date.getDate(), 2)}/${date.getFullYear()} ${padLeft(date.getHours(), 2)}:${padLeft(date.getMinutes(), 2)}:${padLeft(date.getSeconds(), 2)}`;
        }
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: {
                session_id: this.sessionId,
                person_info: {
                    fullname: name,
                    employeeno,
                    expiration_date: !expirationDate ? undefined : convertDateString(expirationDate),
		    group_list: groups
                },
                image
            }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            return resolve(body);
        });
    }, times, "FRSService.createPerson");
}

FRSService.prototype.applyGroupsToPerson = async function(personId: string, groupId: string | string[], times: number = 1): Promise<any> {
    let groupIds = typeof groupId === 'string' ? [groupId] : groupId;
    return retry<IResponsePersonInfo>( async (resolve, reject) => {
        await this.waitForLogin();
        const url: string = this.makeUrl(`frs/cgi/applypersontogroups`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: {
                session_id: this.sessionId,
                person_id: personId,
                group_id_list: groupIds
            }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            return resolve(body);
        });
    }, times, "FRSService.applyGroupsToPerson");
}
