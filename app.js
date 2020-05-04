const fs = require('fs')
const pa = require('./lib/parser.js')
const ut = require('./lib/util.js')

const logger = require('winston')

const ArgumentParser = require('argparse').ArgumentParser
/// ///////////////////////////////////////

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Modelica parser'
})
parser.addArgument(
  [ '-o', '--output' ],
  {
    help: 'Specify output format. Specify multiple formats within double quotes separated by ;',
    choices: ['raw-json', 'json', 'html', 'docx', 'raw-json;json', 'raw-json;html', 'raw-json;docx', 'json;html', 'json;docx', 'html;docx', 'raw-json;json;html', 'raw-json;json;docx', 'raw-json;html;docx', 'json;html;docx', 'raw-json;json;html;docx'],
    defaultValue: 'html'
  }
)
parser.addArgument(
  [ '-l', '--log' ],
  {
    help: "Logging level, 'info' is the default.",
    choices: ['error', 'warn', 'info', 'verbose', 'debug'],
    defaultValue: 'info'
  }
)
parser.addArgument(
  [ '-m', '--mode' ],
  {
    help: "Parsing mode, CDL model or a package of the Modelica Buildings library, 'cdl' is the default.",
    choices: ['cdl', 'modelica'],
    defaultValue: 'cdl'
  }
)
parser.addArgument(
  [ '-f', '--file' ],
  {
    help: 'Filename or packagename that contains the top-level Modelica class.',
    required: true
  }
)
parser.addArgument(
  [ '-d', '--directory' ],
  {
    help: 'Specify output directory, with the default being the current.',
    defaultValue: 'current'
  }
)
var args = parser.parseArgs()
outputFormats = args.output.split(';')

const logFile = 'modelica-json.log'
try {
  fs.unlinkSync(logFile)
} catch (ex) {}

logger.configure({
  transports: [
    new logger.transports.Console(),
    new logger.transports.File({ filename: logFile })
  ],
  handleExceptions: true,
  humanReadableUnhandledException: true
})
logger.cli()

logger.level = args.log

// Get mo files array
var moFiles = ut.getMoFiles(args.mode, args.file)

// Parse the json representation for moFiles
var rawJson = pa.getRawJSON(moFiles, args.mode)
console.log(rawJson)

var json2 = pa.getJSON2(rawJson, moFiles, args.mode, args.output)
console.log(json2)

var json = pa.getJSON(moFiles, args.mode, args.output)
console.log(json)

// Get the name array of output files
var outFile = ut.getOutFile(args.mode, args.file, args.output, args.directory, moFiles, json)

pa.exportJSON(json, outFile, args.output, args.mode, args.directory)

setTimeout(function () { ut.jsonSchemaValidate(args.mode, outFile[0], args.output) }, 100)
