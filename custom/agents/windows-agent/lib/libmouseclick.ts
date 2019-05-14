var edge = require('edge-js');
import { promisify } from 'bluebird';
import * as fs from 'fs';
import { Log } from 'helpers/utility';

const dllPath: string = `${__dirname}/LibMouseClick.dll`;

export interface IMouseClick {
    x: number;
    y: number;
}

export let doClick: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibMouseClick.Startup',
    methodName: 'DoClick'
}));

export let doRightClick: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibMouseClick.Startup',
    methodName: 'DoRightClick'
}));

export let doDoubleClick: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibMouseClick.Startup',
    methodName: 'DoDoubleClick'
}));

