import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { ConfigEocorpexServer } from './_index';

/**
 * Eocorpex相機設定
 */
export interface IConfigEocorpexCamera {
    /**
     *
     */
    server: ConfigEocorpexServer;

    /**
     *
     */
    id: string;

    /**
     *
     */
    name: string;
}

@registerSubclass()
export class ConfigEocorpexCamera extends ParseObject<IConfigEocorpexCamera> {}
