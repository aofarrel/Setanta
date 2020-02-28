import * as Asserts from "./asserts";
import * as Checks from "./checks";
import { Environment } from "./env";
import { RuntimeError } from "./error";
import { AsgnStmt, ID, NonAsgnStmt } from "./gen_parser";
import { Interpreter } from "./i10r";

export type Value = number | boolean | Callable | null | ValLs | string | Obj;
interface ValLs extends Array<Value> {}

export type TypeCheck = (v: Value) => boolean;

export type Stmt = AsgnStmt | NonAsgnStmt;

export type Comparable = number | boolean;

export type Ref = (v: Value) => void;

export interface Callable {
    ainm: string;
    arity: () => number;
    call: (args: Value[]) => Promise<Value>;
}

export interface Obj {
    ainm: string;
    getAttr: (id: string) => Value;
    setAttr: (id: string, v: Value) => void;
}

export function callFunc(x: Value, args: Value[]): Promise<Value> {
    x = Asserts.assertCallable(x);
    const ar = x.arity();
    if (ar !== -1 && args.length !== x.arity()) {
        throw new RuntimeError(`Teastaíonn ${ar} argóint ag ${goLitreacha(x)}, ach fuair sé ${args.length}`);
    }
    return x.call(args);
}

export function idxList(x: Value, idx: Promise<Value>): Promise<Value> {
    const ls = Asserts.assertIndexable(x);
    return idx.then((v) => {
        v = Asserts.assertNumber(v);
        if (v < 0 || v >= ls.length) {
            throw new RuntimeError(`Tá ${goLitreacha(v)} thar teorainn an liosta`);
        }
        return ls[v];
    });
}

export class ObjWrap implements Obj {
    public ainm: string;
    public attrs: Map<string, Value>;
    constructor(ainm: string, attrs: Array<[string[], Value]>) {
        this.ainm = ainm;
        this.attrs = new Map();
        for (const attr of attrs) {
            for (const k of attr[0]) {
                this.attrs.set(k, attr[1]);
            }
        }
    }
    public getAttr(id: string): Value {
        return this.attrs.get(id) || null;
    }
    public setAttr(id: string, v: Value) {
        throw new RuntimeError(`Ní feidir leat ${goLitreacha(this)} a athrú`);
    }
}

export function goLitreacha(v: Value): string {
    if (Checks.isLitreacha(v)) {
        return v;
    }
    if (Checks.isNumber(v)) {
        return v.toString();
    }
    if (Checks.isBool(v)) {
        return v ? "fíor" : "breag";
    }
    if (v === null) {
        return "neamhní";
    }
    if (Checks.isLiosta(v)) {
        return `[${v.map(goLitreacha).join(",")}]`;
    }
    if (Checks.isCallable(v)) {
        return `< gníomh ${v.ainm} >`;
    }
    return `< obj ${v.ainm} >`; // TODO athraigh go Gaeilge
}
