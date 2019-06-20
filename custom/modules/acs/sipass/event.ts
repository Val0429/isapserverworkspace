import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request"
import * as SiPassDataStructure from "./siPass_define";
import { DESTRUCTION } from "dns";


export class SiPassMsEventService {

    constructor() {
    
    }

    public async SubscribeMessage(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {
        //console.log(data.sessionId);
        //console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',            
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };
        
        let url: string = `https://${data.domain}:${data.port}/api/management/V1/Messages/Subscribe?messageSubscriptionType=0`;
        
        console.info(`\n`);
        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader));

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


    public async ReceiveMessage(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {
        //console.log(data.sessionId);
        //console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',            
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };
        
        let url: string = 'https://SIPASSSRV:8744/Notifier/hubs';
        //let url: string = `https://${data.domain}:${data.port}/api/management/V1/Messages/Subscribe?messageSubscriptionType=0`;
        
        console.info(`\n`);
        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader));

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