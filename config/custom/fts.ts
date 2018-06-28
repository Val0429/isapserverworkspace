var config: Config = {
    searchDurationSeconds: 60,
    possibleCompanionDurationSeconds: 5,
    groupInfo: [
        {
            name: "VIP",
            color: "Gold",
            glowcolor: "Orange"
        },
        {
            name: "Blacklist",
            color: "Red",
            glowcolor: "DarkRed"
        },
        {
            name: "No Match",
            color: "Black",
            glowcolor: "Gold"
        }
    ]
}
export default config;

export interface IGroupInfo {
    name: string;
    color: string;
    glowcolor: string;
}

export interface Config {
    searchDurationSeconds: number;
    possibleCompanionDurationSeconds: number;
    groupInfo: IGroupInfo[];
}