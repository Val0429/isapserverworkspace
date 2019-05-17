import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Draw, Parser, CMSService } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.ICamera.IIndexR;

type OutputR = IResponse.ICamera.IIndexR;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }
            if (camera.getValue('type') !== Enum.ECameraType.cms) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera can not set roi']);
            }

            let cms: CMSService = new CMSService();
            cms.config = Config.cms;

            cms.Initialization();

            let config = camera.getValue('config') as IDB.IConfigCMSCamera;

            let snapshot = await cms.GetSnapshot(config.nvrId, config.channelId);
            let size = await Draw.ImageSize(snapshot);

            snapshot = await Draw.Resize(snapshot, { width: 960, height: 540 }, false, true);

            return {
                objectId: camera.id,
                name: camera.getValue('name'),
                rois: camera.getValue('rois'),
                cameraWidth: size.width,
                cameraHeight: size.height,
                snapshotBase64: Parser.Base64Str2HtmlSrc(snapshot.toString(Parser.Encoding.base64)),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ICamera.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }
            if (camera.getValue('type') !== Enum.ECameraType.cms) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera can not set roi']);
            }

            camera.setValue('rois', _input.rois);

            await camera.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.Camera$.next({ crud: 'u', mode: camera.getValue('mode'), type: camera.getValue('type') });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);