const isWindows = process.platform === "win32";
const version = +process.version.match(/^v([0-9]+)/)[1];

const ffc = isWindows ? null :
    require('./lib/build/Release/faceScore');

export namespace FaceScore {
    export function sync(buffer) {
        var result = ffc.faceScore( buffer );
        return result;
    }

    // export function async(buffer1, buffer2) {
    //     return new Promise<number>( (resolve) => {
    //         ffc.faceFeatureCompareAsync( buffer1, buffer2, (score) => {
    //             //setImmediate(() => resolve(score));
    //             resolve(getScore(score));
    //         });
    //     });
    // }
}
