import * as libxmljs from 'libxmljs'
import { OperationReuslt } from '../EntryPassWorker'

const errorMeesageMap = new Map([
    [-2, 'Fail Attempt'],
    [-1, 'Invalid or incomplete XML structure'],
    [0, 'Command successful received & validated'],
    [1, 'No attribute value in "SERVICE" tag'],
    [2, 'No ID attribute value in "SERVICE" tag'],
    [3, 'Invalid "SERVICE" ID'],
    [4, 'No "SERVICE" tag'],
    [5, 'No attribute value in "TRACKID" tag'],
    [6, 'No ID attribute in "TRACKID" tag'],
    [7, 'Invalid "TRACKID" value'],
    [8, 'No "TRACKID" tag'],
    [9, 'No attribute value in "COMMAND" tag'],
    [10, 'No ID attribute in "COMMAND" tag'],
    [11, 'Invalid "COMMAND" ID (must be in sequence. E.g: 1, 2, 3 .... 64)'],
    [12, 'No "COMMAND" tag'],
    [13, 'No "COMMAND" structure'],
    [14, 'No "COMCODE" attribute in "COMMAND" tag'],
    [15, 'Incomplete element structure in "COMMAND" tag'],
    [16, 'Invalid "COMCODE" In "COMMAND" tag'],
    [17, '"COMMAND" ID exceed 64'],
    [18, 'Primary element in "COMMAND" structure contains empty value'],
    [19, 'Element size in "COMMAND" structure exceed the given value'],
    [20, 'Wrong element type in "COMMAND" structure'],
    [21, 'Element value in "COMMAND" structure out of range'],
    [22, 'Invalid data format (must in "yyyymmdd")'],
    [23, 'Incomplete attributes in "COMMAND" tag'],
    [24, 'Invalid source IP'],
    [25, 'Fail to setup DB (Host Server)'],
    [26, 'Fail to assign TrackID due to date changed'],
    [27, 'General failure within internal process'],
    [28, 'TrackID expired'],
    [29, 'Staff number not exist in host DB'],
    [30, 'Card number already exist in host DB'],
    [31, 'Card number do not exist in host DB'],
    [32, 'Staff already exist in host DB'],
    [33, 'Fail to send email notification'],
    [34, 'Fail to connect to SMTP server'],
    [35, 'TrackID sent from unauthorized client'],
    [36, 'TrackID in use'],
    [37, ''],
    [38, ''],
    [39, ''],
    [40, 'TrackID exceeded maximum quota per day (999999)'],
    [41, 'Lift card already exist in host DB'],
    [42, 'Door access level sent by client cannot be used (restricted)'],
    [43, 'Lift access level sent by client cannot be used (restricted)'],
    [44, 'Invalid data length sent from client'],
    [45, 'Door access group sent by client cannot be used (restricted)'],
    [46, 'Door access group conflict due to duplicate doors found'],
    [47, 'Door Name do not exist in host DB'],
    [48, 'Door Name not in allowable list'],
    [49, 'Conflicting Data found']
])

function GetErrorMessage(code: number): string {
    return errorMeesageMap.has(code) ? errorMeesageMap.get(code) as string : "Unknown response"
}

export function ParseResponse(resp: string): OperationReuslt {
    if (resp.includes("error:")) {
        return { result: false, errorMessage: resp } as OperationReuslt
    }

    // Successful: `<RESULT STCODE="0"><TRACKID ID="20190909_000051"><SUB_RESULT ID="1" STCODE="0"></SUB_RESULT></TRACKID></RESULT>`
    // Failure: `<RESULT STCODE="18"><TRACKID ID="20190909_000052"><COMMAND ID="1"></COMMAND><PARAMETER>STAFF_NO</PARAMETER></TRACKID></RESULT>`
    let xmlDoc = libxmljs.parseXmlString(resp)
    let codeAttr = xmlDoc.get('/RESULT')!.attr('STCODE')
    if (codeAttr === null) { return { result: false, errorMessage: "error: Invalid response" } as OperationReuslt }

    if (codeAttr.value() !== '0') {
        return { result: false, errorMessage: GetErrorMessage(parseInt(codeAttr.value(), 10)) } as OperationReuslt
    }

    return { result: true } as OperationReuslt
}

export function ParseTrackID(xml: string): string {
    let xmlDoc = libxmljs.parseXmlString(xml);
    let idAttr = xmlDoc.get(`//TRACKID`)!.attr('ID');
    return idAttr !== null ? idAttr.value() : "error: Parse response error";
}
