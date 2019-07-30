export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface IOutput {
    image: IImage;
}

export interface Config {
    productId: string;
    bufferCount: number;
    ageRange: string;
    output: IOutput;
}

let config: Config = {
    productId: '',
    bufferCount: 10,
    ageRange: '0-20-10-10-10-10',
    output: {
        image: {
            width: 150,
            height: 150,
            isFill: false,
            isTransparent: false,
        },
    },
};
export default config;