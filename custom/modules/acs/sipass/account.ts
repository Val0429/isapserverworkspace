import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request";
import * as SiPassDataStructure from "./siPass_define";


export class SiPassHrAccountService {

    private m_WaitTimer = null;
    private m_StartDelayTime: number = 1 // sec
    private m_CycleTime: number = 30; // sec
    private m_IsConnected: boolean = false;

    /*private m_UserName: string;
    private m_Password: string;
    private m_UniqueId: string;
    private m_Domain: string;    
    private m_Port: string;    
    private m_SessionId: string;*/

    constructor(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {

        //this.m_UserName  = data.userName;
        //this.m_Password  = data.password;
        //this.m_UniqueId  = data.uniqueId;
        //this.m_Domain    = data.domain;
        //this.m_Port      = data.port;
        //this.m_SessionId = data.sessionId;


        var me = this;
        this.m_WaitTimer = setTimeout(() => {
            me.MaintainSessionRenewel(data);
        }, 1000 * this.m_StartDelayTime);
    }


    public async Login(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {

        console.log(data.userName);
        console.log(data.password);
        console.log(data.uniqueId);

        // create the request Body
        var requestBody = { "Username": data.userName, "Password": data.password };
        
        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Authentication`;

        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader)); 
        console.log(`requestBody =` + JSON.stringify(requestBody)); 
        //console.log(`requestHeader = ${requestHeader}`);
        //console.log(`requestBody = ${requestBody}`);
        //console.dir(requestHeader, {depth: null})
        
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
            //console.log(`catch error ${e}`);
            //this.m_IsConnected = false;
            console.log(e);
            return JSON.stringify(e);
        //}).then(() => {
        //    this.m_IsConnected = true;
        });
        //console.dir(result, {depth: null})
       // console.log(result); 
        data.sessionId = result.Token;
        this.m_IsConnected = true;
        //console.log(result);        
        console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);

    }

    public async Logout(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        //console.log(data.sessionId);
        //console.log(data.clientUniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Authentication`;

        console.info(`url = ${url}`);
        console.info(`requestHeader = ${requestHeader}`);

        let result: any = await new Promise<any>((resolve, reject) => {
            try {
                HttpClient.del(
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

            //console.log(e);
            return JSON.stringify(e);

        });

        //console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);
    }

    public async SessionRenewel(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {

        //console.log(data.sessionId);
        //console.log(data.uniqueId);


        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Authentication/`;

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


    public async GetSessionTimeout(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        //console.log(data.sessionId);
        //console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Authentication?sessiontimeout`;

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


    private async MaintainSessionRenewel(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {

        clearTimeout(this.m_WaitTimer);

        if (this.m_IsConnected == true) {
            // prepare the header
            var requestHeader = {
                'Content-Type': 'application/json',
                'Language': 'English',
                'Authorization': data.sessionId,
                'clientUniqueId': data.uniqueId
            };

            let url: string = `https://${data.domain}:${data.port}/api/V1/hr/Authentication/`;

            console.info(`MaintainSessionRenewel`);
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
                this.m_IsConnected = false;
                return JSON.stringify(e);

            });
        }

        let now: Date = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.m_CycleTime;

        this.m_WaitTimer = setTimeout(() => {
            this.MaintainSessionRenewel(data);
        }, (this.m_CycleTime - s) * 1000);
    }
}



export class SiPassMsAccountService {

    private m_WaitTimer = null;
    private m_StartDelayTime: number = 1 // sec
    private m_CycleTime: number = 30; // sec
    private m_IsConnected: boolean = false;

    /*private m_UserName: string;
    private m_Password: string;
    private m_UniqueId: string;
    private m_Domain: string;    
    private m_Port: string;    
    private m_SessionId: string;*/

    constructor(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {

        //this.m_UserName  = data.userName;
        //this.m_Password  = data.password;
        //this.m_UniqueId  = data.uniqueId;
        //this.m_Domain    = data.domain;
        //this.m_Port      = data.port;
        //this.m_SessionId = data.sessionId;


        var me = this;
        this.m_WaitTimer = setTimeout(() => {
            me.MaintainSessionRenewel(data);
        }, 1000 * this.m_StartDelayTime);
    }


    public async Login(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {

        console.log(data.userName);
        console.log(data.password);
        console.log(data.uniqueId);

        // create the request Body
        var requestBody = { "Username": data.userName, "Password": data.password };
        
        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/management/V1/authentication/login`;

        console.info(`url = ${url}`);
        console.log(`requestHeader =` + JSON.stringify(requestHeader)); 
        console.log(`requestBody =` + JSON.stringify(requestBody)); 
        //console.log(`requestHeader = ${requestHeader}`);
        //console.log(`requestBody = ${requestBody}`);
        //console.dir(requestHeader, {depth: null})
        
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
            //console.log(`catch error ${e}`);
            //this.m_IsConnected = false;
            console.log(e);
            return JSON.stringify(e);
        //}).then(() => {
        //    this.m_IsConnected = true;
        });
        //console.dir(result, {depth: null})
       // console.log(result); 
        data.sessionId = result.Token;
        this.m_IsConnected = true;
        //console.log(result);        
        console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);

    }

    public async Logout(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {
        //console.log(data.sessionId);
        //console.log(data.clientUniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/management/V1/authentication/logout`;

        console.info(`url = ${url}`);
        console.info(`requestHeader = ${requestHeader}`);

        let result: any = await new Promise<any>((resolve, reject) => {
            try {
                HttpClient.del(
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

            //console.log(e);
            return JSON.stringify(e);

        });

        //console.info(`result = ` + JSON.stringify(result));      
        return JSON.stringify(result);
    }

    public async SessionRenewel(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {

        //console.log(data.sessionId);
        //console.log(data.uniqueId);


        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/management/V1/authentication/renew`;

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


    private async MaintainSessionRenewel(data: SiPassDataStructure.SiPassMsApiGlobalParameter) {

        clearTimeout(this.m_WaitTimer);

        if (this.m_IsConnected == true) {
            // prepare the header
            var requestHeader = {
                'Content-Type': 'application/json',
                'Language': 'English',
                'Authorization': data.sessionId,
                'clientUniqueId': data.uniqueId
            };

            let url: string = `https://${data.domain}:${data.port}/api/management/V1/authentication/renew`;

            console.info(`MaintainSessionRenewel`);
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
                this.m_IsConnected = false;
                return JSON.stringify(e);

            });
        }

        let now: Date = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.m_CycleTime;

        this.m_WaitTimer = setTimeout(() => {
            this.MaintainSessionRenewel(data);
        }, (this.m_CycleTime - s) * 1000);
    }
}