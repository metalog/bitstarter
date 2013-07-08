#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return fs.readFileSync(htmlfile);
};

var promiseHtmlUrl = function(htmlurl) {
    var defer = require('node-promise').Deferred;
    var deferred = new defer();
    var rest = require('restler');
    rest.get(htmlurl).on('complete', function(data,resp){
	if (data instanceof Error) {
	    deferred.reject(data)
	} else {
	    deferred.resolve(data)
	}
    });
    return deferred.promise
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, htmlurl) {
    if (htmlurl) { s = promiseHtmlUrl(htmlurl) }
    else         { s = cheerioHtmlFile(htmlfile) }
    var when=require('node-promise').when
    return when(s, function(htmlStr){
	var $ = cheerio.load(htmlStr)
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
	}
	return out;
    })
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <http://url>', 'URL to index.html')
        .parse(process.argv);
    checkHtmlFile(program.file, program.checks, program.url)
	.then(function(checkJson){ 
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	})
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

