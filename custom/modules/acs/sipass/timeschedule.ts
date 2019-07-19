import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request"
import * as SiPassDataStructure from "./siPass_define";

export class SiPassTimeScheuleService {

    constructor() {

    }

    public async GetTimeScheules(data: SiPassDataStructure.SiPassHrApiGlobalParameter,sessionId:string) {
        console.log(sessionId);
        console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',            
            'Language': 'English',
            'Authorization': sessionId,
            'clientUniqueId': data.uniqueId
        };
                    
        let url: string = `https://${data.domain}:${data.port}/api/v1/hr/TimeSchedules/`;
        
        console.info(`url = ${url}`);
        console.info(`requestHeader = ${requestHeader}`);

        let result: any = await new Promise<any>((resolve, reject) => {
            try {
                HttpClient.get(
                    {
                        url: url,
                        json: true,                        
                        headers: requestHeader
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            return reject(
                                `{"status" : "error"}`,
                            );
                        }

                        resolve(body);                        
                    },
                );
            } catch (e) {
                return reject(e);
            }
        }).catch((e) => {
            
            return JSON.stringify(e);

        });
         
        return JSON.stringify(result);
    }
}