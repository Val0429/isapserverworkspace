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
    gridUnit: number;
    valueZoom: number;
    output: IOutput;
}

let config: Config = {
    productId: '',
    gridUnit: 10,
    valueZoom: 6,
    output: {
        image: {
            width: 960,
            height: 540,
            isFill: false,
            isTransparent: false,
        },
    },
};
export default config;
