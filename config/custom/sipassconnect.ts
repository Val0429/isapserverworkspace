let config: Config = {
    "server": "sipasssrv",
    "port": 8745,
    "user": "siemens",
    "password": "!QAZ1qaz",
    "uniqueId": "c6451da088d69147aeaefbffeb3767722854e8e3",
    "sessionId": ""
};

export default config;

/**
 * Connection informations
 */
export interface Config {
    server: string;
    port: number;
    user: string;
    password: string;
    uniqueId: string;
    sessionId: string;

}


