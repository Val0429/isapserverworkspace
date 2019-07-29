let sipassDbConfig: Config = {
    "server": "sipasssrv",
    "port": 1433,
    "user": "manager",
    "password": "manager",
    "database": "asco4",
    "connectionTimeout": 15000
};

export default sipassDbConfig;

/**
 * Connection informations
 */
export interface Config {
    server: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionTimeout: number;

}


