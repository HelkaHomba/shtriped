[[ Shtriped Core Library ]]

[ Built-in Aliases ]

\ User function versions of s, t, r, i, p, and d (functions for h and e serve no purpose)
_s x
 s x
_t x
 t x
_r x
 r x
_i x
 i x
_p x
 p x
_d x
 d x

[ Preset Integers ]

\ Constants for 0 through 100, listed with string counterparts
e 0  \ empty string
e 1  \\t [tab]
e 2  \\n [line feed]
e 3  \\v [vertical tab]
e 4  \\f [form feed]
e 5  \\r [carriage return]
e 6  \   [space]
e 7  \ !
e 8  \ "
e 9  \ #
e 10 \ $
e 11 \ %
e 12 \ &
e 13 \ '
e 14 \ (
e 15 \ )
e 16 \ *
e 17 \ +
e 18 \ ,
e 19 \ -
e 20 \ .
e 21 \ /
e 22 \ 0
e 23 \ 1
e 24 \ 2
e 25 \ 3
e 26 \ 4
e 27 \ 5
e 28 \ 6
e 29 \ 7
e 30 \ 8
e 31 \ 9
e 32 \ :
e 33 \ ;
e 34 \ <
e 35 \ =
e 36 \ >
e 37 \ ?
e 38 \ @
e 39 \ A
e 40 \ B
e 41 \ C
e 42 \ D
e 43 \ E
e 44 \ F
e 45 \ G
e 46 \ H
e 47 \ I
e 48 \ J
e 49 \ K
e 50 \ L
e 51 \ M
e 52 \ N
e 53 \ O
e 54 \ P
e 55 \ Q
e 56 \ R
e 57 \ S
e 58 \ T
e 59 \ U
e 60 \ V
e 61 \ W
e 62 \ X
e 63 \ Y
e 64 \ Z
e 65 \ left square bracket
e 66 \ \
e 67 \ right square bracket
e 68 \ ^
e 69 \ _
e 70 \ `
e 71 \ a
e 72 \ b
e 73 \ c
e 74 \ d
e 75 \ e
e 76 \ f
e 77 \ g
e 78 \ h
e 79 \ i
e 80 \ j
e 81 \ k
e 82 \ l
e 83 \ m
e 84 \ n
e 85 \ o
e 86 \ p
e 87 \ q
e 88 \ r
e 89 \ s
e 90 \ t
e 91 \ u
e 92 \ v
e 93 \ w
e 94 \ x
e 95 \ y
e 96 \ z
e 97 \ {
e 98 \ |
e 99 \ }
e 00 \ ~
i 1
_i 1 2
_i 2 3
_i 3 4
_i 4 5
_i 5 6
_i 6 7
_i 7 8
_i 8 9
_i 9 10
_i 10 11
_i 11 12
_i 12 13
_i 13 14
_i 14 15
_i 15 16
_i 16 17
_i 17 18
_i 18 19
_i 19 20
_i 20 21
_i 21 22
_i 22 23
_i 23 24
_i 24 25
_i 25 26
_i 26 27
_i 27 28
_i 28 29
_i 29 30
_i 30 31
_i 31 32
_i 32 33
_i 33 34
_i 34 35
_i 35 36
_i 36 37
_i 37 38
_i 38 39
_i 39 40
_i 40 41
_i 41 42
_i 42 43
_i 43 44
_i 44 45
_i 45 46
_i 46 47
_i 47 48
_i 48 49
_i 49 50
_i 50 51
_i 51 52
_i 52 53
_i 53 54
_i 54 55
_i 55 56
_i 56 57
_i 57 58
_i 58 59
_i 59 60
_i 60 61
_i 61 62
_i 62 63
_i 63 64
_i 64 65
_i 65 66
_i 66 67
_i 67 68
_i 68 69
_i 69 70
_i 70 71
_i 71 72
_i 72 73
_i 73 74
_i 74 75
_i 75 76
_i 76 77
_i 77 78
_i 78 79
_i 79 80
_i 80 81
_i 81 82
_i 82 83
_i 83 84
_i 84 85
_i 85 86
_i 86 87
_i 87 88
_i 88 89
_i 89 90
_i 90 91
_i 91 92
_i 92 93
_i 93 94
_i 94 95
_i 95 96
_i 96 97
_i 97 98
_i 98 99
_i 99 00

\ Pre-initialize some common single letter variables for easy use
e a
e b
e c
e j
e k
e n
e u
e v
e w
e x
e y
e z

[ Output Functions ]

\ Print Integer
. x \ prints x as an integer followed by a newline, returns x
 p x
 s 2
 h x

\ Print String
, x \ prints x as a string followed by a newline, returns x
 s x
 s 2
 h x

\ Print Space
_ \ prints a single space character, returns 0
 s 6
 = 0

\ Print Newline
; \ prints a single line feed character, returns 0
 s 2
 = 0

[ General Purpose Functions ]

\ No-Op
` \ does nothing, returns 0
 e x
 h x

\ Evaluate
= x \ returns value of x, whether x is an integer or function
 h x

\ Conditional
? x y z \ returns y if x is positive, else returns z
 h z
 d x
 h y

\ Loop
' f x \ calls f() x times, returns 0
 d x
 f
 ' f x

\ Indexed Loop
" f x \ calls f(n) x times, n = 0 to x - 1, returns x
 e n
 g
  f n
  i n
 ' g x
 h x

\ While Loop
@ f g \ repeatedly calls g() as long as f() is positive, returns 0
 e x
 f x
 d x
 g
 @ f g

[ Logic Functions ]

\ Bool
: x \ returns 1 if x is positive, else returns 0
 ? x 1 0

\ Logical Not
! x \ returns 1 if x is zero, else returns 0
 ? x 0 1

\ Logical And
& x y \ returns y if both x and y are positive, else returns 0
 ? x y 0
 
\ Logical Or
| x y \ returns x if x is positive, else returns y if y is positive, else returns 0
 ? x x y

[ Comparison Functions ]

\ Equals
~ x y \ returns 1 if x == y, else returns 0
 e z
 # x y z
 ! z

\ Not Equals
# x y \ returns 1 if x != y, else returns 0
 e z
 | x y z
 d z
 = 1
 d x
 = 1
 d y
 # x y

\ Less Than
< x y \ returns 1 if x < y, else returns 0
 d y
 = 1
 d x
 < x y

\ Greater Than
> x y \ returns 1 if x > y, else returns 0
 < y x

\ Less Than or Equal To
{ x y \ returns 1 if x <= y, else returns 0
 = 1
 d x
 = 0
 d y
 { x y

\ Greater Than or Equal To
} x y \ returns 1 if x >= y, else return 0
 { y x

[ Math Functions ]

\ Minimum
( x y \ returns the minimum of x and y
 e z
 < x y z
 ? z x y

\ Maximum
) x y \ returns the maximum of x and y
 e z
 < x y z
 ? z y x

\ Addition
+ x y \ returns x + y
 +
  i x
 ' + y
 h x

\ Subtraction
- x y \ returns abs(x - y)
 e z
 f
  = x z
  = y x
  = z y
 < x y z
 ? z f ` z
 z
 -
  d x
 ' - y
 h x

\ Multiplication
* x y \ returns x * y
 e z
 *
  + x z z
 ' * y
 h z

\ Integer Division
/ x y \ returns floor(x / y), returns 0 if y is 0
 d y
 i y
 e z 
 f
  } x y
 /
  i z
  - x y x
 @ f /
 h z

\ Modulo
% x y \ returns x modulo y, returns 0 if y is 0
 d y
 i y
 f
  } x y
 /
  - x y x
 @ f /
 h x

\ Exponentiation
^ x y \ returns x^y, returns 1 if x and y are both 0
 e z
 i z
 ^
  * x z z
 ' ^ y
 h z

\ Length in Base
$ x y \ returns the digital length of x when expressed in base y, returns 0 if y is 0
 d y
 = x
 d y
 i y
 i y
 e z
 i z
 e b
 = y b
 f
  } x y
 $
  i z
  * b y y
 @ f $
 h z

[ Testing Aides ]

\ Print Arrow
-> \ prints " -> ", returns 0
 _
 s 19
 s 36
 _
 = 0

\ One Argument
T1 f x \ prints "u -> f(u)" for u = 0 to x, returns x
 i x
 U u
  p u
  ->
  f u u
  . u
 i x
 " U x
 d x

\ Two Argument
T2 f x \ prints "u v -> f(u, v)" for u,v = 0 to x, returns x
 i x
 U u
  V v
   p u
   _
   p v
   ->
   e x
   f u v x
   . x
  " V x
  ;
 " U x
 d x

\ Three Argument
T3 f x \ prints "u v w -> f(u, v, w)" for u,v,w = 0 to x, returns x
 i x
 U u
  V v
   W w
    p u
    _
    p v
    _
    p w
    ->
    e x
    f u v w x
    . x
   " W x
   ;
  " V x
  ;
 " U x
 d x