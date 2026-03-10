const crypto = require("crypto");

function generatePassword(length = 12) {
    if (length < 8) {
        throw new Error("Password length must be at least 8 characters");
    }

    const charset = {
        numbers: "0123456789",
        upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lowerCase: "abcdefghijklmnopqrstuvwxyz",
        specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>/?",
    };

    // Ensure the password includes at least one number, one uppercase letter, and one special character
    const mandatoryChars = [
        charset.numbers[crypto.randomInt(0, charset.numbers.length)],       // One number
        charset.upperCase[crypto.randomInt(0, charset.upperCase.length)],   // One uppercase letter
        charset.specialChars[crypto.randomInt(0, charset.specialChars.length)],  // One special character
    ];

    // Combine all possible characters for the remaining part of the password
    const allChars = charset.numbers + charset.upperCase + charset.lowerCase + charset.specialChars;

    // Generate random characters to fill the rest of the password length
    const randomChars = Array.from(
        { length: length - mandatoryChars.length },
        () => allChars[crypto.randomInt(0, allChars.length)]
    );

    // Combine mandatory characters with random characters
    const passwordArray = [...mandatoryChars, ...randomChars];

    // Shuffle the array to ensure randomness
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join("");
}

module.exports = { generatePassword };
