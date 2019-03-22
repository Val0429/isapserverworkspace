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
    fcm: IFcm;
    apn: IApn;
}

let config: Config = {
    fcm: {
        serverKey: 'AAAAFGl0CKw:APA91bGahB7I0rFrDaEXUpMqb3_ib9PkXymSEu6nG-gj6wCoOQ1tQ2IQwlWwu0-lpLLy-FmVvUUqdpZkUoBcrymIzA7pC1aN08EtGJFhXptzx46ftkKkI5YjOEahO6e2dNnV9LSrVb6i',
        collapseKey: '87668557996',
    },
    apn: {
        key: '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgPVc6tl7pVeJEIzzFbrpxIMFl+W8QEoKqpufOz8OWDwWgCgYIKoZIzj0DAQehRANCAAQzzicm75wxl1u4hIUkzLjbuDo4SnZksQfsIxy5LaWy6WWKY3oCAhk62J1eGH9W2O/HORHGjLX0W2KO8+oqbzUN\n-----END PRIVATE KEY-----',
        keyId: 'QPX99ZHTND',
        teamId: '8S693EH9B2',
        production: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
        topic: 'com.isap.AiLife',
    },
};
export default config;
