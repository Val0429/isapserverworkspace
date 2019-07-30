import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Hanwha } from '../../helpers/people-counting/hanwha';

/**
 * 和華相機設定
 */
export interface IConfigHanwha extends Hanwha.IConfig {
    /**
     *
     */
    lines?: number[];
}

@registerSubclass()
export class ConfigHanwha extends ParseObject<IConfigHanwha> {}
