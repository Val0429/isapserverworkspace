export interface ILogin {
    username: string;
    password: string;
}

export interface ILogout {
    sessionId: string;
}

export class SiPassAccountService {

    constructor() {

    }


    public Login( data: ILogin ) {
        console.log(data.username) ;
        console.log(data.password) ;







        let ret = {
            "sessionId": "1234567890" 
        };

        return JSON.stringify(ret) ;
    }

    public Logout( data: ILogout ) {
        console.log(data.sessionId) ;





        let ret = {
            "status" : "ok"
        };

        return JSON.stringify(ret) ;
    }

    public SessionRenewel() {

    }


    public SessionTimeout( data: number) {

    }
}