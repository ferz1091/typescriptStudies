"use strict";
exports.__esModule = true;
var defaults = {
    symbol: '$',
    separator: ',',
    decimal: '.',
    formatWithSymbol: false,
    errorOnInvalid: false,
    precision: 2,
    pattern: '!#',
    negativePattern: '-!#'
};
var round = function (v) { return Math.round(v); };
var pow = function (p) { return Math.pow(10, p); };
var rounding = function (value, increment) { return round(value / increment) * increment; };
var groupRegex = /(\d)(?=(\d{3})+\b)/g;
var vedicRegex = /(\d)(?=(\d\d)+\d\b)/g;
/**
 * Create a new instance of currency.js
 * @param {number|string|currency} value
 * @param {object} [opts]
 */
var Currency = /** @class */ (function () {
    function Currency(value, opts) {
        var that = this;
        if (!(value instanceof Currency)) {
            this.constructor_value = value;
            this.opts = opts;
        }
        var settings = Object.assign({}, defaults, opts), precision = pow(settings.precision), v = parse(value, settings);
        that.intValue = v;
        that.value = v / precision;
        // Set default incremental value
        settings.increment = settings.increment || (1 / precision);
        // Support vedic numbering systems
        // see: https://en.wikipedia.org/wiki/Indian_numbering_system
        if (settings.useVedic) {
            settings.groups = vedicRegex;
        }
        else {
            settings.groups = groupRegex;
        }
        // Intended for internal usage only - subject to change
        this._settings = settings;
        this._precision = precision;
    }
    Currency.prototype.add = function (number) {
        var _a = this, intValue = _a.intValue, _settings = _a._settings, _precision = _a._precision;
        return new Currency((intValue += parse(number, _settings)) / _precision, _settings);
    };
    Currency.prototype.subtract = function (number) {
        var _a = this, intValue = _a.intValue, _settings = _a._settings, _precision = _a._precision;
        return new Currency((intValue -= parse(number, _settings)) / _precision, _settings);
    };
    Currency.prototype.multiply = function (number) {
        var _a = this, intValue = _a.intValue, _settings = _a._settings;
        return new Currency((intValue *= number) / pow(_settings.precision), _settings);
    };
    Currency.prototype.divide = function (number) {
        var _a = this, intValue = _a.intValue, _settings = _a._settings;
        return new Currency(intValue /= parse(number, _settings, false), _settings);
    };
    Currency.prototype.distribute = function (count) {
        var _a = this, intValue = _a.intValue, _precision = _a._precision, _settings = _a._settings, distribution = [], split = Math[intValue >= 0 ? 'floor' : 'ceil'](intValue / count), pennies = Math.abs(intValue - (split * count));
        for (; count !== 0; count--) {
            var item = new Currency(split / _precision, _settings);
            // Add any left over pennies
            pennies-- > 0 && (item = intValue >= 0 ? item.add(1 / _precision) : item.subtract(1 / _precision));
            distribution.push(item);
        }
        return distribution;
    };
    Currency.prototype.dollars = function () {
        return ~~this.value;
    };
    Currency.prototype.cents = function () {
        var _a = this, intValue = _a.intValue, _precision = _a._precision;
        return ~~(intValue % _precision);
    };
    Currency.prototype.format = function (useSymbol) {
        var _a = this._settings, pattern = _a.pattern, negativePattern = _a.negativePattern, formatWithSymbol = _a.formatWithSymbol, symbol = _a.symbol, separator = _a.separator, decimal = _a.decimal, groups = _a.groups, values = (this + '').replace(/^-/, '').split('.'), dollars = values[0], cents = values[1];
        // set symbol formatting
        typeof (useSymbol) === 'undefined' && (useSymbol = formatWithSymbol);
        return (this.value >= 0 ? pattern : negativePattern)
            .replace('!', useSymbol ? symbol : '')
            .replace('#', "".concat(dollars.replace(groups, '$1' + separator)).concat(cents ? decimal + cents : ''));
    };
    Currency.prototype.toString = function () {
        var _a = this, intValue = _a.intValue, _precision = _a._precision, _settings = _a._settings;
        return rounding(intValue / _precision, _settings.increment).toFixed(_settings.precision);
    };
    Currency.prototype.toJSON = function () {
        return this.value;
    };
    return Currency;
}());
function parse(value, opts, useRounding) {
    if (useRounding === void 0) { useRounding = true; }
    var v = 0, decimal = opts.decimal, errorOnInvalid = opts.errorOnInvalid, decimals = opts.precision, precision = pow(decimals), isNumber = typeof value === 'number';
    if (isNumber || value instanceof Currency) {
        v = ((isNumber ? value : this.prototype.value) * precision);
    }
    else if (typeof value === 'string') {
        var regex = new RegExp('[^-\\d' + decimal + ']', 'g'), decimalString = new RegExp('\\' + decimal, 'g');
        v = Number(value
            .replace(/\((.*)\)/, '-$1') // allow negative e.g. (1.99)
            .replace(regex, '') // replace any non numeric values
            .replace(decimalString, '.')) // convert any decimal values
            * precision; // scale number to integer value
        v = v || 0;
    }
    else {
        if (errorOnInvalid) {
            throw Error('Invalid Input');
        }
        v = 0;
    }
    // Handle additional decimal for proper rounding.
    v = +v.toFixed(4);
    return useRounding ? round(v) : v;
}
exports["default"] = Currency;
