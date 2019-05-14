import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Create
 */
type InputC = string;

type OutputC = string;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            return '';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = string;

type OutputR = string;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            return '';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = string;

type OutputU = string;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            return '';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = string;

type OutputD = string;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            return '';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action WebSocket
 */
action.ws(async (data) => {
    let _socket: Socket = data.socket;
});
