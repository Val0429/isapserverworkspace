import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import * as Area from '../../location/area';
import * as Rule from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

// type MultiData = IRequest.IMultiData;

// /**
//  * Action Create
//  */
// type InputC = IRequest.IRule.IHumanDetectionC[];

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
//                         let rule: IDB.RuleHumanDetection = await Rule.GetCreateBaseRuleObject(IDB.RuleHumanDetection, value);

//                         rule.setValue('threshold', Area.SortThreshold(value.threshold));
//                         rule.setValue('conditions', value.conditions);

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
//  * Action Read
//  */
// type InputR = IRequest.IDataList;

// type OutputR = IResponse.IDataList<IResponse.IRule.IHumanDetectionR>;

// action.get(
//     {
//         inputType: 'InputR',
//         middlewares: [Middleware.PagingRequestDefaultValue],
//         permission: [RoleList.SuperAdministrator, RoleList.Admin],
//     },
//     async (data): Promise<OutputR> => {
//         try {
//             let _input: InputR = data.inputType;
//             let _userInfo = await Db.GetUserInfo(data.request, data.user);
//             let _paging: IRequest.IPaging = _input.paging;

//             let query: Parse.Query<IDB.RuleHumanDetection> = new Parse.Query(IDB.RuleHumanDetection);

//             if (_input.keyword) {
//                 let query1 = new Parse.Query(IDB.RuleHumanDetection).matches('name', new RegExp(_input.keyword), 'i');
//                 query = Parse.Query.or(query1);
//             }

//             if (_input.objectId) {
//                 query.equalTo('objectId', _input.objectId);
//             }

//             let total: number = await query.count().fail((e) => {
//                 throw e;
//             });
//             let totalPage: number = Math.ceil(total / _paging.pageSize);

//             let rules: IDB.RuleHumanDetection[] = await query
//                 .skip((_paging.page - 1) * _paging.pageSize)
//                 .limit(_paging.pageSize)
//                 .include(['sites', 'areas', 'deviceGroups', 'devices', 'notifyObject.users', 'notifyObject.userGroups'])
//                 .find()
//                 .fail((e) => {
//                     throw e;
//                 });

//             return {
//                 paging: {
//                     total: total,
//                     totalPages: totalPage,
//                     page: _paging.page,
//                     pageSize: _paging.pageSize,
//                 },
//                 results: [],
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
// type InputU = IRequest.IRule.IHumanDetectionU[];

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
//                         let rule: IDB.RuleHumanDetection = await Rule.GetUpdateBaseRuleObject(IDB.RuleHumanDetection, value);

//                         if (value.threshold) {
//                             rule.setValue('threshold', Area.SortThreshold(value.threshold));
//                         }
//                         if (value.conditions) {
//                             rule.setValue('conditions', value.conditions);
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
//                         await Rule.Delete(IDB.RuleHumanDetection, value);
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
