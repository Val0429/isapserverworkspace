import { BehaviorSubject } from "rxjs";
import { isNullOrUndefined } from "util";

export class SignalObject<T = boolean>{

    private subject: BehaviorSubject<T> = null;

    constructor(val : T){
        this.subject = new BehaviorSubject<T>(val);
    }

    public async wait(predicate, timeout ?: number | Date){
        let result = isNullOrUndefined(timeout) ? 
                    this.subject.filter(predicate).first().toPromise() :
                    this.subject.filter(predicate).timeout(timeout).first().toPromise();
        return result;
    }

    public set(val : T){
        this.subject.next(val);
    }

    public get() : T {
        return this.subject.getValue();
    }
    
}