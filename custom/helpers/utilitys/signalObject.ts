import { BehaviorSubject } from 'rxjs';
import { isNullOrUndefined } from 'util';

export class SignalObject<T = boolean> {
    /**
     *
     */
    private subject: BehaviorSubject<T> = null;

    /**
     *
     * @param val
     */
    constructor(val: T) {
        this.subject = new BehaviorSubject<T>(val);
    }

    /**
     *
     * @param timeout
     * @param predicate
     */
    public async wait(timeout: number | Date = undefined, predicate = (v) => v) {
        let result = isNullOrUndefined(timeout)
            ? this.subject
                  .filter(predicate)
                  .first()
                  .toPromise()
            : this.subject
                  .filter(predicate)
                  .timeout(timeout)
                  .first()
                  .toPromise();
        return result;
    }

    /**
     *
     * @param val
     */
    public set(val: T) {
        this.subject.next(val);
    }

    /**
     *
     */
    public get(): T {
        return this.subject.getValue();
    }
}
