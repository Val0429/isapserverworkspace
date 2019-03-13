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
        serverKey: 'AAAA2R0uxx0:APA91bHPVkzIRGgUGbnVyp3UuFcxx1L78uYjwOU5ffxFEzSZb5lJYJsz3rImR0tq2hz3o96KJKBwCn1OaaGiz50VUE2kUecBR2h5Kh559lmmGTG44wDOpTOXWV1197Jml-4p0OFh72v8',
        collapseKey: '932497508125',
    },
    apn: {
        key: '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgPVc6tl7pVeJEIzzFbrpxIMFl+W8QEoKqpufOz8OWDwWgCgYIKoZIzj0DAQehRANCAAQzzicm75wxl1u4hIUkzLjbuDo4SnZksQfsIxy5LaWy6WWKY3oCAhk62J1eGH9W2O/HORHGjLX0W2KO8+oqbzUN\n-----END PRIVATE KEY-----',
        keyId: 'QPX99ZHTND',
        teamId: '8S693EH9B2',
        production: false,
        topic: 'com.isap.FaceDetection',
    },
};
export default config;
