import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request";
import * as SiPassDataStructure from "./siPass_define";


export class SiPassPermissionService {

    constructor() {

    }

    //-----------------------------PermissionTable-------------------------------//
    public async GetAllPermissionTables(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        // console.log(data.sessionId);
        // console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessGroups`;

        // console.info(`url = ${url}`);
        // console.info(`requestHeader = ${requestHeader}`);

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

    public async GetPermissionTable(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessGroupObject) {

        // console.log(data.sessionId);
        // console.log(data.uniqueId);


        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessGroups/${data2.token}`;

        // console.info(`url = ${url}`);
        // console.info(`requestHeader = ${requestHeader}`);

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

    public async CreatePermissionTable(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessGroupObject) {

        // console.log(data.sessionId);
        // console.log(data.uniqueId);

        // create the request Body
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessGroups`;

        // console.info(`url = ${url}`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));
        // console.log(`requestBody =` + JSON.stringify(requestBody));

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

        // console.log('\n.........................................');
        // console.info(`result = ` + JSON.stringify(result));
        // console.log('\n.........................................');
        return JSON.stringify(result);

    }
    public async UpdatePermissionTable(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessGroupObject) {

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

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessGroups/${data2.token}`;

        // console.info(`url = ${url}`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));
        // console.log(`requestBody =` + JSON.stringify(requestBody));
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

        // console.log('\n.........................................');
        // console.info(`result = ` + JSON.stringify(result));
        // console.log('\n.........................................');
        return JSON.stringify(result);
    }


    //-----------------------------Permission-------------------------------//
    public async GetAllPermission(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        // console.log(data.sessionId);
        // console.log(data.uniqueId);

        // create the request Body
        var requestBody;// = { "Name": data2.name, "Token": data2.token, "TimeScheduleToken": data2.timeScheduleToken, "IsFavourite": false, "AccessRule": data2.accessRule };

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessLevels`;

        // console.info(`\n`);
        // console.info(`url = ${url}`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));

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

    public async GetPermission(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessLevelObject) {

        // console.log(data.sessionId);
        // console.log(data.uniqueId);


        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessLevels/${data2.token}`;

        // console.info(`\n\n`);
        // console.info(`url = ${url}`);
        // console.info(`\n`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));

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

    public async CreatePermission(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessLevelObject) {

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

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessLevels`;

        // console.info(`url = ${url}`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));
        // console.log(`requestBody =` + JSON.stringify(requestBody));
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
                        } else if (response.statusCode !== 201) {
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
        //console.dir(result, {depth: null})        
        //console.log('\n.........................................');        
        //console.info(`result = ` + JSON.stringify(result));      
        //console.log('\n.........................................');        
        return JSON.stringify(result);
    }
    public async UpdatePermission(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IAccessLevelObject) {

        // create the request Body
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/AccessLevels/${data2.token}`;

        // console.info(`url = ${url}`);
        // console.log(`requestHeader =` + JSON.stringify(requestHeader));
        // console.log(`requestBody =` + JSON.stringify(requestBody));
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

        //console.log('\n.........................................');        
        //console.info(`result = ` + JSON.stringify(result));      
        //console.log('\n.........................................');        
        return JSON.stringify(result);

    }

    //-----------------------------WorkGroup-------------------------------//
    public async GetAllWorkGroup(data: SiPassDataStructure.SiPassHrApiGlobalParameter) {
        // console.log(data.sessionId);
        // console.log(data.uniqueId);

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/WorkGroups`;

        // console.info(`url = ${url}`);
        // console.info(`requestHeader = ${requestHeader}`);

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

    public async GetWrokGroup(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IWorkGroupObject) {

        // console.log(data.sessionId);
        // console.log(data.uniqueId);


        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/WorkGroups?workGroupID=${data2.token}`;

        // console.info(`url = ${url}`);
        // console.info(`requestHeader = ${requestHeader}`);

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

    public async CreateWorkGroup(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IWorkGroupObject) {

        //console.log(data.sessionId);
        //console.log(data.uniqueId);
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/WorkGroups`;

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
                        } else if (response.statusCode !== 201) {
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

        //console.log('\n.........................................');        
        //console.info(`result = ` + JSON.stringify(result));      
        //console.log('\n.........................................');        
        return JSON.stringify(result);

    }
    public async UpdateWorkGroup(data: SiPassDataStructure.SiPassHrApiGlobalParameter, data2: SiPassDataStructure.IWorkGroupObject) {

        // create the request Body
        var requestBody = data2;

        // prepare the header
        var requestHeader = {
            'Content-Type': 'application/json',
            'Language': 'English',
            'Authorization': data.sessionId,
            'clientUniqueId': data.uniqueId
        };

        let url: string = `https://${data.domain}:${data.port}/api/V1/hr/WorkGroups/${data2.token}`;

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

        //console.log('\n.........................................');        
        //console.info(`result = ` + JSON.stringify(result));      
        //console.log('\n.........................................');        
        return JSON.stringify(result);

    }

}