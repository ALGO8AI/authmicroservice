const dotenv = require('dotenv');
const connectDB = require("./db/index.js"); 
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
        await connectDB();
        startServer();
    } catch (error) {
        console.log("Mongo db connect error: ", error);
    }
})();