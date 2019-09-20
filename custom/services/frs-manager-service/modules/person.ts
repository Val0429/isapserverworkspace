import { Response } from '~express/lib/response';
import { FRSManagerService } from '../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-manager-service/libs/core';

interface ICompareFace {
    image1Base64: string;
    image2Base64: string;
}

interface ICreatePerson {
    imageBase64: string;
    floorIds: string[];
    companyId?: string;
    organization?: string;

    name: string;
    email: string;
    nric?: string;
    phone?: string;
    remark?: string;
    
    startDate: Date;
    endDate?: Date;
}

interface IOutputCreatePerson {
    objectId: string;
    card: number;
}

interface ICreateBlacklistPerson {
    imageBase64?: string;
    organization?: string;
    name: string;
    nric?: string;
    remark: string;
}

interface IOutputCreateBlacklistPerson {
    objectId: string;
    personId: string;
}

declare module "workspace/custom/services/frs-manager-service" {
    interface FRSManagerService {
        compareFace(face: ICompareFace, times?: number): Promise<{ result: string; score: number; }>;

        createPerson(person: ICreatePerson, times?: number): Promise<IOutputCreatePerson>;
        deletePerson(personId: string, times?: number): Promise<any>;

        createBlacklistPerson(blacklist: ICreateBlacklistPerson, times?: number): Promise<IOutputCreateBlacklistPerson>;
        deleteBlacklistPerson(blacklistId: string, times?: number): Promise<any>;
    }
}

FRSManagerService.prototype.compareFace = async function(face: ICompareFace, times: number = 0): Promise<{ result: string; score: number; }> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        const url: string = this.makeUrl(`setting/frs/compare-face`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, ...face }
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
    }, times, "FRSManagerService.compareFace");
}

FRSManagerService.prototype.createPerson = async function(person: ICreatePerson, times: number = 0): Promise<IOutputCreatePerson> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        
        const url: string = this.makeUrl(`person/visitor`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, ...person }
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
    }, times, "FRSManagerService.createPerson");
}

FRSManagerService.prototype.deletePerson = async function(objectId: string, times?: number): Promise<any> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        
        const url: string = this.makeUrl(`person/visitor`);
        request({
            url, method: 'DELETE', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, objectId }
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
    }, times, "FRSManagerService.createPerson");
}

FRSManagerService.prototype.createBlacklistPerson = async function(blacklist: ICreateBlacklistPerson, times?: number): Promise<IOutputCreateBlacklistPerson> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        
        const url: string = this.makeUrl(`person/visitor-blacklist`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, ...blacklist }
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
    }, times, "FRSManagerService.createBlacklistPerson");
}

FRSManagerService.prototype.deleteBlacklistPerson = async function(objectId: string, times?: number): Promise<any> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        
        const url: string = this.makeUrl(`person/visitor-blacklist`);
        request({
            url, method: 'DELETE', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, objectId }
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
    }, times, "FRSManagerService.deleteBlacklistPerson");
}
