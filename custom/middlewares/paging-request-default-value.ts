import { Request, Response, NextFunction } from 'express';
import { IRequest } from '../models';

export function PagingRequestDefaultValue(req: Request, res: Response, next: NextFunction) {
    try {
        let _paging: IRequest.IPaging = req.inputType.paging || { page: 1, pageSize: 10 };
        let _page: number = _paging.page || 1;
        let _pageSize: number = _paging.pageSize || 10;

        req.inputType = { ...req.inputType, paging: { page: _page, pageSize: _pageSize } };
        next();
    } catch (e) {
        return next(e);
    }
}
