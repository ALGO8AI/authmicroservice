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

const newUserRegisterMailgen = (username, email, password) => {
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
            intro: "Welcome to AuthMicroservice! Your account has been successfully created.",
            table: {
                data: [
                    {
                        Email: email,
                        Password: password
                    }
                ],
                columns: {
                    customWidth: {
                        Email: '50%',
                        Password: '50%'
                    },
                    customAlignment: {
                        Email: 'left',
                        Password: 'right'
                    }
                }
            },
            action: {
                instructions: "To get started, visit our documentation and log in using your credentials:",
                button: {
                    color: "#22BC66",
                    text: "Login Now",
                    link: "http://localhost:8080/login"
                }
            },
            outro: "Need help? Feel free to reply to this email. We're happy to assist you!"
        }
    });

    return text;
};


module.exports = {
    forgotPasswordMailgenContent,
    newUserRegisterMailgen
}