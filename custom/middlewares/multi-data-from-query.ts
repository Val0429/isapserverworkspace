import { Request, Response, NextFunction } from 'express';
import { IResponse } from '../models';

export function MultiDataFromQuery(req: Request, res: Response, next: NextFunction) {
    try {
        let _objectIds: string[] = [].concat(req.parameters.objectId);

        _objectIds = _objectIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let resMessages = _objectIds.map<IResponse.IResponseMessage>((value, index, array) => {
            return {
                statusCode: 200,
                objectId: value,
                message: '',
            };
        });

        req.parameters = { ...req.parameters, resMessages: resMessages, objectIds: _objectIds };
        next();
    } catch (e) {
        return next(e);
    }
}
