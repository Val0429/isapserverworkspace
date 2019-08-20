import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import * as Rule from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

// type MultiData = IRequest.IMultiData;

// /**
//  * Action Create
//  */
// type InputC = IRequest.IRule.IPeopleCountingC[];

// type OutputC = IResponse.IMultiData;

// action.post(
//     {
//         inputType: 'MultiData',
//         middlewares: [Middleware.MultiDataFromBody],
//         permission: [RoleList.SuperAdministrator, RoleList.Admin],
//     },
//     async (data): Promise<OutputC> => {
//         let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

//         try {
//             let _userInfo = await Db.GetUserInfo(data.request, data.user);
//             let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

//             await Promise.all(
//                 _input.map(async (value, index, array) => {
//                     try {
//                         let rule: IDB.RulePeopleCounting = await Rule.GetCreateBaseRuleObject(IDB.RulePeopleCounting, value);

//                         rule.setValue('conditionTotal', value.conditionTotal);
//                         rule.setValue('conditionBalance', value.conditionBalance);

//                         await rule.save(null, { useMasterKey: true }).fail((e) => {
//                             throw e;
//                         });

//                         resMessages[index].objectId = rule.id;
//                     } catch (e) {
//                         resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

//                         Print.Log(e, new Error(), 'error');
//                     }
//                 }),
//             );

//             return {
//                 datas: resMessages,
//             };
//         } catch (e) {
//             Print.Log(e, new Error(), 'error');
//             throw e;
//         }
//     },
// );

// /**
//  * Action update
//  */
// type InputU = IRequest.IRule.IPeopleCountingU[];

// type OutputU = IResponse.IMultiData;

// action.put(
//     {
//         inputType: 'MultiData',
//         middlewares: [Middleware.MultiDataFromBody],
//         permission: [RoleList.SuperAdministrator, RoleList.Admin],
//     },
//     async (data): Promise<OutputU> => {
//         let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

//         try {
//             let _userInfo = await Db.GetUserInfo(data.request, data.user);
//             let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

//             await Promise.all(
//                 _input.map(async (value, index, array) => {
//                     try {
//                         let rule: IDB.RulePeopleCounting = await Rule.GetUpdateBaseRuleObject(IDB.RulePeopleCounting, value);

//                         if (value.conditionTotal) {
//                             rule.setValue('conditionTotal', value.conditionTotal);
//                         }
//                         if (value.conditionBalance) {
//                             rule.setValue('conditionBalance', value.conditionBalance);
//                         }

//                         await rule.save(null, { useMasterKey: true }).fail((e) => {
//                             throw e;
//                         });
//                     } catch (e) {
//                         resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

//                         Print.Log(e, new Error(), 'error');
//                     }
//                 }),
//             );

//             return {
//                 datas: resMessages,
//             };
//         } catch (e) {
//             Print.Log(e, new Error(), 'error');
//             throw e;
//         }
//     },
// );

// /**
//  * Action Delete
//  */
// type InputD = IRequest.IDelete;

// type OutputD = IResponse.IMultiData;

// action.delete(
//     {
//         inputType: 'InputD',
//         middlewares: [Middleware.MultiDataFromQuery],
//         permission: [RoleList.SuperAdministrator, RoleList.Admin],
//     },
//     async (data): Promise<OutputD> => {
//         try {
//             let _input: InputD = data.inputType;
//             let _userInfo = await Db.GetUserInfo(data.request, data.user);
//             let _objectIds: string[] = data.parameters.objectIds;
//             let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

//             await Promise.all(
//                 _objectIds.map(async (value, index, array) => {
//                     try {
//                         await Rule.Delete(IDB.RulePeopleCounting, value);
//                     } catch (e) {
//                         resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

//                         Print.Log(e, new Error(), 'error');
//                     }
//                 }),
//             );

//             return {
//                 datas: resMessages,
//             };
//         } catch (e) {
//             Print.Log(e, new Error(), 'error');
//             throw e;
//         }
//     },
// );
