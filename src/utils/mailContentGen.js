const Mailgen = require("mailgen");

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {

    let mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'AuthMicroservice',
            link: 'http://localhost:8080/docs'
        }
    });

    var text = mailGenerator.generate({
        body: {
            name: username,
            intro: "We got a request to reset the password of our account",
            action: {
                instructions:
                    "To reset your password click on the following button or link:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    })
    return text;
};


module.exports = {
    forgotPasswordMailgenContent
}