# Shtriped

---

## The Basics

Shtriped (pronounced how Sean Connery would say "striped") is a minimalistic, whitespace-sensitive, procedural programming language, largely inspired by [Prindeal](https://codegolf.stackexchange.com/q/54530/26997).

It has only eight built-in commands or functions, whose names spell out the word "shtriped":

| Function | Action                     |
|:--------:|----------------------------|
|    `s`   | print as **S**tring        |
|    `h`   | tras**H** variable         |
|    `t`   | **T**ake input as integer  |
|    `r`   | take input as st**R**ing   |
|    `i`   | **I**ncrement              |
|    `p`   | **P**rint as integer       |
|    `e`   | d**E**clare variable       |
|    `d`   | **D**ecrement              |

A backslash `\` starts an inline comment and matching square brackets `[` `]` are nestable block comments. Besides these commands and comments, the only characters that have inherent meaning in Shtriped are newlines and spaces.

The only data types in Shtriped are first-class functions and non-negative arbitrary-precision integers, and the only way to change the value of an integer is to increment it or decrement it by one.

With all these limitations, even very basic functionalities like addition of integers and conditional statements have to be built from scratch in a Shtriped program. Yet building these functionalities (as is done in the [shtriped.st](https://github.com/HelkaHomba/shtriped/blob/master/shtriped.st) library) is what makes Shtriped fun!

## Running Shtriped

To run Shtriped you will need to at least download [shtriped.js](https://github.com/HelkaHomba/shtriped/blob/master/shtriped.js) from this repository and have [Node.js](https://nodejs.org) with the [big-integer](https://www.npmjs.com/package/big-integer) and [readline-sync](https://www.npmjs.com/package/readline-sync) packages installed. If you already have Node you can download then navigate to this repository, and run `npm install` to automatically install those two packages.

Then you can call Shtriped from the command line with:

```
node shtriped.js myShtripedFile
```

This will execute the Shtriped code in `myShtripedFile` and display any resulting output.

If multiple files are given, e.g.

```
node shtriped.js fileA fileB fileC
```

they are essentially run as if they were all concatenated together into a single Shtriped file.

There are no command line options and there is no Shtriped [REPL](https://wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) interpreter.

The suggested file extension for Shtriped programs is `.st`.

## Programming in Shtriped

### Sanitization

Before a Shtriped program is executed, it is first sanitized from non-code by removing these things in order:

1. Block comments - anything between matching pairs of square brackets `[` `]`.  
  (Blocks that encounter the start or end of the file don't require a matching bracket.)
2. Inline comments - anything after a backslash `\` to the end of the line it's on.
3. Trailing whitespace on all lines.
4. Empty lines.

The only characters allowed in sanitized Shtriped code are newlines and [printable ASCII](https://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters):

```
 !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
```

(The comment characters `[`, `]`, and `\` will always be sanitized out but are not technically forbidden.)

### Line Structure

Like most other programming languages, Shtriped programs are executed from top to bottom, line by line.

Every line in a sanitized Shtriped program has the following form, potentially indented by a number of spaces:

```
{function name} {argument 1} {argument 2} {argument 3} ...
```

(The only exception is the empty program, which is a valid program that does nothing.)

Each of the curly-braced terms is a variable identifier. **Any nonempty string of [printable ASCII characters](https://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters) excluding space is a valid variable identifier in Shtriped.** (So there are no integer literals or anything like that.) The only two data types that an identifier can hold are non-negative, arbitrary-precision integers (0, 1, 2, 3, ...), and first-class user defined functions.

**All lines are either *function definitions* or *function calls*.**

If a line L has one or more lines below it *that are further indented than L*, then **L is a function definiton**.
The indented lines form the function body, very similar to how [Python syntax](https://en.wikipedia.org/wiki/Python_syntax_and_semantics#Indentation) works, except indentation levels in Shtriped always increase by exactly one space.

In a function definition, `{function name}` becomes the identifier that refers to the function object and the `{arguments}` become the identifiers of the arguments passed into the function when it is called. A function may take in an arbitrary number of arguments as long as they all have distinct identifiers.

If L does *not have any further indented lines below it*, then **L is a function call**. In this case, `{function name}` is the identifier of the function to call and the `{arguments}` are the identifiers of the variables to pass into the function.

User defined functions must always be called with the same number of arguments they are defined with, *or the number of arguments plus one*. In the latter case, the extra argument, which is always the last argument given, is not actually passed into the function. Rather, when the function ends, the extra argument is set to the function's return value.

Integers are passed by value in and out of functions and functions are passed by reference.

**Every line has an associated value.** A function definition's value is the function it defines. A function call's value is the return value of the function called. **The only exception is when the `d` (decrement) built-in is called on zero.** This is known as a *failed* line, since decrementing zero doesn't make sense when there are no negative numbers. All other lines are *successful*. (This is distinct from erroring. Failed and successful lines alike can have errors that immediately bring execution to a halt.)

**User defined Shtriped functions return the value associated with the last successful line executed in their body** (ending their execution in the process). **If there are no successful lines, the return value is zero.** Basically, this means that a function either returns on its body's last line, or on the line just above the first line where zero was decremented (if that line exists).


### Built-In Functions

The eight built-in functions, `s`, `h`, `t`, `r`, `i`, `p`, `e`, and `d`, are similar to user defined functions, **except they always take exactly one argument**, with no optional extra argument for the return value. Also, they aren't first-class functions, meaning they can't be passed around the same way as user defined functions. Just like other lines though, calls to built-ins have an associated value that is returned if they are on the last successful line in a function.

Since built-ins always take one argument, a line calling a built-in always has this (potentially indented) form:

```
{built-in name} {arg}
```
Here are the behaviors of each built-in:


#### `e` - dEclare variable

Initializes the identifier `{arg}` as a new variable in the local scope and sets it to zero. `{arg}` must not already exists in the local scope, either as an integer or function. Note that `{arg}` always starts as an integer, but it can be reassigned as a function via return values. The associated value is zero, i.e. `{arg}`'s newly set value.

#### `h` - trasH variable

Removes the identifier `{arg}` from the local scope as if it had never been declared. `{arg}` must already exists in the **local** scope, either as an integer or function. The associated value is the value `{arg}` held before it was trashed.

#### `i` - Increment

Adds one to `{arg}`. The associated value is the value of `{arg}` after incrementng. `{arg}` must be an integer.

#### `d` - Decrement

Subtracts one from `{arg}` if it is positive. The associated value is the value of `{arg}` after decrementing. If `{arg}` is zero the enclosing function returns the value from the previous successful line (and `{arg}` is not modified). In this case there is no associated value. `{arg}` must be an integer.

#### `p` - Print as integer

Prints `{arg}` to stdout as a plain decimal integer with no plus sign, no leading zeros (except `0` for zero itself), and no trailing newline. The associated value is `{arg}`'s value, unchanged. `{arg}` must be an integer.

#### `t` - Take input as integer

Reads a line from stdin as a non-negative decimal integer and stores the value in `{arg}`. A plus sign and leading zeroes are allowed in the input. The associated value is the input integer, i.e. `{arg}`'s newly set value. `{arg}` must be a declared variable that's an integer.

#### `s` - print as String

Prints the value of `{arg}` to stdout, encoding it as a string that can contain any of these 100 characters:

```
\t\n\v\f\r !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
```
That's tab `\t`, line feed `\n`, vertical tab `\v`, form feed `\f`, and carriage return `\r`, plus the 95 [printable ASCII](https://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters) characters.

- `0` is encoded as the empty string.
- `1` through `100` are encoded as all single character strings in lexicographic order, from `\t` to `~`.
- `101` through `10100` are encoded as all two character strings in lexicographic order, from `\t\t` to `~~`.
- `10101` through `1010100` are encoded as all three character strings in lexicographic order, from `\t\t\t` to `~~~`.
- And so on. Shtriped integers have arbitrary precision, so in theory all strings can be represented.



A trailing newline is not added to the string. `{arg}` must be an integer.

#### `r` - take input as stRing

Reads a line from stdin as a string and encodes it as a non-negative integer by applying the inverse operation done by the `s` built-in. Only the same 100 characters are allowed in the input string. `{arg}` must be a declared variable that's an integer.


### Additional Notes

- Shtriped is lexically scoped.
- An identifier may have the same name as a built-in, but then the built-in will be overshadowed.
- Decrementing a zero from the main program will terminate the program.
- When multiple files are run at once the latter files are actually run in their own child scope, so, for example, you can define the same identifier in two files being run and there won't be conflicts.

### Examples

- [Hello, World!](http://codegolf.stackexchange.com/a/73559/26997)

- [Cat program](http://codegolf.stackexchange.com/a/73562/26997)

- [Truth Machine](http://codegolf.stackexchange.com/a/73568/26997)

- [Print N Squared](http://codegolf.stackexchange.com/a/73643/26997)


# $htriped

---

$htriped is a slightly expanded version of Shtriped, but considered its own separate programming language.

To run $htriped, merely add the library [shtriped.st](https://github.com/HelkaHomba/shtriped/blob/master/shtriped.st) before any other file(s) when running Shtriped:

```
node shtriped.js shtriped.st myShtripedFile
```

The library contains a number of useful constants and functions that are cumbersome to build up every time in a normal Shtriped program.