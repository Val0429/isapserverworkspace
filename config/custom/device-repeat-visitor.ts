export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface IOutput {
    saveSource: boolean;
    image: IImage;
}

export interface Config {
    frequencyRange: string;
    output: IOutput;
}

let config: Config = {
    frequencyRange: '1-1-1-1-1',
    output: {
        saveSource: true,
        image: {
            width: 150,
            height: 150,
            isFill: false,
            isTransparent: false,
        },
    },
};
export default config;
