let config: Config = {
	"CFSRV": "CFSRV",
	"Jurnal": "JURNAL",
	"Jurnal2": "JURNAL2"
};

export default config;

/**
 * Use to assign linked database name, give CFSRV and Juranl linked database name on the SQL server
 */
export interface Config {
    CFSRV: string;
    Jurnal: string;
	Jurnal2: string;
}