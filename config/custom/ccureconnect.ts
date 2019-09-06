let config: Config = {
	"server": "172.16.10.67",
	"port": 65062,
	"user": "sa",
	"password": "manager",
	"database": "master",
	"connectionTimeout": 300000,
    mdbpath: "",
    mdbpath2: ""
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
    database: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    pool?: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
    };
    mdbpath:string;
    mdbpath2:string;
}


