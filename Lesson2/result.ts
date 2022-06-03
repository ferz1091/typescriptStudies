var emitter: defType = {};

interface defType {
    events?: {};
    on?(arg1: string, arg2: string): defType;
    off?(arg1: string, arg2: string): defType;
    trigger?(arg1: eventType, arg2: Array<object>): defType;
    _dispatch?(arg1: {type: any}, arg2: Array<object>): defType | void;
    _offByHandler?(arg1: string, arg2: string): defType | void;
    _offByType?(arg: string): defType;
    _offAll?(): defType;
}

function Emitter(): void {
    var e = Object.create(emitter);
    e.events = {};
    return e;
}
type eventType = {new(type: string | eventType): void};

function EventF(type: string | eventType): void {
    this.type = type;
    this.timeStamp = new Date();
}

emitter.on = function (type, handler) {
    if (this.events.hasOwnProperty(type)) {
        this.events[type].push(handler);
    } else {
        this.events[type] = [handler];
    }
    return this;
};

emitter.off = function (type, handler) {
    if (arguments.length === 0) {
        return this._offAll();
    }
    if (handler === undefined) {
        return this._offByType(type);
    }
    return this._offByHandler(type, handler);
};

emitter.trigger = function (event, args) {
    if (!(event instanceof EventF)) {
        event = new EventF(event);
    }
    return this._dispatch(event, args);
};

emitter._dispatch = function (event, args) {
    if (!this.events.hasOwnProperty(event.type)) return;
    args = args || [];
    args.unshift(event);

    var handlers = this.events[event.type] || [];
    handlers.forEach((handler: { apply: (arg1: null, arg2: Array<object>) => any; }) => handler.apply(null, args));
    return this;
};

emitter._offByHandler = function (type, handler) {
    if (!this.events.hasOwnProperty(type)) return;
    var i = this.events[type].indexOf(handler);
    if (i > -1) {
        this.events[type].splice(i, 1);
    }
    return this;
};

emitter._offByType = function (type) {
    if (this.events.hasOwnProperty(type)) {
        delete this.events[type];
    }
    return this;
};

emitter._offAll = function () {
    this.events = {};
    return this;
};

Emitter.Event = EventF;

Emitter.mixin = function (obj: Object, arr: Array<any>): defType | void {
    var emitter = new Emitter();
    arr.map(function (name: string) {
        obj[name] = function () {
            return emitter[name].apply(emitter, arguments);
        };
    });
};