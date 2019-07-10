let config: Config = {
    server: "localhost\\DATAEXPRESS",
    port: 1433,
    user: "sa",
    password: "5j/cj86aup6eji6j04njo4e",
    database: "FET",
    connectionTimeout: 15000
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
}