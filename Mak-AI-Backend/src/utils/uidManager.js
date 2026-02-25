const crypto = require('crypto');

/**
 * Generates a random alphanumeric string of a given length.
 * @param {number} length - The length of the string to generate.
 * @returns {string} - The generated random string.
 */
const generateRandomString = (length = 16) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, length); // return required number of characters
};

/**
 * Generates a standard UUID v4.
 * @returns {string} - The generated UUID v4.
 */
const generateUUID = () => {
    return crypto.randomUUID();
};

module.exports = {
    generateRandomString,
    generateUUID
};
