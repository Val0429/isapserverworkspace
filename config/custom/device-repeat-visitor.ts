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
    frequencyRange: string;
    output: IOutput;
}

let config: Config = {
    productId: '',
    frequencyRange: '1-1-1-1-1',
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
