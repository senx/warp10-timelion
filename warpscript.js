//
//   Copyright 2018  SenX S.A.S.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

//TODO: LAT/LONG/ELEV + options

var _ = require('lodash');
var Datasource = require('../lib/classes/datasource');
var fetch = require('node-fetch');

module.exports = new Datasource ('warpscript', {
  dataSource: true,
  args: [
    {
      name: 'code',
      types: ['string', 'null'],
      help: 'The WarpScript to plot. You can find the documentation on warp10.io.'
    },
    {
      name: 'position',
      types: ['number', 'null'],
      help: 'Some Warp 10 sources return multiple elements on the stack, which one should I use? 1 based index.'
    },
    {
      name: 'dataFormat',
      types: [ 'string', 'null'],
      help: 'Add custom series attributes. The api can be found on github: https://github.com/elastic/timelion/blob/master/bower_components/flot/API.md'
    }
  ],
  help: `
    [experimental]
    Pull data from Warp 10 using the WarpScript code. Set "warp10:backend.url" to the URL to get the data.`,

  fn: function warp10Fn(args, tlConfig) {

    //
    // Load data from the command argument
    //
    var config = _.defaults(args.byName, {
      code: '',
      position: 1,
      interval: tlConfig.time.interval,
      dataFormat: "NULL",
      warp10url: tlConfig.settings['timelion:warpscript.url'],
      headerValue: tlConfig.settings['timelion:warpscript.header']
    });

    //
    // Split time interval (split number from letters)
    //

    var intervalArray = config.interval.match(/[a-zA-Z]+|[0-9]+/g)
    
    //
    // Prepare body, storing time interval used in Timelion
    // 
    var prep_body = intervalArray[0] + " " + intervalArray[1] + " \'intervalTime\' STORE "

    //
    // Prepare the body adding the code
    //
    prep_body += config.code.toString();

    //
    // Add specific code to convert data to TimeLion format
    // And add bucketize size to match timelion buckets
    //
    prep_body += " " + config.position.toString() + " PICK ";

    //
    // Try parsing dataFormat attributes
    //
    
    var dataFormatAttributes = config.dataFormat;

    if (config.dataFormat != "NULL") {
      try { JSON.parse(config.dataFormat);}
      catch(e) {
        throw new Error('WarpScript() unsupported dataFormat: ' + config.dataFormat + '. warpscript() supports only JSON Strings');
      }
      dataFormatAttributes = "\'" + config.dataFormat + "\'";
      dataFormatAttributes += " JSON-> "
    }

    //
    // Add timelion dataFormats attributes to body
    //
    prep_body += dataFormatAttributes + " @orbit/timelion/convert ";

    //
    // Apply a Post on Warp 10 backend url
    //
    return fetch(config.warp10url, {

      //
      // Set up an HTTP(S) POST
      // with the body containing the code given as parameter fully completed
      //
      method: 'POST', 
      body: prep_body,
    }).then(function (resp) {
      if(!resp.ok) {
        throw new Error('WarpScript() catched an error at line ' + resp.headers._headers['x-' + config.headerValue + '-error-line'][0] 
          + ': ' + resp.headers._headers['x-' + config.headerValue + '-error-message'][0]);
      }

      //
      // Get result as JSON format
      //
      return resp.json();

    }).then(function(results) {

      //
      // Apply on result:
      // Retun an object containing a list of series 
      // Loaded from the user selected position on the WarpScript stack
      //
      // merge resulting object with user attribute
      return {
              type: 'seriesList',
              list: results[0]
      };
    }).catch(function(err) {
      throw new Error(err.message);
    });
  }
});
