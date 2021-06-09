const GraphQL = require('graphql');
var validator = require('validator');

//const auth = require('../../config/auth');
//const option = require('../../config/options');
const Generic = require('../types/Generic');


const {
    GraphQLNonNull,
    GraphQLString,
    GraphQLInt,
    GraphQLID,
    GraphQLList
} = GraphQL;

// lets import our user type
const UserType = require('../types/User');
const AddressType = require('../types/Address');

// lets import our user resolver
const UserResolver = require('../resolvers/User');


module.exports = {

    
    create() {
        return {
            type: UserType,
            description: 'Add new cuisine',

            args: {
                cuisineName: {
                    type: new GraphQLNonNull(GraphQLString),
                    description: 'Enter cuisine name, Cannot be left empty',
                },
                sortOrder: {
                    type: new GraphQLNonNull(GraphQLString),
                    description: 'Enter sort order',
                },                
            },
            resolve(parent, fields) {
                /*if (!validator.isMobilePhone(fields.mobileNumber,'en-IN')) {
                    throw new Error("Invalid mobile number!");
                }*/

                if (!validator.isLength(fields.cuisineName, {min: 6, max: undefined})) {
                    throw new Error("Your cuisine name should be greater then " + 6 + " characters!");
                }

                return UserResolver.create(fields);
            }
        }
    },

};
   