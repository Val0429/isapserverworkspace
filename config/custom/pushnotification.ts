export interface IFcm {
    serverKey: string;
    collapseKey: string;
}

export interface IApn {
    key: string;
    keyId: string;
    teamId: string;
    production: boolean;
    topic: string;
}

export interface Config {
    bufferCount: number;
    fcm: IFcm;
    apn: IApn;
}

let config: Config = {
    bufferCount: 10,
    fcm: {
        serverKey: 'AAAAFGl0CKw:APA91bGahB7I0rFrDaEXUpMqb3_ib9PkXymSEu6nG-gj6wCoOQ1tQ2IQwlWwu0-lpLLy-FmVvUUqdpZkUoBcrymIzA7pC1aN08EtGJFhXptzx46ftkKkI5YjOEahO6e2dNnV9LSrVb6i',
        collapseKey: '87668557996',
    },
    apn: {
        key: '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgres6UB5+3IU+xi+OImSUzePF7fuNKY4X2YcSXrXud9ygCgYIKoZIzj0DAQehRANCAAScXmH87lCWx9T/64EmIQTYP/oEC7/BdAu6j6bMRse0C7AQ2UdqanPbWbGgNeP22Nc+CD0Fa0/ruwrFWtctCdlU\n-----END PRIVATE KEY-----',
        keyId: 'HP9PASASQ6',
        teamId: 'KYHZCF99L7',
        production: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
        topic: 'com.isap.Ailife.beta',
    },
};
export default config;
