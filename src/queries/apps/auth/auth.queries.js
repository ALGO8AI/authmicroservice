const PlatformUsers = require("../../../models/apps/auth/PlatformUsers.models");


const userQueries = {
    findOne: async function(filter){
        const data = await PlatformUsers.findOne(filter);
        return data;
    },
    findById: async function(id, options){
        const data = await PlatformUsers.findByPk(id, options)
        return data;
    },
    find: async function (filter){
        const data = await PlatformUsers.findAll(filter);
        return data;
    },
    create: async function(body){
        const data = await PlatformUsers.create(body);
        return data;
    },
    findOneAndUpdate: async function (filter, body){
        const data = await PlatformUsers.findOne(filter);
        if(!data) throw new Error('Record not found');
        return await data.update(body);
    },
    delete: async function (userId){
        const data = await PlatformUsers.destroy({where: {userId}});
        return data;
    }
}

module.exports = userQueries