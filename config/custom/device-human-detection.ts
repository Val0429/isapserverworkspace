export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface IRectangle {
    lineWidth: number;
    color: string;
    isFill: boolean;
}

export interface IOutput {
    image: IImage;
    rectangle: IRectangle;
}

export interface Config {
    productId: string;
    bufferCount: number;
    roiTest: boolean;
    output: IOutput;
}

let config: Config = {
    productId: '00111',
    bufferCount: 5,
    roiTest: false,
    output: {
        image: {
            width: 640,
            height: 480,
            isFill: false,
            isTransparent: false,
        },
        rectangle: {
            lineWidth: 7,
            color: 'red',
            isFill: false,
        },
    },
};
export default config;