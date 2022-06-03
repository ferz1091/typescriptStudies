const defaults: defType = {
    symbol: '$',
    separator: ',',
    decimal: '.',
    formatWithSymbol: false,
    errorOnInvalid: false,
    precision: 2,
    pattern: '!#',
    negativePattern: '-!#'
};
interface defType {
    symbol: string;
    separator: string;
    decimal: string;
    formatWithSymbol: boolean;
    errorOnInvalid: boolean;
    precision: number;
    pattern: string;
    negativePattern: string
}
interface additionalType extends defType {
    increment: number;
    useVedic: boolean;
    groups: RegExp;
}
const round = (v: number): number => Math.round(v);
const pow = (p: number): number => Math.pow(10, p);
const rounding = (value: number, increment: number): number => round(value / increment) * increment;

const groupRegex = /(\d)(?=(\d{3})+\b)/g;
const vedicRegex = /(\d)(?=(\d\d)+\d\b)/g;

/**
 * Create a new instance of currency.js
 * @param {number|string|currency} value
 * @param {object} [opts]
 */

class Currency {
    constructor_value: number | string | Currency;
    opts: object;
    intValue: number;
    value: number;
    _settings: additionalType;
    _precision: number;
    constructor(value: number | string | Currency, opts: additionalType) {
        let that: Currency = this;
        if (!(value instanceof Currency)) {
            this.constructor_value = value;
            this.opts = opts;
        }
        let settings = (<any>Object).assign({}, defaults, opts)
            , precision = pow(settings.precision)
            , v = parse(value, settings);

        that.intValue = v;
        that.value = v / precision;

        // Set default incremental value
        settings.increment = settings.increment || (1 / precision);

        // Support vedic numbering systems
        // see: https://en.wikipedia.org/wiki/Indian_numbering_system
        if (settings.useVedic) {
            settings.groups = vedicRegex;
        } else {
            settings.groups = groupRegex;
        }

        // Intended for internal usage only - subject to change
        this._settings = settings;
        this._precision = precision;
    }
    add(number: number): Currency {
        let { intValue, _settings, _precision } = this;
        return new Currency((intValue += parse(number, _settings)) / _precision, _settings);
    }
    subtract(number: number): Currency {
        let { intValue, _settings, _precision } = this;
        return new Currency((intValue -= parse(number, _settings)) / _precision, _settings);
    }
    multiply(number: number): Currency {
        let { intValue, _settings } = this;
        return new Currency((intValue *= number) / pow(_settings.precision), _settings);
    }
    divide(number: number): Currency {
        let { intValue, _settings } = this;
        return new Currency(intValue /= parse(number, _settings, false), _settings);
    }
    distribute(count: number): Array<Currency> {
        let { intValue, _precision, _settings } = this
            , distribution = []
            , split = Math[intValue >= 0 ? 'floor' : 'ceil'](intValue / count)
            , pennies = Math.abs(intValue - (split * count));

        for (; count !== 0; count--) {
            let item = new Currency(split / _precision, _settings);

            // Add any left over pennies
            pennies-- > 0 && (item = intValue >= 0 ? item.add(1 / _precision) : item.subtract(1 / _precision));

            distribution.push(item);
        }

        return distribution;
    }
    dollars():number {
        return ~~this.value;
    }
    cents(): number {
        let { intValue, _precision } = this;
        return ~~(intValue % _precision);
    }
    format(useSymbol: boolean): string {
        let { pattern, negativePattern, formatWithSymbol, symbol, separator, decimal, groups } = this._settings
            , values = (this + '').replace(/^-/, '').split('.')
            , dollars = values[0]
            , cents = values[1];

        // set symbol formatting
        typeof (useSymbol) === 'undefined' && (useSymbol = formatWithSymbol);

        return (this.value >= 0 ? pattern : negativePattern)
            .replace('!', useSymbol ? symbol : '')
            .replace('#', `${dollars.replace(groups, '$1' + separator)}${cents ? decimal + cents : ''}`);
    }
    toString(): string {
        let { intValue, _precision, _settings } = this;
        return rounding(intValue / _precision, _settings.increment).toFixed(_settings.precision);
    }
    toJSON(): number {
        return this.value;
    }
}

function parse(value: number | string | Currency, opts: additionalType, useRounding: boolean = true): number {
    let v = 0
        , { decimal, errorOnInvalid, precision: decimals } = opts
        , precision = pow(decimals)
        , isNumber = typeof value === 'number';

    if (isNumber || value instanceof Currency) {
        v = ((isNumber ? value : this.prototype.value) * precision);
    } else if (typeof value === 'string') {
        let regex = new RegExp('[^-\\d' + decimal + ']', 'g')
            , decimalString = new RegExp('\\' + decimal, 'g');
        v = Number(value
            .replace(/\((.*)\)/, '-$1')   // allow negative e.g. (1.99)
            .replace(regex, '')           // replace any non numeric values
            .replace(decimalString, '.'))  // convert any decimal values
            * precision;                  // scale number to integer value
        v = v || 0;
    } else {
        if (errorOnInvalid) {
            throw Error('Invalid Input');
        }
        v = 0;
    }

    // Handle additional decimal for proper rounding.
    v = +v.toFixed(4);

    return useRounding ? round(v) : v;
}

export default Currency;