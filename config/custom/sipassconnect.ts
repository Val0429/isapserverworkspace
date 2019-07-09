let config: Config = {
    "server": "sipasssrv",
    "port": 8745,
    "user": "siemens",
    "password": "!QAZ1qaz",
    "uniqueId": "87a16dcd35959204ede884f371c10cb208ca6bd2",
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


