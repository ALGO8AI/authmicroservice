const dotenv = require('dotenv');
const { httpServer } = require("./app");

dotenv.config({
    path: "./.env"
});

const startServer = () => {
    httpServer.listen(process.env.PORT || 8080, () => {
        console.log("⚙️  Server is running on port: " + process.env.PORT);
    })
}

(async function (){ 
    try {
        startServer();
    } catch (error) {
        console.log("Mongo db connect error: ", error);
    }
})();