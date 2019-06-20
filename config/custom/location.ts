export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface Config {
    image: IImage;
}

let config: Config = {
    image: {
        width: 900,
        height: 600,
        isFill: true,
        isTransparent: true,
    },
};
export default config;
