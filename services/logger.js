const winston = require('winston');

const myCustomLevels = {
  levels: {
    error: 0, 
    warn: 1, 
    info: 2, 
    verbose: 3, 
    debug: 4, 
    silly: 5
  },
  colors: {
    error: 'blue',
    warn: 'green',
    info: 'yellow',
    verbose: 'red',
    debug: 'red',
    silly: 'red'
  }
};

let logTransports = [new (winston.transports.Console)({
  timestamp: true,
  handleExceptions: true,
  humanReadableUnhandledException: true,
  level: myCustomLevels.levels.debug,
  stringify: true,
  json : true
})];


let logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true
        }),
        //new winston.transports.File({ filename: 'db.log' })

    ]
});

module.exports = logger;