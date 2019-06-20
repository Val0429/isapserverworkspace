let config: Config = {
    "server": "sipasssrv",
    "port": 8745,
    "user": "siemens",
    "password": "!QAZ1qaz",
    "uniqueId": "590db17a8468659361f13072d0e198b7290ce7a1",
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


