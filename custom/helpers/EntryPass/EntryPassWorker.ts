import * as request from './request/request'
import * as sender from './sender/sender'
import * as response from './response/response'

export interface OperationReuslt {
    result: boolean
    errorMessage: string
}

export interface EntryPassCardInfo {
    serialNumber: string // CardNo
    startDate?: number // e.q. 20190906
    endDate?: number // e.q. 20200906
    accessLevel?: string
    liftInfo?: EntryPassLiftCardInfo
    accessGroup?: string // AccessGroupName
}

export interface EntryPassLiftCardInfo {
    isLiftCard: boolean
    accessLevel: string
    startDate?: number // e.q. 20190906
    endDate?: number // e.q. 20200906
}

export interface EntryPassStaffInfo {
    name: string
    serialNumber: string
    department?: string
    job?: string
    dateOfJoin?: string
    dateOfBirth?: string
}

interface IEntryPassCardWorker {
    AddCard(staffInfo: EntryPassStaffInfo, cardInfo: EntryPassCardInfo): Promise<OperationReuslt>
    DeleteCard(staffInfo: EntryPassStaffInfo, cardInfo: EntryPassCardInfo): Promise<OperationReuslt>
}

interface IEntryPassStaffWorker {
    AddStaff(staffInfo: EntryPassStaffInfo): Promise<OperationReuslt>
    DeleteStaff(staffInfo: EntryPassStaffInfo): Promise<OperationReuslt>
}

export function CreateInstance(address: string, port: number, serviceID: string): EntryPassWorker {
    return new EntryPassWorker(address, port, serviceID)
}

class EntryPassWorker implements IEntryPassCardWorker, IEntryPassStaffWorker {
    private address: string
    private port: number
    private serviceID: string

    public constructor(address: string, port: number, serviceID: string) {
        this.address = address
        this.port = port
        this.serviceID = serviceID
    }

    public async AddCard(staffInfo: EntryPassStaffInfo, cardInfo: EntryPassCardInfo): Promise<OperationReuslt> {
        let currentTrackID = await this.GetTrackID() as string
       if (currentTrackID.includes("error: ")) {
            return { result: false, errorMessage: currentTrackID } as OperationReuslt
        }

        let req = request.GetAddCardRequest({
            ...staffInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID
        }, {
            ...cardInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID,

        })
        if (req === "") {
            return { result: false, errorMessage: `Can't get add card request string` } as OperationReuslt
        }

        //console.log("Add card req=" + req)
        let resp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        return response.ParseResponse(resp)
    }

    public async DeleteCard(staffInfo: EntryPassStaffInfo, cardInfo: EntryPassCardInfo): Promise<OperationReuslt> {
        let currentTrackID = await this.GetTrackID() as string
        if (currentTrackID.includes("error: ")) {
            return { result: false, errorMessage: currentTrackID } as OperationReuslt
        }

        let req = request.GetRemoveCardRequest({
            ...staffInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID
        }, {
            ...cardInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID,
        })
        if (req === "") {
            return { result: false, errorMessage: `Can't get delete card request string` } as OperationReuslt
        }
        //console.log("Delete card req=" + req)

        let cardResp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        return response.ParseResponse(cardResp)
    }

    public async AddStaff(staffInfo: EntryPassStaffInfo): Promise<OperationReuslt> {
        let currentTrackID = await this.GetTrackID() as string
        if (currentTrackID.includes("error: ")) {
            return { result: false, errorMessage: currentTrackID } as OperationReuslt
        }

        let req = request.GetAddStaffRequest({
            ...staffInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID
        })
        if (req === "") {
            return { result: false, errorMessage: `Can't get add staff request string` } as OperationReuslt
        }

        //console.log("add staff req=" + req)
        let resp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        if (resp === "") {
            console.log("Add staff response is empty")
            return { result: false, errorMessage: `Can't get add staff request string` } as OperationReuslt
        }
        return response.ParseResponse(resp)
    }

    public async DeleteStaff(staffInfo: EntryPassStaffInfo): Promise<OperationReuslt> {
        let currentTrackID = await this.GetTrackID() as string
        if (currentTrackID.includes("error: ")) {
            return { result: false, errorMessage: currentTrackID } as OperationReuslt
        }

        let req = request.GetRemoveStaffRequest({
            ...staffInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID,
        })
        if (req === "") {
            return { result: false, errorMessage: `Can't get delete staff request string` } as OperationReuslt
        }

        let resp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        return response.ParseResponse(resp)
    }

    public async ModifyStaff(staffInfo: EntryPassStaffInfo): Promise<OperationReuslt> {
        let currentTrackID = await this.GetTrackID() as string
        if (currentTrackID.includes("error: ")) {
            return { result: false, errorMessage: currentTrackID } as OperationReuslt
        }

        let req = request.GetModifyStaffRequest({
            ...staffInfo,
            serviceID: this.serviceID,
            trackID: currentTrackID,
        })
        if (req === "") {
            return { result: false, errorMessage: `Can't get modify staff request string` } as OperationReuslt
        }

        //console.log("rm staff req=" + req)
        let resp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        return response.ParseResponse(resp)
    }

    public async CheckServerStatus(): Promise<OperationReuslt> {
        let result = await this.GetTrackID()
        if (result.includes("error: ")) {
            return { result: false, errorMessage: result } as OperationReuslt
        } else {
            return { result: true } as OperationReuslt
        }
    }

    private async GetTrackID(): Promise<string> {
        let req = request.GetTrackRequest(this.serviceID)
        let resp = await sender.SendSingleReqeust(this.address, this.port, req) as string
        // If Connection error
        if (resp.includes("error: ")) { return resp }

        // Get correct response
        let trackID = response.ParseTrackID(resp)
        return trackID
    }
}