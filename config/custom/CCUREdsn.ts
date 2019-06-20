let config: Config = {
	"CFSRV": "CFSRV",
	"Jurnal": "JURNAL"
};

export default config;

/**
 * Use to assign linked database name, give CFSRV and Juranl linked database name on the SQL server
 */
export interface Config {
    CFSRV: string;
    Jurnal: string;
}