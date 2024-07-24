const { User } = require("../../../models/apps/auth/user.models");


const userQueries = {
    findOne: async function(filter){
        const data = await User.findOne(filter);
        return data;
    },
    findById: async function(id, selectString=""){
        const data = await User.findById(id).select(selectString);
        return data;
    },
    find: async function (filter){
        const data = await User.find(filter);
        return data;
    },
    create: async function(body){
        const data = await User.create(body);
        return data;
    },
    findByIdAndUpdate: async function (condition, body, options={}){
        const data = await User.findByIdAndUpdate(condition, body, options);
        return data;
    }
}

module.exports = userQueries