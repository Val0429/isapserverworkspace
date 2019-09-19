export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface Config {
    image: IImage;
}

var config: Partial<Config> = {
    image: {
        width: 100,
        height: 100,
        isFill: true,
        isTransparent: true,
    },
};
export default config;
