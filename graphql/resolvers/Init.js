//const option = require('../../config/options');

class InitController {

    // this will find all the records in database and return it
    index() {
        return {
            appVersion: '0.0.1'
        }
    }
};

const init = new InitController();
module.exports = init;
