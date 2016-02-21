// Shtriped interpreter - http://github.com/HelkaHomba/shtriped

var fs = require('fs')
var bigInt = require('big-integer')
var readlineSync = require('readline-sync')

var ALPHABET = '\t\n\v\f\r !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
var CODE_ALPHABET = ALPHABET.split('').filter(function(c) { return '\t\v\f'.indexOf(c) === -1 }).join('')
var INT_PATTERN = /^\s*\+?\d+\s*$/

var COMMANDS = Object.freeze({
	PRINT_STR: 's',
	TRASH: 'h',
	TAKE_INT: 't',
	TAKE_STR: 'r',
	INCREMENT: 'i',
	PRINT_INT: 'p',
	DECLARE: 'e',
	DECREMENT: 'd'
})
var COMPONENTS = Object.freeze({
	SEPARATOR: ' ',
	COMMENT: '\\\\', //double escaped for use in regex
	COMMENT_LEFT: '[',
	COMMENT_RIGHT: ']'
})
var PARENT_ENV_KEY = ''
var MAIN_FUNC = COMPONENTS.SEPARATOR

function ShtripedError(message, stmt) {
	this.message = message
	if (!undef(stmt)) {
		this.message += ' [' + [stmt.name].concat(stmt.args).join(COMPONENTS.SEPARATOR) + ']'
	}
}
ShtripedError.prototype = Object.create(Error.prototype)
ShtripedError.prototype.name = 'ShtripedError'
function err(message, stmt) {
	return new ShtripedError(message, stmt)
}

function undef(obj) {
	return typeof obj === 'undefined'
}

function strToInt(str) {
	var i = bigInt.zero, place = bigInt.one
	for(var j = str.length - 1; j >= 0; j--) {
		i = i.add(place.times(ALPHABET.indexOf(str.charAt(j)) + 1))
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
	var str = []
	while (!i.isZero()) {
		str.push(ALPHABET.charAt(i.mod(ALPHABET.length)))
		i = i.divide(ALPHABET.length)
	}
	str = str.reverse().join('')
	return ALPHABET.charAt(0).repeat(length - str.length) + str
}

function getEnv(variable, env) {
	while (!(variable in env)) {
		if (!(PARENT_ENV_KEY in env)) {
			return null
		}
		env = env[PARENT_ENV_KEY]
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
		if (!(i in toRemove)) {
			tmpCode.push(code.charAt(i))
		}
	}
	code = tmpCode.join('')

	// Remove comments
	code = code.replace(new RegExp(COMPONENTS.COMMENT + '.*$', 'gm'), '')
	// Remove trailing whitespace and empty lines
	code = code.replace(/\s+$/gm,'').replace(/^\r?\n/, '')

	// Check for invalid characters
	for(var i = 0; i < code.length; i++) {
		if (CODE_ALPHABET.indexOf(code.charAt(i)) === -1)
			throw err('Code contains forbidden character "' + code.charAt(i) + '".')
	}
	return code
}

// Parses sanitized Shtriped code into executable bytecode
function parse(code) {
	if (typeof code === 'string') {
		if (code) {
			code = code.split(/\r?\n/)
		} else {
			code = []
		}
	}
	var bytecode = [], i = 0
	while (i < code.length) {
		var stmt = code[i++].split(COMPONENTS.SEPARATOR)
		if (!stmt.every(function(s) { return s }))
			throw err('Invalid arrangement of separators on the line "' + code[i - 1] + '".')

		if (i < code.length && code[i].charAt(0) === COMPONENTS.SEPARATOR) { // Function definition
			for (var j = 1; j < stmt.length; j++) {
				for (var k = 1; k < j; k++) {
					if (stmt[j] === stmt[k])
						throw err('The definition for function "' + stmt[0] + '" cannot have multiple arguments with the name "' + stmt[j] + '".')
				}
			}

			var body = []
			while (i < code.length && code[i].charAt(0) === COMPONENTS.SEPARATOR) {
				body.push(code[i++].substring(1))
			}
			bytecode.push({ name: stmt[0], args: stmt.slice(1), body: parse(body) })
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

// Executes one of the 8 built-in Shtriped commands
function callBuiltIn(stmt, env) {
	if (stmt.args.length !== 1)
		throw err('Built-in function "' + stmt.name + '" expects one argument but got ' + stmt.args.length + '.', stmt)

	var arg = stmt.args[0]
	if (stmt.name === COMMANDS.DECLARE) {
		if (arg in env)
			throw err('Variable "' + arg + '" has already been declared in this scope.', stmt)
		env[arg] = bigInt.zero
		return env[arg]
	}
	if (stmt.name === COMMANDS.TRASH) {
		if (!(arg in env))
			throw err('Variable "' + arg + '" has not been declared in this scope and thus cannot be trashed.', stmt)
		var val = env[arg]
		delete env[arg]
		return val
	}

	var argEnv = getEnv(arg, env)
	if (!argEnv)
		throw err('Variable "' + arg + '" not found while trying to call built-in function "' + stmt.name + '".', stmt)

	var val = argEnv[arg]
	if (isFunc(val))
		throw err('Built-in function "' + stmt.name + '" cannot be called on the function "' + arg + '".', stmt)

	switch(stmt.name) {
		case COMMANDS.INCREMENT:
			argEnv[arg] = val.add(bigInt.one)
			return argEnv[arg]

		case COMMANDS.DECREMENT:
			if (val.isZero()) {
				return null
			}
			argEnv[arg] = val.subtract(bigInt.one)
			return argEnv[arg]

		case COMMANDS.PRINT_INT:
			process.stdout.write(val.toString())
			return val

		case COMMANDS.TAKE_INT:
			var input = readlineSync.question()
			if (!INT_PATTERN.test(input))
				throw err('Cannot parse "' + input + '" as a positive decimal integer.', stmt)
			argEnv[arg] = bigInt(input)
			return argEnv[arg]

		case COMMANDS.PRINT_STR:
			process.stdout.write(intToStr(val))
			return val

		case COMMANDS.TAKE_STR:
			var input = readlineSync.question()
			for(var i = 0; i < input.length; i++) {
				if (ALPHABET.indexOf(input.charAt(i)) === -1)
					throw err('Input string contains forbidden character "' + input.charAt(i) + '".', stmt)
			}
			argEnv[arg] = strToInt(input)
			return argEnv[arg]
	}
	// Impossible to get here
}

// Executes parsed Shtriped code given as a function with a body, in a given environment
function execute(func, env) {
	var retVal = bigInt.zero
	for (var i = 0; i < func.body.length; i++) {
		var stmt = func.body[i]
		if (stmt.body) { // Function definition
			if (stmt.name in env)
				throw err('Variable "' + stmt.name + '" has already been declared in this scope and must be trashed to be (re)defined as a function.', stmt)

			retVal = env[stmt.name] = { args: stmt.args, body: stmt.body, env: env }
		} else { // Function call
			var callEnv = getEnv(stmt.name, env)
			if (callEnv) { // User defined function
				var userFunc = callEnv[stmt.name]

				if (!isFunc(userFunc))
					throw err('Cannot call the integer "' + stmt.name + '" as a function.', stmt)

				if (stmt.args.length !== userFunc.args.length && stmt.args.length !== userFunc.args.length + 1)
					throw err('Function "' + stmt.name + '" expects ' + userFunc.args.length + ' or ' + (userFunc.args.length + 1) + ' arguments but got ' + stmt.args.length + '.', stmt)
				
				var newEnv = {}
				newEnv[PARENT_ENV_KEY] = userFunc.env
				for (var j = 0; j < userFunc.args.length; j++) {
					var argEnv = getEnv(stmt.args[j], env)
					if (!argEnv)
						throw err('Variable "' + stmt.args[j] + '" not found while trying to call function "' + stmt.name + '".', stmt)
					newEnv[userFunc.args[j]] = passAlong(argEnv[stmt.args[j]])
				}

				if (i === func.body.length - 1 && userFunc === func && stmt.args.length === userFunc.args.length) { // Recursive tail call
					retVal = bigInt.zero
					env = newEnv
					i = -1
				} else { // Normal call
					retVal = execute(userFunc, newEnv)
					if (stmt.args.length > userFunc.args.length) {
						var retVar = stmt.args[stmt.args.length - 1], retEnv = getEnv(retVar, env)
						if (!retEnv)
							throw err('Variable "' + retVar + '" not found while returning from function "' + stmt.name + '".', stmt)
						retEnv[retVar] = retVal
					}
				}
			} else { // Built-in function
				var funcNotFound = true
				for(var cmd in COMMANDS) {
					if (COMMANDS[cmd] === stmt.name) {
						funcNotFound = false
						break
					}
				}
				if (funcNotFound)
					throw err('Function "' + stmt.name + '" not found.', stmt)

				var returned = callBuiltIn(stmt, env)
				if (returned === null) {
					break
				}
				retVal = returned
			}
		}
	}
	return passAlong(retVal)
}

// Runs list of Shtriped code files in order as if all the code was in one file (block comments do not carry between files)
function run(files) {
	if (files.length < 1)
		throw err('At least one code file is required.')

	function readFile(i, childBytecode) {
		fs.readFile(files[i], 'utf8', function(error, code) {
			if (error)
				throw err('Issue loading code file "' + files[i] + '". ' + error.message)

			var bytecode = parse(sanitize(code))
			if (i < files.length - 1) {
				bytecode.push({ name: MAIN_FUNC, args: [], body: childBytecode})
				bytecode.push({ name: MAIN_FUNC, args: [], body: null })
			}

			if (i > 0) {
				readFile(i - 1, bytecode)
			} else {
				execute({ body: bytecode }, {})
			}
		})
	}
	readFile(files.length - 1)
}

run(process.argv.slice(2))
