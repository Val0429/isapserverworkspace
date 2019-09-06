export interface Config {
    [key: string]: string;
}

var config: Partial<Config> = {
    '00255': 'iSAP FRS',
    '00256': 'iSAP FRS Tablet',
    '00257': 'Third Party FRS Tablet',
};
export default config;
