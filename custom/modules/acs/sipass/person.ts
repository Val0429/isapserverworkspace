import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request"
import * as SiPassDataStructure from "./siPass_define";

export class SiPassPersonService {

    constructor() {

    }

    public async GetAllPersons(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        console.log(data.sessionId);
        console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',            
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };
          
        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Cardholders?`;        
        url += 'searchString=&appId=Cardholders&fields=Status&sortingOrder={"FieldName":"Status","Value":"","SortingOrder":0}&startIndex=0&endIndex=10000&filterExpression={}'
        
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
            console.log(e);
            return JSON.stringify(e);

        });
        //console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);
    }

    public async GetPerson(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.ICardholderObject) {
        console.log(data.sessionId);
        console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',            
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };
          
        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Cardholders/${data2.token}`;
        
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
            console.log(e);
            return JSON.stringify(e);

        });
        //console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);
    }

    public async CreatePerson(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.ICardholderObject) {

        console.log(data.sessionId);
        console.log(data.uniqueId);

        // create the request Body
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Cardholders`;

        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader));
        console.log(`requestBody =` + JSON.stringify(requestBody));

        let result: any = await new Promise<any>((resolve, reject) => {
            try {
                HttpClient.post(
                    {
                        url: url,
                        json: true,
                        body: requestBody,
                        headers: requestHeader
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 201) {
                            //console.log(`statusCode = ${response.statusCode}`);
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
            //console.log(`catch error ${e}`);
            return JSON.stringify(e);

        });

        console.log('\n.........................................');
        console.info(`result = ` + JSON.stringify(result));
        console.log('\n.........................................');
        return JSON.stringify(result);

    }
    public async UpdatePerson(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.ICardholderObject) {

        //console.log(data.sessionId);
        //console.log(data.uniqueId);

        // create the request Body
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Cardholders/${data2.token}`;

        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader));
        console.log(`requestBody =` + JSON.stringify(requestBody));
        //console.log(`requestHeader = ${requestHeader}`);
        //console.log(`requestBody = ${requestBody}`); 
        //console.dir(requestHeader, {depth: null})

        let result: any = await new Promise<any>((resolve, reject) => {
            try {
                HttpClient.put(
                    {
                        url: url,
                        json: true,
                        body: requestBody,
                        headers: requestHeader
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            console.log(`statusCode = ${response.statusCode}`);
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
            console.log(e);
            return JSON.stringify(e);
        });

        console.log('\n.........................................');
        console.info(`result = ` + JSON.stringify(result));
        console.log('\n.........................................');
        return JSON.stringify(result);
    }
}