/**
 * Generates a random positive 64-bit numeric string. Used to generate client-side IDs.
 *
 * @returns string representation of a randomly generated 64-bit signed integer
 */
function rand64(): string {
    const buffer = new BigUint64Array(1);
    crypto.getRandomValues(buffer);

    // Right shift by 1 bit to ensure the number is positive (63-bit range)
    const positiveValue = buffer[0] >> 1n;
    return BigInt.asIntN(64, positiveValue).toString();
}

/**
 * Returns a hexadecimal value of the specified length
 */
function generateHexadecimalValue(num: number): string {
    const result: string[] = [];
    for (let i = 0; i < num; i++) {
        result.push(Math.floor(Math.random() * 16).toString(16));
    }
    return result.join('').toUpperCase();
}

/**
 * Generates a random integer between a and b
 * It's and equivalent of _.random(a, b)
 *
 * @returns random integer between a and b
 */
function generateRandomInt(a: number, b: number): number {
    const lower = Math.ceil(Math.min(a, b));
    const upper = Math.floor(Math.max(a, b));
    return Math.floor(lower + Math.random() * (upper - lower + 1));
}

/**
 * Parses a numeric string value containing a decimal separator from any locale.
 *
 * @param value the string value to parse
 * @returns a floating point number parsed from the string value
 */
function parseFloatAnyLocale(value: string): number {
    return parseFloat(value ? value.replace(',', '.') : value);
}

/**
 * Rounds a number to two decimal places.
 * @returns the rounded value
 */
function roundToTwoDecimalPlaces(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Clamps a value between a minimum and maximum value.
 * @returns the clamped value
 */
function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function generateNewRandomInt(old: number, min: number, max: number): number {
    let newNum = old;
    while (newNum === old) {
        newNum = generateRandomInt(min, max);
    }
    return newNum;
}

export {rand64, generateHexadecimalValue, generateRandomInt, parseFloatAnyLocale, roundToTwoDecimalPlaces, clamp, generateNewRandomInt};
