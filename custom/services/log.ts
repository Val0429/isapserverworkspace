/*
 * Created on Tue Aug 07 2019
 * Author: Val,Daus
 * Copyright (c) 2019, iSAP Solution
 */

import 'colors';
import { SystemLog } from '../models';
import { User } from 'parse';
let moment = require("moment");
let caller = require('caller');

export enum Level {
    Trace = 1,
    Info = 2,
    Error = 3
}

export namespace Log {
    let currentLevel: Level = Level.Trace;
    let currentRegEx: RegExp;
    export function setLevel(level: Level, reg?: RegExp | string) {
        currentLevel = level;
        currentRegEx = typeof reg === 'string' ? new RegExp(reg) : reg;
    }

    function timestamp(): string {
        let now = moment(new Date()).format("MM/DD HH:mm:ss.SSS");
        return `${'['.grey}` +
               `${now}`.cyan +
               `${']'.grey} `;
    }

    function TestPass(level: Level): boolean {
        if (
            level>=currentLevel &&
            (!currentRegEx || currentRegEx && currentRegEx.test(caller(2)))
        ) return true;
        return false;
    }

    let getTraceMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".grey}${title.white}${">".grey} ${message}`;
    let getInfoMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".magenta}${title.yellow}${">".magenta} ${message}`;
    let getErrorMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".red}${title.white.bgRed}${">".red} ${message}`;

    export async function Trace(title: string, message: string) {
        if (!TestPass(Level.Trace)) return;
        let msg = getTraceMessage(title, message);
        await (new SystemLog({title, message})).save();
        console.log(msg);
        return msg;
    }

    export async function Info(title: string, message: string, user?:User, isHidden?:boolean, type?:string) {
        if (!TestPass(Level.Info)) return;
        let msg = getInfoMessage(title, message);
        if(isHidden===false)await (new SystemLog({title, message, user, hidden: (isHidden === undefined ? true : isHidden), type})).save();
        console.log(msg);
        return msg;
    }

    export async function Error(title: string, message: string, user?:User, type?:string) {
        if (!TestPass(Level.Error)) return;
        let msg = getErrorMessage(title, message);
        await (new SystemLog({title, message, user, type})).save();
        console.log(msg);
        return msg;
    }

    class TimeEndWrapper {
        private msg: string;
        constructor(msg: string) {
            this.msg = msg;
        }
        public end() {
            console.timeEnd(this.msg);
        }
    }

    let timeCount = 0;
    export function TraceTime(title: string, message: string) {
        if (!TestPass(Level.Trace)) return;
        let msg = getTraceMessage(title, message, false) + `(#${++timeCount})`;
        console.time(msg);
        return new TimeEndWrapper(msg);
    }

    export function InfoTime(title: string, message: string) {
        if (!TestPass(Level.Info)) return;
        let msg = getInfoMessage(title, message, false) + `(#${++timeCount})`;
        console.time(msg);
        return new TimeEndWrapper(msg);
    }

    // export function InfoTimeEnd(title: string, message: string) {
    //     if (!TestPass(Level.Info)) return;
    //     let msg = getInfoMessage(title, message, false) + `(#${++timeCount})`;
    //     console.timeEnd(msg);
    //     return new TimeEndWrapper(msg);
    // }
}