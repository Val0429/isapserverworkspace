
/// 3 days
// searchDurationSeconds: 259200, 28800
/// 30 days
// 7776000

var config: Config = {
    searchDurationSeconds: 5,
    possibleCompanionDurationSeconds: 5,
    specialScoreForUnRecognizedFace: 0.4,
    throttleKeepSameFaceSeconds: 10,
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
            color: "#222",
            glowcolor: "White"
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
    specialScoreForUnRecognizedFace: number;
    throttleKeepSameFaceSeconds: number;
    groupInfo: IGroupInfo[];
}