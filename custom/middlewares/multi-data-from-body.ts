import { Request, Response, NextFunction } from 'express';
import { IResponse } from '../models';

export function MultiDataFromBody(req: Request, res: Response, next: NextFunction) {
    try {
        let resMessages: IResponse.IMultiData[] = req.parameters.datas.map((value, index, array) => {
            return {
                statusCode: 200,
                objectId: value.objectId || '',
                message: '',
            };
        });

        req.parameters = { ...req.parameters, resMessages: resMessages };
        next();
    } catch (e) {
        return next(e);
    }
}
