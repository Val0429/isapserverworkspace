
let config : Config = {
    server_name : "SIPASSSRV",
    ip : "172.16.11.190",
    port : "8745",
    user : "siemens",
    password : "!QAZ1qaz"
}

export default config;

export interface Config{
    server_name : string;
    ip : string;
    port : string;
    user : string;
    password : string;
}