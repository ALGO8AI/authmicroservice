const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Auth Microservice API',
        description: 'API documentation for auth microservice',
    },
    host: 'localhost:8080',
    schemes: ['http'],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.js"]; // Path to the file where your Express app is defined

swaggerAutogen(outputFile, endpointsFiles, doc);
