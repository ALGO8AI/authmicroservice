const axios = require("axios");
require("dotenv").config();
const fs = require("fs");

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const username = process.env.MAIL
const password = process.env.PASSKEY

// This is an asynchronous function, marked by 'async'
async function accessToken(clientId, clientSecret) {
    const tokenData = new URLSearchParams();
    // tokenData.append('grant_type', 'client_credentials');
    tokenData.append("client_id", clientId);
    tokenData.append("client_secret", clientSecret);
    tokenData.append("scope", "https://graph.microsoft.com/.default");
    tokenData.append("grant_type", "password");
    tokenData.append("username", username);
    tokenData.append("password", password);

    const tokenUrl =
        "https://login.microsoftonline.com/08b7cfeb-897e-469b-9436-974e694a8df2/oauth2/v2.0/token";

    try {
        // Here, 'await' is used to pause the function execution until the Promise resolves
        const response = await axios.post(tokenUrl, tokenData.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // Once the promise resolves, the result is returned
        return response.data.access_token;
    } catch (error) {
        // Errors in the request are caught here
        return error;
    }
}

async function sendEmail(
    to_emails,
    subject,
    mailBody,
    cc_emails = [],
    filePaths = []
) {
    try {
        const token = await accessToken(clientId, clientSecret);
        const mailUrl = `https://graph.microsoft.com/v1.0/users/${username}/sendMail`;

        // Map each email in to_emails to the required format for toRecipients
        let toRecipients = to_emails.map((email) => ({
            emailAddress: {
                address: email,
            },
        }));

        // Map each email in cc_emails to the required format for ccRecipients
        let ccRecipients = cc_emails.map((email) => ({
            emailAddress: {
                address: email,
            },
        }));

        // Read and encode each file from the provided file paths

        let messagePayload = {
            message: {
                subject: subject,
                body: {
                    contentType: "HTML",
                    content: mailBody,
                },
                toRecipients: toRecipients,
                ccRecipients: ccRecipients,
                attachments: filePaths, // Include the attachments here
            },
            saveToSentItems: "true",
        };

        let config = {
            method: "POST",
            url: mailUrl,
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify(messagePayload),
        };

        // console.log(messagePayload);

        const response = await axios(config);
        return {
            flag: true,
            statusCode: response.status,
        };
    } catch (error) {
        // console.log(error.response.data);
        return {
            flag: false,
            error: error,
        };
    }
}

module.exports = sendEmail
