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
    bufferCount: 5,
    ageRange: '0-20-20-20',
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
