const GraphQL = require('graphql');
const {
	GraphQLObjectType,
	GraphQLString,
    GraphQLBoolean,
	GraphQLID,
	GraphQLInt,
    GraphQLList,
} = GraphQL;

const Generic = require('./Generic');
const Address = require('./Address');


const UserType = new GraphQL.GraphQLObjectType({
	name: 'User',
	description: 'User type for managing all the users in our application.',

	fields: () => ({
		id: {
			type: GraphQLID,
			description: 'ID of the user, Generated automatically by MongoDB',
		},
		cuisineName: {
			type: GraphQLString,
			description: 'Cuisine Name',
		},        
		sortOrder: {
			type: GraphQLString,
			description: 'sortOrder of details',
		}

	})

});


module.exports = UserType;

