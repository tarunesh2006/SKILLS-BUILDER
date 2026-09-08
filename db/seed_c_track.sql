-- ============================================================================
--  C Programming track - full content + assessments
--  Source: "C Programming Technical Training Syllabus (40 Hours)", 2026-2027
--          (Final year CSE / AI&DS - beginner to placement-oriented)
--
--  Loads 10 modules, ~39 text lessons (3-4 per module), and 6 auto-graded
--  coding assessments (the separate Test module). Each assessment problem is a
--  stdin -> stdout task graded by the Piston judge.
--
--  RE-RUNNABLE: it first deletes existing modules and tests for the C track,
--  which cascade-deletes C-track module quizzes, progress and submissions.
--  Safe for a dev/staging database; do not run against production with live
--  attempts. After running this, RE-RUN db/seed_c_module_quizzes.sql too.
--
--  Usage:
--    docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 \
--      learning_platform < db/seed_c_track.sql
-- ============================================================================

SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES,STRICT_TRANS_TABLES';
USE learning_platform;

SET @c     := (SELECT id FROM tracks WHERE slug = 'c');
SET @admin := (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1);

-- --- reset C-track content ---------------------------------------------------
DELETE FROM tests   WHERE track_id = @c;
DELETE FROM modules WHERE track_id = @c;

-- ============================================================================
--  MODULES
-- ============================================================================
INSERT INTO modules (track_id, title, summary, sort_order) VALUES
(@c, 'Module 1: Introduction to C Programming',
     'Compilation model, program structure, variables, data types and console I/O. (3 hrs)', 1),
(@c, 'Module 2: Operators and Expressions',
     'Arithmetic, relational, logical, assignment, unary and bitwise operators; precedence and evaluation. (3 hrs)', 2),
(@c, 'Module 3: Decision Making Statements',
     'if, if-else, nested-if, else-if ladder, switch-case and menu-driven programs. (4 hrs)', 3),
(@c, 'Module 4: Looping Statements and Patterns',
     'for, while, do-while, nested loops, break/continue, number logic and pattern printing. (5 hrs)', 4),
(@c, 'Module 5: Functions and Recursion',
     'User-defined functions, parameters, return values, scope and recursion. (4 hrs)', 5),
(@c, 'Module 6: Arrays and Searching Basics',
     '1D and 2D arrays, traversal, aggregate operations, frequency and linear search. (5 hrs)', 6),
(@c, 'Module 7: String Handling',
     'C strings, <string.h> functions, character traversal, palindrome, word and frequency logic. (4 hrs)', 7),
(@c, 'Module 8: Pointers and Dynamic Memory Allocation',
     'Pointers, pointer arithmetic, malloc/calloc/realloc/free and applications. (6 hrs)', 8),
(@c, 'Module 9: Structures, Unions and File Handling',
     'struct and union, arrays of structures, and file read/write with simple CSV handling. (4 hrs)', 9),
(@c, 'Module 10: Integrated Practice and Evaluation',
     'Debugging, best practices, basic complexity awareness and interview-style problem solving. (2 hrs)', 10);

-- ============================================================================
--  LESSONS  (expanded - each module is a clean, self-contained unit)
-- ============================================================================

-- ---- Module 1: Introduction to C Programming -----------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'What C Is and How It Runs',
'C is a small, fast, *compiled* language. You write source code in a `.c`
file; a **compiler** turns it into machine code your CPU runs directly.
There is no interpreter or virtual machine in between, which is why C is
used for operating systems, databases, and embedded devices.

The build has four stages:

| Stage | Does |
|-------|------|
| Preprocessor | expands `#include` and `#define` |
| Compiler | turns C into assembly for your CPU |
| Assembler | turns assembly into an object file (`.o`) |
| Linker | joins your object files + libraries into one executable |

```
gcc hello.c -o hello     # compile + link in one command
./hello                  # run it
```

If the compiler prints errors, no executable is produced -- fix the first
error first, because later ones are often caused by it.', 1
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Your First Program',
'Every C program is made of functions, and execution begins in `main`.

```c
#include <stdio.h>          /* brings in printf, scanf, ... */

int main(void) {
    printf("Hello, World\n");
    return 0;               /* 0 = success */
}
```

Line by line:

- `#include <stdio.h>` -- a preprocessor directive; no semicolon.
- `int main(void)` -- the entry point. `int` is the value it returns to the
  operating system; `void` means it takes no arguments.
- `printf("...\n")` -- prints text. `\n` is a newline.
- Statements end with `;`. A block of statements is wrapped in `{ }`.
- `return 0;` -- hands `0` back to the OS to say "everything went fine".

**Common mistakes:** forgetting `;`, forgetting `\n` (output runs together),
or forgetting `#include <stdio.h>` (compiler warns that `printf` is unknown).', 2
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Variables and Data Types',
'A variable is a named box in memory with a fixed type. You must declare the
type before you use it.

| Type | Holds | Typical size | Example literal |
|------|-------|--------------|-----------------|
| `int` | whole numbers | 4 bytes | `42`, `-7` |
| `float` | real numbers | 4 bytes | `3.14f` |
| `double` | real numbers (more precision) | 8 bytes | `3.14159` |
| `char` | one character | 1 byte | `''A''`, `''\n''` |

```c
int    age = 20;
double gpa = 8.7;
char   grade = ''A'';
int    a, b, c;            /* declare several at once */
const double PI = 3.14159; /* const = cannot be changed later */
```

An `int` has limited range (about +/- 2 billion). Use `long` or `long long`
for bigger values. Assigning a `double` to an `int` **drops the fraction**:
`int x = 3.9;` stores `3`.', 3
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Reading Input with scanf',
'`scanf` reads values typed on standard input into your variables. You must
pass the **address** of each variable with `&`.

```c
#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);          /* read two integers */
    printf("sum = %d\n", a + b);
    return 0;
}
```

Format specifiers must match the type:

| Type | `scanf` | `printf` |
|------|---------|----------|
| `int` | `%d` | `%d` |
| `double` | `%lf` | `%f` or `%.2f` |
| `char` | `%c` | `%c` |
| string | `%s` | `%s` |

**Integer division:** `7 / 2` is `3`, not `3.5`, because both operands are
`int`. To get `3.5`, make one a `double`: `7 / 2.0`, or cast: `(double)a / b`.

**Common mistake:** writing `scanf("%d", a)` without the `&`. The program
usually crashes.', 4
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

-- ---- Module 2: Operators and Expressions --------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Arithmetic and Assignment Operators',
'The arithmetic operators are `+  -  *  /  %`.

```c
int a = 17, b = 5;
a + b   /* 22 */
a - b   /* 12 */
a * b   /* 85 */
a / b   /* 3   -- integer division, remainder dropped */
a % b   /* 2   -- the remainder ("modulo") */
```

`%` only works on integers. It is how you test divisibility and pull digits
apart:

```c
if (n % 2 == 0)  printf("even\n");
int lastDigit = n % 10;
n = n / 10;                 /* drop the last digit */
```

**Compound assignment** is shorthand:

```c
x += 3;    /* x = x + 3  */
x -= 1;    /* x = x - 1  */
x *= 2;    /* x = x * 2  */
count++;   /* count = count + 1 */
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Relational and Logical Operators',
'**Relational operators** compare two values and produce `1` (true) or `0`
(false):

```c
a == b   /* equal            */
a != b   /* not equal        */
a <  b   a <= b
a >  b   a >= b
```

**Logical operators** combine conditions:

- `&&` -- **AND**, true only when both sides are true
- `||` -- **OR**, true when at least one side is true
- `!` -- **NOT**, flips true and false

```c
if (age >= 13 && age <= 19)  printf("teenager\n");
if (day == 0 || day == 6)    printf("weekend\n");
if (!found)                  printf("not found\n");
```

`&&` and `||` **short-circuit**: `a != 0 && b / a > 2` never divides by zero,
because if `a == 0` the right side is skipped.

**Classic bug:** `if (x = 5)` assigns 5 (always true). You meant `if (x == 5)`.', 2
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Increment, Decrement and Bitwise Operators',
'`++` and `--` add or subtract 1. Position matters:

```c
int x = 5;
int a = x++;   /* post: a = 5, then x becomes 6 */
int b = ++x;   /* pre:  x becomes 7, then b = 7 */
```

**Bitwise operators** work on the individual bits of an integer:

- `&` -- AND: `6 & 3` is `2`  (`110 & 011 = 010`)
- `|` -- OR: `6 | 3` is `7`  (`110 | 011 = 111`)
- `^` -- XOR: `6 ^ 3` is `5`  (set where the bits differ)
- `~` -- NOT: flips every bit, so `~6` is `-7`
- `<<` -- shift left: `6 << 1` is `12`  (multiply by 2)
- `>>` -- shift right: `6 >> 1` is `3`  (divide by 2)

Handy idioms:

```c
if ((n & 1) == 0)   /* n is even */
n <<= 1;            /* n *= 2    */
```', 3
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Precedence and Expression Evaluation',
'When an expression mixes operators, C applies them in a fixed order of
**precedence** (like BODMAS in maths).

High to low (abridged):

```
!  ~  unary -            (highest)
*  /  %
+  -
<  <=  >  >=
==  !=
&&
||
=  +=  -=  ...           (lowest)
```

So `a + b * c` is `a + (b * c)`, and `x > 0 && y > 0` is
`(x > 0) && (y > 0)`.

Operators of equal precedence are usually evaluated **left to right**:
`10 - 3 - 2` is `(10 - 3) - 2 = 5`.

When the order is not obvious to a reader, **add parentheses** -- they cost
nothing and prevent bugs:

```c
int mid = (low + high) / 2;
int ok  = (score >= 40) && (attendance >= 75);
```', 4
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

-- ---- Module 3: Decision Making Statements -------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'if and if-else',
'`if` runs a block only when a condition is true.

```c
if (marks >= 40) {
    printf("Pass\n");
}
```

`if-else` chooses between two paths:

```c
if (n % 2 == 0)
    printf("even\n");
else
    printf("odd\n");
```

The braces `{ }` are optional for a single statement, but **use them
anyway** -- adding a second line later without braces is a common bug:

```c
if (x > 0)
    printf("positive\n");
    total += x;             /* BUG: this always runs */
```

A condition is just a number: `0` is false, anything else is true. So
`if (count)` means "if count is not zero".', 1
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Nested if and the else-if Ladder',
'You can put an `if` inside another `if` to check a second condition only
when the first holds:

```c
if (logged_in) {
    if (is_admin)  printf("admin panel\n");
    else           printf("user panel\n");
}
```

For a series of mutually exclusive ranges, use an **else-if ladder**. It
stops at the first true condition:

```c
if      (marks >= 90) grade = ''A'';
else if (marks >= 75) grade = ''B'';
else if (marks >= 60) grade = ''C'';
else if (marks >= 40) grade = ''D'';
else                  grade = ''F'';
```

Order matters -- check the tightest bound first. If you wrote `>= 40` at the
top, everyone above 40 would get a D.

Largest of three numbers:

```c
int max = a;
if (b > max) max = b;
if (c > max) max = c;
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'switch-case and Menu Programs',
'`switch` compares one integer or character against a list of constant
`case` labels. It is cleaner than a long else-if ladder when you are just
matching exact values.

```c
int choice;
scanf("%d", &choice);

switch (choice) {
    case 1:
        printf("Add\n");
        break;
    case 2:
        printf("Subtract\n");
        break;
    default:
        printf("Invalid option\n");
}
```

**`break` is essential.** Without it, execution "falls through" into the
next case. Sometimes that is useful:

```c
switch (ch) {
    case ''a'': case ''e'': case ''i'': case ''o'': case ''u'':
        printf("vowel\n");
        break;
    default:
        printf("consonant\n");
}
```

`switch` cannot test ranges or `double` values -- use an if-else ladder for
those.', 3
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The Ternary Operator and Condition Bugs',
'The **ternary operator** `?:` is a compact if-else that produces a value:

```c
int max = (a > b) ? a : b;
printf("%s\n", (n % 2 == 0) ? "even" : "odd");
```

Read it as: *condition* `?` *value if true* `:` *value if false*.

Use it for short choices; for anything with side effects or more than one
statement, use a real `if`.

**Common condition bugs:**

| Bug | What happens | Fix |
|-----|--------------|-----|
| `if (x = 0)` | assigns 0, condition always false | `if (x == 0)` |
| `if (a < b < c)` | evaluates `(a < b)` = 0/1, then compares to `c` | `if (a < b && b < c)` |
| `if (score = 100)` | assigns 100, always true | `if (score == 100)` |

Some programmers write `if (0 == x)` so a typo `if (0 = x)` fails to
compile.', 4
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

-- ---- Module 4: Looping Statements and Patterns -------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'while and do-while',
'A `while` loop repeats a block **as long as** its condition is true. It
checks the condition *first*, so the body may run zero times.

```c
int i = 1;
while (i <= 5) {
    printf("%d ", i);
    i++;                   /* without this, the loop never ends */
}
```

A `do-while` loop checks the condition *after* the body, so it always runs
**at least once** -- perfect for input validation and menus:

```c
int n;
do {
    printf("Enter a positive number: ");
    scanf("%d", &n);
} while (n <= 0);
```

Every loop needs three things: a starting value, a condition, and something
in the body that moves toward making the condition false. Miss the third and
you get an infinite loop.', 1
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The for Loop',
'A `for` loop packs the three parts of a counting loop onto one line:

```c
for (int i = 0; i < n; i++) {
    printf("%d ", i);
}
/*    init     ; condition ; update */
```

It runs `init` once, then repeats: check `condition`, run body, run
`update`. The loop above runs `n` times, with `i` going `0 .. n-1`.

Common counting patterns:

```c
for (int i = 1; i <= n; i++)        /* 1, 2, ..., n        */
for (int i = n; i >= 1; i--)        /* n, n-1, ..., 1      */
for (int i = 0; i < n; i += 2)      /* 0, 2, 4, ...        */
```

Worked example -- factorial:

```c
long fact = 1;
for (int k = 2; k <= n; k++)
    fact *= k;
printf("%ld\n", fact);
```

Prefer `for` when you know the count; prefer `while` when you loop "until
something happens".', 2
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'break, continue and Number Logic',
'`break` exits the loop immediately. `continue` skips the rest of the current
iteration and goes to the next one.

```c
for (int i = 1; i <= 100; i++) {
    if (i % 7 == 0) continue;      /* skip multiples of 7 */
    if (i > 50)     break;         /* stop once past 50   */
    printf("%d ", i);
}
```

Prime check -- `break` as soon as a divisor is found:

```c
int isPrime = (n >= 2);
for (int d = 2; (long)d * d <= n; d++) {
    if (n % d == 0) { isPrime = 0; break; }
}
```

Reverse a number digit by digit:

```c
int rev = 0;
while (n > 0) {
    rev = rev * 10 + n % 10;
    n /= 10;
}
```

In nested loops, `break` only leaves the **innermost** loop.', 3
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Nested Loops and Pattern Printing',
'A loop inside a loop lets you work in two dimensions. For patterns, the
**outer loop is the row**, the **inner loop is the column**.

Right triangle of height `n`:

```c
for (int r = 1; r <= n; r++) {
    for (int c = 1; c <= r; c++)
        printf("*");
    printf("\n");           /* end the row */
}
```

Output for `n = 4`:

```
*
**
***
****
```

Number triangle -- just print `c` instead of `*`:

```c
for (int r = 1; r <= n; r++) {
    for (int c = 1; c <= r; c++)
        printf("%d", c);
    printf("\n");
}
```

Multiplication table:

```c
for (int m = 1; m <= 10; m++)
    printf("%d x %d = %d\n", n, m, n * m);
```

Trace a small case by hand until the row/column roles are obvious.', 4
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

-- ---- Module 5: Functions and Recursion --------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Defining and Calling Functions',
'A function is a named, reusable block of code. Define it once, call it many
times.

```c
#include <stdio.h>

int square(int x) {        /* return type, name, parameter */
    return x * x;
}

int main(void) {
    printf("%d\n", square(5));    /* 25 */
    printf("%d\n", square(9));    /* 81 */
    return 0;
}
```

If you define a function *after* `main`, add a **prototype** before `main`
so the compiler knows about it:

```c
int square(int x);         /* prototype -- note the semicolon */

int main(void) { ... }

int square(int x) { return x * x; }
```

A function that returns nothing uses `void`:

```c
void greet(void) { printf("Hi!\n"); }
```

Good functions do one job and have a clear name.', 1
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Parameters, Return Values and Scope',
'**Parameters** are inputs; the **return value** is the single output.

```c
int max2(int a, int b) {
    if (a > b) return a;
    return b;               /* reached only when a <= b */
}
```

`return` immediately ends the function and hands back a value.

**Scope** is where a name is visible. A variable declared inside a function
(or block) exists only there:

```c
void f(void) {
    int local = 10;        /* visible only inside f */
}
/* printf("%d", local);   -- ERROR: local is not visible here */
```

C passes arguments **by value** -- the function gets a *copy*:

```c
void tryToChange(int n) { n = 99; }

int x = 5;
tryToChange(x);
printf("%d\n", x);         /* still 5 -- the copy changed, not x */
```

To actually change the caller''s variable, you pass a pointer (next lesson).', 2
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Changing Variables with Pointers',
'Because C passes copies, a function normally cannot modify the caller''s
variables. Passing a **pointer** (an address) gets around this.

```c
void addTax(double *price) {     /* takes the address of a double */
    *price = *price * 1.18;      /* * = "the value at that address" */
}

int main(void) {
    double p = 100.0;
    addTax(&p);                  /* &p = "the address of p" */
    printf("%.2f\n", p);         /* 118.00 */
}
```

The classic example is `swap`:

```c
void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}
/* swap(&x, &y); */
```

This is also why `scanf("%d", &n)` needs the `&` -- `scanf` must write back
into your variable. Pointers get a full treatment in Module 8.', 3
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Recursion',
'A **recursive** function calls itself on a smaller version of the problem.
It needs two parts:

1. a **base case** that returns without recursing (stops the chain), and
2. a **recursive case** that moves toward the base case.

```c
long factorial(int n) {
    if (n <= 1) return 1;                 /* base case */
    return n * factorial(n - 1);          /* recursive case */
}
```

`factorial(4)` unfolds as `4 * 3 * 2 * factorial(1)` = `4 * 3 * 2 * 1` = 24.

Fibonacci (F0 = 0, F1 = 1):

```c
int fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
```

Greatest common divisor (Euclid):

```c
int gcd(int a, int b) {
    return (b == 0) ? a : gcd(b, a % b);
}
```

**Warning:** a missing or unreachable base case recurses forever and
crashes with a *stack overflow*.', 4
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

-- ---- Module 6: Arrays and Searching Basics ----------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Declaring and Initializing Arrays',
'An array is a fixed-size, numbered sequence of values of the same type.

```c
int   a[5];                       /* 5 ints, values undefined */
int   b[5] = {10, 20, 30, 40, 50};
int   c[]  = {1, 2, 3};           /* size 3, inferred */
int   d[100] = {0};               /* all 100 elements set to 0 */
```

Elements are numbered from **0**:

```c
a[0] = 7;          /* first element  */
a[4] = 9;          /* last element of a[5] */
```

For `int a[n]`, the valid indices are `0` to `n-1`. Reading or writing
`a[n]` (or `a[-1]`) is **out of bounds** -- C does not check, and the result
is undefined: it may print garbage, corrupt other data, or crash.

C has no built-in "length" for a plain array, so you carry the count in a
separate variable.', 1
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Traversing Arrays',
'You process an array with a `for` loop from `0` to `n-1`.

Read `n` values, then print them:

```c
int a[100], n;
scanf("%d", &n);
for (int i = 0; i < n; i++)
    scanf("%d", &a[i]);

for (int i = 0; i < n; i++)
    printf("%d ", a[i]);
```

Sum, average, minimum, maximum in one pass:

```c
long sum = 0;
int  mn = a[0], mx = a[0];
for (int i = 0; i < n; i++) {
    sum += a[i];
    if (a[i] < mn) mn = a[i];
    if (a[i] > mx) mx = a[i];
}
double avg = (double)sum / n;
```

Running (prefix) sum:

```c
int run = 0;
for (int i = 0; i < n; i++) {
    run += a[i];
    printf("%d ", run);
}
```

Start `mn`/`mx` from `a[0]`, not `0` -- otherwise an all-negative array
reports a wrong maximum.', 2
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Frequency Counting and Linear Search',
'**Linear search** walks the array and returns the first matching index, or
`-1` if the value is absent:

```c
int indexOf(int a[], int n, int key) {
    for (int i = 0; i < n; i++)
        if (a[i] == key) return i;
    return -1;
}
```

Worst case it checks all `n` elements -- that is **O(n)**.

**Counting** how many times a value appears:

```c
int count = 0;
for (int i = 0; i < n; i++)
    if (a[i] == target) count++;
```

When the values are small non-negative integers, a **frequency table** is
faster than searching repeatedly:

```c
int freq[100] = {0};
for (int i = 0; i < n; i++)
    freq[a[i]]++;            /* freq[v] = how many times v appeared */
```

This is the core trick behind "most frequent element", "first repeated
value", anagram checks, and counting-sort.', 3
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Two-Dimensional Arrays',
'A 2D array is a grid -- rows and columns. Think of it as an array of rows.

```c
int g[3][4];                    /* 3 rows, 4 columns, 12 ints */

for (int r = 0; r < 3; r++)
    for (int c = 0; c < 4; c++)
        scanf("%d", &g[r][c]);
```

Row sums (used in problems like "richest customer wealth"):

```c
int best = 0;
for (int r = 0; r < rows; r++) {
    int rowSum = 0;
    for (int c = 0; c < cols; c++)
        rowSum += g[r][c];
    if (rowSum > best) best = rowSum;
}
```

Initialising a grid to zero:

```c
int m[5][5] = {0};
```

When you pass a 2D array to a function, every dimension except the first
must be given: `void f(int g[][4], int rows)`.', 4
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

-- ---- Module 7: String Handling --------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'What a C String Is',
'C has no dedicated string type. A **string is a `char` array** whose last
character is the *null terminator* `''\0''` (a byte with value 0). That
byte marks where the text ends.

```c
char name[6] = {''H'', ''e'', ''l'', ''l'', ''o'', ''\0''};
char city[] = "Delhi";     /* compiler adds the ''\0'' -- size is 6 */
```

`"Delhi"` occupies 6 bytes: `D e l h i \0`.

Because the size is fixed, always leave room for the terminator:

```c
char buf[100];             /* holds up to 99 real characters */
```

You can loop over the characters until you hit `''\0''`:

```c
for (int i = 0; s[i] != ''\0''; i++)
    putchar(s[i]);
```

Forgetting the terminator (e.g. filling every slot of the array) leads to
functions reading past the end -- a very common source of bugs.', 1
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Reading and Printing Strings',
'`printf` prints a string with `%s`:

```c
char city[] = "Delhi";
printf("Hello, %s!\n", city);
```

`scanf("%s", s)` reads a **single word** -- it stops at the first space,
tab, or newline. Note: **no `&`** for a string, because an array name is
already an address.

```c
char first[50];
scanf("%s", first);        /* "Asha Rao" -> reads only "Asha" */
```

To read a whole line *including spaces*, use `fgets`:

```c
char line[200];
fgets(line, sizeof line, stdin);   /* reads up to 199 chars or a newline */
```

`fgets` keeps the trailing `''\n''`; strip it if you do not want it:

```c
line[strcspn(line, "\n")] = ''\0'';
```

`getchar()` reads one character at a time and returns `EOF` at end of
input.', 2
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The string.h Library',
'`#include <string.h>` gives you the standard string functions.

| Function | Does | Example |
|----------|------|---------|
| `strlen(s)` | length, not counting `''\0''` | `strlen("abc")` -> 3 |
| `strcpy(d, s)` | copy `s` into `d` | |
| `strncpy(d, s, n)` | copy at most `n` chars | safer |
| `strcat(d, s)` | append `s` to `d` | |
| `strcmp(a, b)` | `0` if equal, `<0` / `>0` otherwise | |

```c
char a[20] = "data";
char b[20];

strcpy(b, a);              /* b = "data" */
strcat(b, "base");         /* b = "database" */

if (strcmp(a, "data") == 0)
    printf("match\n");
```

The destination array must be **big enough** to hold the result plus the
terminator -- `strcpy` and `strcat` do not check.

`#include <ctype.h>` adds character helpers: `isdigit`, `isalpha`,
`isspace`, `toupper`, `tolower`.', 3
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'String Algorithms',
'**Palindrome** -- compare from both ends inward:

```c
int lo = 0, hi = strlen(s) - 1, ok = 1;
while (lo < hi) {
    if (s[lo] != s[hi]) { ok = 0; break; }
    lo++; hi--;
}
```

**Count words** on a line -- a word starts where a non-space follows a
space or the start:

```c
int words = 0, inWord = 0;
for (int i = 0; line[i]; i++) {
    if (line[i] != '' '') {
        if (!inWord) { words++; inWord = 1; }
    } else {
        inWord = 0;
    }
}
```

**Character frequency** with a 26-slot table (lowercase letters):

```c
int freq[26] = {0};
for (int i = 0; s[i]; i++)
    if (s[i] >= ''a'' && s[i] <= ''z'')
        freq[s[i] - ''a'']++;
```

Two strings are **anagrams** if their frequency tables are identical.', 4
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

-- ---- Module 8: Pointers and Dynamic Memory Allocation ---------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'What a Pointer Is',
'Every variable lives at an **address** in memory. A **pointer** is a
variable that stores an address.

```c
int  x = 42;
int *p = &x;      /* p holds the address of x   */

printf("%d\n", x);      /* 42                     */
printf("%p\n", (void*)&x);   /* the address       */
printf("%d\n", *p);     /* 42 -- "value at p"     */

*p = 100;               /* changes x through p    */
printf("%d\n", x);      /* 100                    */
```

Two operators:

- `&x` -- **address of** `x`
- `*p` -- **value at** the address in `p` (called *dereferencing*)

The type matters: `int *p` points at an `int`, `char *q` at a `char`. A
pointer that points at nothing should be set to `NULL`, and you must never
dereference a `NULL` (or uninitialised) pointer -- that crashes.', 1
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Pointers and Functions',
'Passing a pointer lets a function reach back and change the caller''s data.

```c
void increment(int *n) { (*n)++; }

int count = 0;
increment(&count);
printf("%d\n", count);     /* 1 */
```

Returning **two results** -- pass pointers for the outputs:

```c
void minmax(int a[], int n, int *mn, int *mx) {
    *mn = *mx = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < *mn) *mn = a[i];
        if (a[i] > *mx) *mx = a[i];
    }
}
/* int lo, hi;  minmax(arr, n, &lo, &hi); */
```

`swap` again, now that the syntax is familiar:

```c
void swap(int *a, int *b) {
    int t = *a; *a = *b; *b = t;
}
```

Rule of thumb: if a function must *modify* what you give it, or give back
more than one value, it takes pointers.', 2
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Pointers and Arrays',
'An array name **decays** to a pointer to its first element. So these are the
same:

```c
a[i]  ==  *(a + i)
&a[0] ==  a
```

`a + 1` does not add 1 byte -- it advances by **one element** (`sizeof(int)`
bytes for an `int` array). This is *pointer arithmetic*.

Walk an array with a pointer:

```c
for (int *p = a; p < a + n; p++)
    printf("%d ", *p);
```

When you pass an array to a function, you are really passing a pointer, and
the size information is lost -- which is why you also pass `n`:

```c
int sum(int *a, int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += a[i];   /* a[i] still works */
    return s;
}
```

Strings work the same way: `char *s` can point at a `char` array and be
indexed with `s[i]`.', 3
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Dynamic Memory: malloc and free',
'Fixed-size arrays force you to guess the size at compile time. **Dynamic
allocation** asks the operating system for memory at run time, from
`#include <stdlib.h>`.

```c
int n;
scanf("%d", &n);

int *a = malloc(n * sizeof *a);   /* room for n ints, uninitialised */
if (a == NULL) return 1;          /* always check */

for (int i = 0; i < n; i++) a[i] = i * i;

free(a);                          /* give it back */
a = NULL;                         /* avoid using a freed pointer */
```

| Function | Purpose |
|----------|---------|
| `malloc(bytes)` | allocate, contents undefined |
| `calloc(count, size)` | allocate **and zero** |
| `realloc(ptr, bytes)` | grow or shrink an existing block |
| `free(ptr)` | release a block |

The rules: every `malloc`/`calloc` gets exactly one `free`; never use memory
after freeing it; never `free` twice. Breaking these causes leaks or
crashes.', 4
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

-- ---- Module 9: Structures, Unions and File Handling -----------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Structures',
'A `struct` groups related values -- possibly of different types -- into one
named type.

```c
struct Student {
    char name[50];
    int  roll;
    double gpa;
};

struct Student s;
strcpy(s.name, "Asha");
s.roll = 101;
s.gpa  = 8.7;

printf("%s (%d): %.2f\n", s.name, s.roll, s.gpa);
```

Access members with the **dot** operator: `s.roll`.

You can initialise at declaration:

```c
struct Student a = {"Ben", 102, 7.9};
```

A `typedef` saves you writing `struct` every time:

```c
typedef struct {
    int x, y;
} Point;

Point p = {3, 4};
```

Structs can be copied with `=` and passed to functions (by value, so a
copy).', 1
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Arrays of Structures and the Arrow Operator',
'An **array of structs** models a table of records:

```c
struct Student list[100];
int n;
scanf("%d", &n);
for (int i = 0; i < n; i++)
    scanf("%s %lf", list[i].name, &list[i].gpa);
```

Find the top scorer:

```c
int best = 0;
for (int i = 1; i < n; i++)
    if (list[i].gpa > list[best].gpa)
        best = i;
printf("%s\n", list[best].name);
```

With a **pointer to a struct**, use the arrow `->` instead of the dot:

```c
struct Student *ptr = &list[0];
printf("%d\n", ptr->roll);      /* same as (*ptr).roll */
```

Passing a pointer to a struct avoids copying the whole record and lets the
function modify it:

```c
void promote(struct Student *st) { st->gpa += 0.5; }
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Unions and Enums',
'A `union` looks like a struct but all members **share the same memory** --
it is only ever holding one of them at a time. Its size is that of its
largest member.

```c
union Value {
    int    i;
    float  f;
    char   c;
};

union Value v;
v.i = 65;
printf("%d\n", v.i);       /* 65   */
v.f = 3.14f;               /* now the int slot is meaningless */
```

Unions are used to save space or to reinterpret bytes.

An `enum` gives names to a set of integer constants -- clearer than magic
numbers:

```c
enum Weekday { MON, TUE, WED, THU, FRI };   /* MON = 0, TUE = 1, ... */

enum Weekday today = WED;
if (today == WED) printf("midweek\n");
```', 3
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'File Handling and CSV Basics',
'A file is opened with `fopen`, which returns a `FILE *` handle (or `NULL` on
failure), and closed with `fclose`.

```c
#include <stdio.h>

FILE *fp = fopen("marks.txt", "r");    /* "r" read, "w" write, "a" append */
if (fp == NULL) { perror("open"); return 1; }

char name[50];
int  marks;
while (fscanf(fp, "%s %d", name, &marks) == 2)
    printf("%s -> %s\n", name, marks >= 40 ? "PASS" : "FAIL");

fclose(fp);
```

`fscanf` returns the number of items it read, so `== 2` is the clean way to
loop until end of file.

**Writing** a CSV report:

```c
FILE *out = fopen("report.csv", "w");
fprintf(out, "name,marks,result\n");
fprintf(out, "%s,%d,%s\n", name, marks, marks >= 40 ? "PASS" : "FAIL");
fclose(out);
```

Always check the return of `fopen`, and always `fclose` when done.', 4
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

-- ---- Module 10: Integrated Practice and Evaluation -----------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Reading and Debugging Code',
'Half of programming is finding out why code does the wrong thing.

**A debugging routine that works:**

1. Reproduce the failure with the **smallest** input that still breaks.
2. Predict what a line should do, then check what it actually does --
   `printf` the variable, or step through it in a debugger.
3. Fix one thing, re-run, repeat.

**Compile with warnings on** -- they catch a lot before you even run:

```
gcc -Wall -Wextra program.c -o program
```

**Bugs to look for first:**

| Symptom | Likely cause |
|---------|--------------|
| Always takes the `if` branch | `=` instead of `==` |
| Off by one / misses last item | loop bound `<` vs `<=` |
| Crash on input | missing `&` in `scanf` |
| Garbage values | uninitialised variable |
| Skips a case | missing `break` in `switch` |
| Random corruption | array index out of bounds |', 1
FROM modules WHERE track_id = @c AND title = 'Module 10: Integrated Practice and Evaluation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Time and Space Complexity Basics',
'**Big-O** describes how the work grows as the input `n` grows. Constants
and lower-order terms are dropped.

| Notation | Name | Example |
|----------|------|---------|
| O(1) | constant | array access, `a[i]` |
| O(log n) | logarithmic | binary search, halving each step |
| O(n) | linear | one loop over `n` items |
| O(n log n) | linearithmic | good sorting |
| O(n^2) | quadratic | nested loop over `n` |

```c
/* O(n): one pass */
for (int i = 0; i < n; i++) total += a[i];

/* O(n^2): compare every pair */
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        if (a[i] == a[j]) dup = 1;
```

**Space complexity** is the extra memory you use beyond the input. A running
total is O(1); a frequency table of size `n` is O(n).

In interviews, always state the time and space complexity of your solution.', 2
FROM modules WHERE track_id = @c AND title = 'Module 10: Integrated Practice and Evaluation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Interview-Style Problem Solving',
'For every problem, be ready to say four things:

1. **Approach** -- one or two sentences on the idea.
2. **Dry run** -- trace a small example by hand.
3. **Complexity** -- time and space.
4. **Edge cases** -- empty input, one element, all equal, negatives,
   overflow.

Worked example -- *maximum subarray sum* (Kadane''s algorithm):

```c
long best = a[0], cur = a[0];
for (int i = 1; i < n; i++) {
    cur = (a[i] > cur + a[i]) ? a[i] : cur + a[i];
    if (cur > best) best = cur;
}
printf("%ld\n", best);
```

Approach: `cur` is the best sum of a subarray ending at `i`; extend it, or
start fresh at `a[i]` if that is larger. `best` tracks the overall maximum.

Time O(n), space O(1). Edge case: an all-negative array correctly returns
its largest single element, because `best` starts at `a[0]`.', 3
FROM modules WHERE track_id = @c AND title = 'Module 10: Integrated Practice and Evaluation';

-- ============================================================================
--  ASSESSMENTS  (Test module - auto-graded coding problems: stdin -> stdout)
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Assessment 1 - Basics, I/O and Operators   (Modules 1-2)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 1: Basics, I/O and Operators',
'Three problems. Each reads from standard input and prints the exact output shown. Do not print extra text.',
30, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order, starter_code) VALUES
(@t, 'coding',
'**Sum of two integers.** Input: two integers `a b` on one line. Output: their sum.

Example: input `3 5` -> output `8`',
10, 1,
'#include <stdio.h>
int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    /* your code */
    return 0;
}
');
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '3 5', '8', 1, 1, 1),
(@i, '-4 10', '6', 0, 1, 2),
(@i, '1000000 2000000', '3000000', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Area of a rectangle.** Input: two integers `length width`. Output: the area.

Example: input `4 5` -> output `20`',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '4 5', '20', 1, 1, 1),
(@i, '7 3', '21', 0, 1, 2),
(@i, '1 1', '1', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Sum of digits.** Input: a single non-negative integer `n`. Output: the sum of its decimal digits.

Example: input `1234` -> output `10`',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '1234', '10', 1, 1, 1),
(@i, '9', '9', 0, 1, 2),
(@i, '100000', '1', 0, 1, 3);

-- ---------------------------------------------------------------------------
--  Assessment 2 - Decision Making   (Module 3)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 2: Decision Making',
'Conditionals. Match the output format exactly (case-sensitive).',
30, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Largest of three.** Input: three integers `a b c`. Output: the largest.

Example: input `3 9 5` -> output `9`',
10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '3 9 5', '9', 1, 1, 1),
(@i, '10 2 8', '10', 0, 1, 2),
(@i, '4 4 4', '4', 0, 1, 3),
(@i, '-1 -9 -3', '-1', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Leap year.** Input: a year `y`. Output: `YES` if it is a leap year, otherwise `NO`.

A year is a leap year if it is divisible by 4 and not by 100, or if it is divisible by 400.',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '2000', 'YES', 1, 1, 1),
(@i, '1900', 'NO', 0, 1, 2),
(@i, '2024', 'YES', 0, 1, 3),
(@i, '2023', 'NO', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Grade calculation.** Input: an integer `marks` (0-100). Output the grade:

| marks | grade |
|-------|-------|
| >= 90 | `A` |
| >= 75 | `B` |
| >= 60 | `C` |
| >= 40 | `D` |
| else  | `F` |',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '95', 'A', 1, 1, 1),
(@i, '82', 'B', 0, 1, 2),
(@i, '60', 'C', 0, 1, 3),
(@i, '40', 'D', 0, 1, 4),
(@i, '12', 'F', 0, 1, 5);

-- ---------------------------------------------------------------------------
--  Assessment 3 - Loops and Patterns   (Module 4)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 3: Loops and Patterns',
'Loop logic and pattern printing. Trailing spaces and a trailing newline are ignored by the grader.',
35, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Factorial.** Input: a non-negative integer `n` (n <= 12). Output: `n!`.

Example: input `5` -> output `120`. Note `0! = 1`.',
10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '5', '120', 1, 1, 1),
(@i, '0', '1', 0, 1, 2),
(@i, '7', '5040', 0, 1, 3),
(@i, '12', '479001600', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Reverse a number.** Input: a non-negative integer `n`. Output: its digits reversed, with leading zeros dropped.

Example: input `1234` -> output `4321`; input `1000` -> output `1`',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '1234', '4321', 1, 1, 1),
(@i, '1000', '1', 0, 1, 2),
(@i, '7', '7', 0, 1, 3),
(@i, '90807', '70809', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Right triangle pattern.** Input: an integer `n`. Output: `n` lines, where line `i` contains `i` asterisks.

Example: input `3` ->
```
*
**
***
```',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '3', '*
**
***', 1, 1, 1),
(@i, '1', '*', 0, 1, 2),
(@i, '5', '*
**
***
****
*****', 0, 1, 3);

-- ---------------------------------------------------------------------------
--  Assessment 4 - Functions and Recursion   (Module 5)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 4: Functions and Recursion',
'Write a helper function for each task, then call it from main.',
35, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Power.** Input: two non-negative integers `base exp`. Output: `base` raised to `exp`. Assume the result fits in a 32-bit int. `x^0 = 1`.

Example: input `2 10` -> output `1024`',
10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '2 10', '1024', 1, 1, 1),
(@i, '5 0', '1', 0, 1, 2),
(@i, '3 3', '27', 0, 1, 3),
(@i, '7 2', '49', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Fibonacci (recursive).** Input: an integer `n` (0 <= n <= 30). Output: the nth Fibonacci number where `F(0) = 0` and `F(1) = 1`.

Example: input `10` -> output `55`',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '10', '55', 1, 1, 1),
(@i, '0', '0', 0, 1, 2),
(@i, '1', '1', 0, 1, 3),
(@i, '20', '6765', 0, 1, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**GCD (recursive).** Input: two positive integers `a b`. Output: their greatest common divisor (use the Euclidean algorithm).

Example: input `12 18` -> output `6`',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '12 18', '6', 1, 1, 1),
(@i, '17 5', '1', 0, 1, 2),
(@i, '100 10', '10', 0, 1, 3),
(@i, '36 24', '12', 0, 1, 4);

-- ---------------------------------------------------------------------------
--  Assessment 5 - Arrays and Strings   (Modules 6-7)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 5: Arrays and Strings',
'Array aggregates and string logic. Read the input format for each problem carefully.',
40, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Sum and maximum of an array.** Input: line 1 is `n`; line 2 has `n` integers. Output: `sum max` on one line, separated by a single space.

Example:
```
5
1 2 3 4 5
```
-> `15 5`',
10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '5
1 2 3 4 5', '15 5', 1, 1, 1),
(@i, '1
42', '42 42', 0, 1, 2),
(@i, '4
-1 -5 -3 -2', '-11 -1', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Running sum of a 1D array.** Input: line 1 is `n`; line 2 has `n` integers. Output: the running (prefix) sums separated by single spaces.

Example:
```
5
1 2 3 4 5
```
-> `1 3 6 10 15`',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '5
1 2 3 4 5', '1 3 6 10 15', 1, 1, 1),
(@i, '1
7', '7', 0, 1, 2),
(@i, '4
1 1 1 1', '1 2 3 4', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Valid palindrome.** Input: a single lowercase word (letters only). Output: `YES` if it reads the same forwards and backwards, else `NO`.

Example: input `racecar` -> output `YES`',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, 'racecar', 'YES', 1, 1, 1),
(@i, 'hello', 'NO', 0, 1, 2),
(@i, 'abba', 'YES', 0, 1, 3),
(@i, 'a', 'YES', 0, 1, 4);

-- ---------------------------------------------------------------------------
--  Assessment 6 - Pointers, Structures and Final Assessment   (Modules 8-10)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Assessment 6: Pointers, Structures and Final Assessment',
'Placement-style checkpoint covering pointers, structures and mixed problem solving.',
45, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Swap using pointers.** Input: two integers `a b`. Write a `void swap(int *, int *)` function, call it, then print the two values (now swapped) as `a b`.

Example: input `3 7` -> output `7 3`',
10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '3 7', '7 3', 1, 1, 1),
(@i, '1 1', '1 1', 0, 1, 2),
(@i, '0 9', '9 0', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Frequency of a target.** Input: line 1 is `n`; line 2 has `n` integers; line 3 is the target. Output: how many times the target appears.

Example:
```
5
1 2 2 3 2
2
```
-> `3`',
10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '5
1 2 2 3 2
2', '3', 1, 1, 1),
(@i, '3
1 2 3
5', '0', 0, 1, 2),
(@i, '1
9
9', '1', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Top scorer.** Input: line 1 is `n`; the next `n` lines each have a name (no spaces) and an integer mark. Output: the name with the highest mark. If several tie, print the first one read.

Example:
```
3
Asha 88
Ben 72
Chitra 95
```
-> `Chitra`',
10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '3
Asha 88
Ben 72
Chitra 95', 'Chitra', 1, 1, 1),
(@i, '1
Sam 50', 'Sam', 0, 1, 2),
(@i, '3
X 10
Y 10
Z 9', 'X', 0, 1, 3);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'coding',
'**Maximum subarray sum.** Input: line 1 is `n`; line 2 has `n` integers (may be negative). Output: the largest sum of any contiguous non-empty subarray (Kadane''s algorithm).

Example:
```
9
-2 1 -3 4 -1 2 1 -5 4
```
-> `6`',
10, 4);
SET @i := LAST_INSERT_ID();
INSERT INTO test_cases (item_id, stdin, expected_stdout, is_sample, weight, sort_order) VALUES
(@i, '9
-2 1 -3 4 -1 2 1 -5 4', '6', 1, 1, 1),
(@i, '1
-5', '-5', 0, 1, 2),
(@i, '5
1 2 3 4 5', '15', 0, 1, 3),
(@i, '4
-1 -2 -3 -4', '-1', 0, 1, 4);

-- ============================================================================
--  Recompute cached point totals
-- ============================================================================
UPDATE tests t
   SET total_points = (SELECT COALESCE(SUM(points), 0) FROM test_items WHERE test_id = t.id)
 WHERE t.track_id = @c;

SELECT
  (SELECT COUNT(*) FROM modules WHERE track_id = @c)                           AS modules,
  (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE m.track_id = @c)                                                    AS lessons,
  (SELECT COUNT(*) FROM tests WHERE track_id = @c)                             AS assessments,
  (SELECT COUNT(*) FROM test_items ti JOIN tests te ON te.id = ti.test_id
     WHERE te.track_id = @c)                                                   AS questions,
  (SELECT COUNT(*) FROM test_cases tc JOIN test_items ti ON ti.id = tc.item_id
     JOIN tests te ON te.id = ti.test_id WHERE te.track_id = @c)               AS test_cases;
