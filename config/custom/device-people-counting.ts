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
    productId: string;
    bufferCount: number;
    output: IOutput;
}

let config: Config = {
    productId: '00106',
    bufferCount: 10,
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
