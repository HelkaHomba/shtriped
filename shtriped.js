/*
Shtriped Interpreter
s = print as String
h = trasH
t = Take input as integer
r = take input as stRing
i = Increment
p = Print as integer
e = dEclare
d = Decrement
\ = inline comment
[] = nestable block comment
*/

// Node packages
var fs = require('fs')
var bigInt = require('big-integer')
var regexEscape = require('escape-string-regexp')

var ALPHABET = '\t\n\v\f\r !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
var CODE_ALPHABET = ALPHABET.split('').filter(function(c) { return '\t\v\f'.indexOf(c) === -1 }).join('')
var INT_PATTERN = /^\s*\+?\d+\s*$/
var COMPONENTS = Object.freeze({
  SEPERATOR: ' ',
  COMMENT: '\\',
  COMMENT_LEFT: '[',
  COMMENT_RIGHT: ']'
})
var COMMANDS = Object.freeze({
  PRINT_STR: 's',
  TRASH: 'h',
  TAKE_INT: 't',
  TAKE_STR: 'r',
  INCR: 'i',
  PRINT_INT: 'p',
  DECLARE: 'e',
  DECR: 'd'
})

function ShtripedError(message, stmt) {
  this.message = message
  if (!undef(stmt)) {
    this.message += ' [' + [stmt.name].concat(stmt.args).join(COMPONENTS.SEPERATOR) + ']'
  }
}
ShtripedError.prototype = Object.create(Error.prototype)
ShtripedError.prototype.name = 'ShtripedError'
function newErr(message, stmt) {
  return new ShtripedError(message, stmt)
}

function undef(obj) {
  return typeof obj === 'undefined'
}

function strToInt(s) {
  var i = bigInt.zero, place = bigInt.one
  for(var j = s.length - 1; j >= 0; j--) {
    i = i.add(place.times(ALPHABET.indexOf(s.charAt(j)) + 1))
    place = place.times(ALPHABET.length)
  }
  return i
}

function intToStr(i) {
  var length = 0, offset = bigInt.one
  while (i.greaterOrEquals(offset)) {
    i = i.minus(offset)
    offset = offset.times(ALPHABET.length)
    length += 1
  }
  var s = []
  while (!i.isZero()) {
    s.push(ALPHABET.charAt(i.mod(ALPHABET.length)))
    i = i.divide(ALPHABET.length)
  }
  s = s.reverse().join('')
  return ALPHABET.charAt(0).repeat(length - s.length) + s
}

function getEnv(key, env) {
  while (!env.hasOwnProperty(key)) {
    if (!env.hasOwnProperty('')) {
      return null
    }
    env = env['']
  }
  return env
}

// Removes comments and unnecessary whitespace, returning ready to parse Shtriped code
function sanitize(code) {
  // Remove block comments
  var blockStarts = [], toRemove = {}
  for (var i = 0; i < code.length; i++) {
    if (code.charAt(i) === COMPONENTS.COMMENT_LEFT) {
      blockStarts.push(i)
    } else if (code.charAt(i) === COMPONENTS.COMMENT_RIGHT) {
      var start = blockStarts.length > 0 ? blockStarts.pop() : 0
      for (var j = start; j <= i; j++) {
        toRemove[j] = true
      }
    }
  }
  for (var i = 0; i < blockStarts.length; i++) {
    for (var j = blockStarts[i]; j < code.length; j++) {
      toRemove[j] = true
    }
  }
  var tmpCode = []
  for (var i = 0; i < code.length; i++) {
    if (!toRemove.hasOwnProperty(i)) {
      tmpCode.push(code.charAt(i))
    }
  }
  code = tmpCode.join('')

  // Remove comments
  code = code.replace(new RegExp(regexEscape(COMPONENTS.COMMENT) + '.*$', 'gm'), '')
  // Remove trailing whitespace and empty lines
  code = code.replace(/\s+$/gm,'').replace(/^\r?\n/, '')

  // Check for invalid characters
  for(var i = 0; i < code.length; i++) {
    if (CODE_ALPHABET.indexOf(code.charAt(i)) === -1)
      throw newErr('Code contains forbidden character "' + code.charAt(i) + '".')
  }
  return code
}

// Parses sanitized Shtriped code into executable bytecode
function parse(code, split) {
  if (split || undef(split)) {
    code = code.split(/\r?\n/)
    if (!code[0]) {
      code = []
    }
  }
  var bytecode = [], i = 0
  while (i < code.length) {
    var stmt = code[i++].split(COMPONENTS.SEPERATOR)
    if (!stmt.every(function(s) { return s }))
      throw newErr('Invalid arrangement of separators on the line "' + code[i - 1] + '".')
    if (i < code.length && code[i].charAt(0) === COMPONENTS.SEPERATOR) { // Function definition
      for (var j = 1; j < stmt.length; j++) {
        for (var k = 1; k < j; k++) {
          if (stmt[j] === stmt[k])
            throw newErr('The definition for function "' + stmt[0] + '" cannot have multiple arguments with the name "' + stmt[j] + '".')
        }
      }
      var body = []
      while (i < code.length && code[i].charAt(0) === COMPONENTS.SEPERATOR) {
        body.push(code[i++].substring(1))
      }
      bytecode.push({ name: stmt[0], args: stmt.slice(1), body: parse(body, false) })
    } else { // Function call
      bytecode.push({ name: stmt[0], args: stmt.slice(1), body: null})
    }
  }
  return bytecode
}

function isFunc(variable) {
  return variable.constructor === Object
}

function passAlong(variable) {
  if (isFunc(variable)) {
    return variable
  }
  return variable.add(bigInt.zero) // adding zero to a big int effectively copies it
}

function callBuiltIn(stmt, env, inputObj) {
  if (stmt.args.length !== 1)
    throw newErr('Attempted call to built-in function "' + stmt.name + '" expects one argument but got ' + stmt.args.length + '.', stmt)
  var arg = stmt.args[0]
  if (stmt.name === COMMANDS.DECLARE) {
    if (env.hasOwnProperty(arg))
      throw newErr('Variable "' + arg + '" has already been declared in this scope.', stmt)
    env[arg] = bigInt.zero
    return env[arg]
  }
  if (stmt.name === COMMANDS.TRASH) {
    if (!env.hasOwnProperty(arg))
      throw newErr('Variable "' + arg + '" has not been declared in this scope and thus cannot be trashed.', stmt)
    var val = env[arg]
    delete env[arg]
    return val
  }
  var argEnv = getEnv(arg, env)
  if (!argEnv)
    throw newErr('Variable "' + arg + '" not found while trying to call built-in function "' + stmt.name + '".', stmt)
  var val = argEnv[arg]
  if (isFunc(val))
    throw newErr('Built-in function "' + stmt.name + '" cannot be called on the function "' + arg + '".', stmt)
  switch(stmt.name) {
    case COMMANDS.INCR:
      argEnv[arg] = val.add(bigInt.one)
      return argEnv[arg]
    case COMMANDS.DECR:
      if (val.isZero()) {
        return null
      }
      argEnv[arg] = val.subtract(bigInt.one)
      return argEnv[arg]
    case COMMANDS.PRINT_INT:
      process.stdout.write(val.toString())
      return val
    case COMMANDS.TAKE_INT:
      if (inputObj.index >= inputObj.input.length)
        throw newErr('Input exhausted, cannot take integer as input.', stmt)
      var input = inputObj.input[inputObj.index++]
      if (!INT_PATTERN.test(input))
        throw newErr('Cannot parse "' + input + '" as a positive decimal integer.', stmt)
      argEnv[arg] = bigInt(input)
      return argEnv[arg]
    case COMMANDS.PRINT_STR:
      process.stdout.write(intToStr(val))
      return val
    case COMMANDS.TAKE_STR:
      if (inputObj.index >= inputObj.input.length)
        throw newErr('Input list exhausted, cannot take string as input.', stmt)
      var input = inputObj.input[inputObj.index++]
      for(var i = 0; i < input.length; i++) {
        if (ALPHABET.indexOf(input.charAt(i)) === -1)
          throw newErr('Input string contains forbidden character "' + input.charAt(i) + '".', stmt)
      }
      argEnv[arg] = strToInt(input)
      return argEnv[arg]
  }
  throw newErr('Function "' + stmt.name + '" not found.', stmt)
}

function execute(func, env, inputObj) {
  var retVal = bigInt.zero
  for (var i = 0; i < func.body.length; i++) {
    var stmt = func.body[i]
    if (stmt.body) { // Function definition
      if (env.hasOwnProperty(stmt.name))
        throw newErr('Variable "' + stmt.name + '" has already been declared in this scope and must be trashed to be (re)defined as a function.', stmt)
      retVal = env[stmt.name] = { args: stmt.args, body: stmt.body, env: env }
    } else { // Function call
      var callEnv = getEnv(stmt.name, env)
      if (callEnv) { // User defined function
        var userFunc = callEnv[stmt.name]
        if (!isFunc(userFunc))
          throw newErr('Cannot call the integer "' + stmt.name + '" as a function.', stmt)
        if (stmt.args.length !== userFunc.args.length && stmt.args.length !== userFunc.args.length + 1)
          throw newErr('Function "' + stmt.name + '" expects ' + userFunc.args.length + ' or ' + (userFunc.args.length + 1) + ' arguments but got ' + stmt.args.length + '.', stmt)
        
        var newEnv = { '': userFunc.env }
        for (var j = 0; j < userFunc.args.length; j++) {
          var argEnv = getEnv(stmt.args[j], env)
          if (!argEnv)
            throw newErr('Variable "' + stmt.args[j] + '" not found while trying to call function "' + stmt.name + '".', stmt)
          newEnv[userFunc.args[j]] = passAlong(argEnv[stmt.args[j]])
        }

        if (i === func.body.length - 1 && userFunc === func && stmt.args.length === userFunc.args.length) { // recursive tail call
          env = newEnv
          i = -1
        } else { // normal call
          retVal = execute(userFunc, newEnv, inputObj)
          if (stmt.args.length > userFunc.args.length) {
            var retVar = stmt.args[stmt.args.length - 1], retEnv = getEnv(retVar, env)
            if (!retEnv)
              throw newErr('Variable "' + retVar + '" not found while returning from function "' + stmt.name + '".', stmt)
            retEnv[retVar] = retVal
          }
        }
      } else { // Built-in function
        var returned = callBuiltIn(stmt, env, inputObj)
        if (returned === null) {
          break
        }
        retVal = returned
      }
    }
  }
  return passAlong(retVal)
}

// Runs Shtriped code given as a string on list of input strings, importing any desired library files
function run(code, input, libs) {
  if (undef(input)) {
    input = []
  }
  var bytecode = []
  function readLib(i) {
    if (i < libs.length) {
      fs.readFile(libs[i], 'utf8', function(err, data) {
        if (err)
          throw newErr('Issue loading library file "' + libs[i] + '". ' + err.message)
        Array.prototype.push.apply(bytecode, parse(sanitize(data)))
        readLib(i + 1)
      })
    } else {
      Array.prototype.push.apply(bytecode, parse(sanitize(code)))
      execute({ body: bytecode }, {}, { input: input, index: 0 })
    }
  }
  readLib(0)
}

// Runs a Shtriped code file with a given input file, importing any desired library files
function runFile(file, inputFile, libs) {
  fs.readFile(file, 'utf8', function(err, data) {
    if (err)
      throw newErr('Issue loading code file "' + file + '". ' + err.message)
    if (undef(inputFile)) {
      run(data, [], libs)
    } else {
      fs.readFile(inputFile, 'utf8', function(inputErr, inputData) {
        if (inputErr)
          throw newErr('Issue loading input file "' + inputFile + '". ' + inputErr.message)
        var input = inputData.split(/\r?\n/)
        if (!input[input.length - 1]) {
          input = input.slice(0, input.length - 1)
        }
        run(data, input, libs)
      })
    }
  })
}

// Run Shtriped code according to command line arguments
if (process.argv.length < 3)
  throw newErr('Code file required. Command line format: node shtriped.js codeFile [inputFile [libFile1 [libFile2 ...]]]]')
runFile(process.argv[2], process.argv[3], process.argv.slice(5))
