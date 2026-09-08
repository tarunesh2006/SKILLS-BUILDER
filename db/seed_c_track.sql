-- ============================================================================
--  C Programming track - full content + quizzes
--  Source: "C Programming Technical Training Syllabus (40 Hours)", 2026-2027
--          (Final year CSE / AI&DS - beginner to placement-oriented)
--
--  Loads 10 modules with text lessons (code snippets inline) and 6 auto-graded
--  coding quizzes covering the syllabus checkpoints. Every quiz question is a
--  stdin -> stdout problem graded by the Piston judge.
--
--  RE-RUNNABLE: it first deletes existing modules and tests for the C track,
--  which cascade-deletes any student progress/submissions for C. Safe for a
--  dev/staging database; do not run against production with live attempts.
--
--  Usage:
--    docker compose exec -T mysql mysql -uroot -proot learning_platform < db/seed_c_track.sql
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
--  LESSONS
-- ============================================================================

-- ---- Module 1 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Your First C Program',
'# Your First C Program

C source is compiled to machine code before it runs:

`source.c` -> **preprocessor** -> **compiler** -> **assembler** -> **linker** -> executable

```c
#include <stdio.h>   /* declarations for printf, scanf, ... */

int main(void) {
    printf("Hello, World\n");
    return 0;          /* 0 tells the OS the program succeeded */
}
```

Compile and run from the command line:

```
gcc hello.c -o hello
./hello
```

Every C program starts executing at `main`. Statements end with `;`. Blocks
are wrapped in `{ }`.', 1
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Variables, Data Types and Console I/O',
'# Variables, Data Types and Console I/O

| Type | Typical size | `printf` / `scanf` specifier |
|------|--------------|------------------------------|
| `int` | 4 bytes | `%d` |
| `float` | 4 bytes | `%f` |
| `double` | 8 bytes | `%lf` (scanf), `%f` (printf) |
| `char` | 1 byte | `%c` |

```c
#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);          /* & = address of the variable */
    printf("sum = %d\n", a + b);

    double celsius;
    scanf("%lf", &celsius);
    printf("%.2f F\n", celsius * 9.0 / 5.0 + 32.0);
    return 0;
}
```

Integer division truncates: `7 / 2` is `3`. Force real division by making an
operand a `double`: `7 / 2.0` is `3.5`. This is *type casting*: `(double)a / b`.', 2
FROM modules WHERE track_id = @c AND title = 'Module 1: Introduction to C Programming';

-- ---- Module 2 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Operators in C',
'# Operators in C

```c
int a = 7, b = 2;
a + b;   a - b;   a * b;   a / b;   a % b;     /* 9 5 14 3 1  (arithmetic) */
a > b;   a == b;  a != b;                       /* 1 0 1       (relational)  */
(a > 0) && (b > 0);   (a > 10) || (b > 0);      /* 1 1         (logical)     */
```

Compound assignment: `a += 3;` is `a = a + 3;`. Same for `-= *= /= %=`.

Increment / decrement:

```c
int x = 5;
int y = x++;   /* y = 5, then x becomes 6  (post-increment) */
int z = ++x;   /* x becomes 7, then z = 7  (pre-increment)  */
```

Digit extraction uses `%` and `/`:

```c
int n = 1234, sum = 0;
while (n > 0) { sum += n % 10; n /= 10; }   /* sum = 10 */
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Bitwise Operators and Precedence',
'# Bitwise Operators and Precedence

| Op | Meaning | `6 op 3` |
|----|---------|----------|
| `&` | AND | `2` |
| `|` | OR | `7` |
| `^` | XOR | `5` |
| `~` | NOT | `-7` |
| `<<` | left shift | `6 << 1` = `12` |
| `>>` | right shift | `6 >> 1` = `3` |

Common tricks:

```c
(n & 1) == 0        /* n is even            */
n << 1              /* multiply by 2        */
n & (n - 1)         /* clears the lowest set bit */
```

Precedence (high to low, abridged): `!` `~` unary `-`  >  `* / %`  >  `+ -`
>  `< <= > >=`  >  `== !=`  >  `&`  >  `^`  >  `|`  >  `&&`  >  `||`  >  `=`.
When in doubt, parenthesise.', 2
FROM modules WHERE track_id = @c AND title = 'Module 2: Operators and Expressions';

-- ---- Module 3 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'if, if-else and the else-if Ladder',
'# if, if-else and the else-if Ladder

```c
if (marks >= 90)       printf("A\n");
else if (marks >= 75)  printf("B\n");
else if (marks >= 60)  printf("C\n");
else if (marks >= 40)  printf("D\n");
else                   printf("F\n");
```

The ladder stops at the first true condition. Order matters: check the
tightest bound first.

Largest of three:

```c
int max = a;
if (b > max) max = b;
if (c > max) max = c;
printf("%d\n", max);
```

Leap year:

```c
int leap = (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0);
printf(leap ? "YES\n" : "NO\n");
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'switch-case and Menu Programs',
'# switch-case and Menu Programs

`switch` compares one integer/char expression against constant labels. Without
`break`, execution *falls through* to the next case.

```c
int choice;
scanf("%d", &choice);
switch (choice) {
    case 1: printf("Add\n");      break;
    case 2: printf("Subtract\n"); break;
    case 3: printf("Multiply\n"); break;
    default: printf("Invalid\n");
}
```

Grouped labels share a body:

```c
switch (ch) {
    case ''a'': case ''e'': case ''i'': case ''o'': case ''u'':
        printf("vowel\n"); break;
    default:
        printf("consonant\n");
}
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 3: Decision Making Statements';

-- ---- Module 4 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'for, while, do-while, break and continue',
'# Loops

```c
for (int i = 1; i <= n; i++)   printf("%d ", i);   /* count 1..n */

int i = 1;
while (i <= n) { printf("%d ", i); i++; }

int j = 1;
do { printf("%d ", j); j++; } while (j <= n);      /* body runs at least once */
```

`break` leaves the loop; `continue` jumps to the next iteration.

Factorial and reverse:

```c
long fact = 1;
for (int k = 2; k <= n; k++) fact *= k;

int rev = 0;
while (n > 0) { rev = rev * 10 + n % 10; n /= 10; }
```

Prime check:

```c
int isPrime = (n >= 2);
for (int d = 2; (long)d * d <= n; d++)
    if (n % d == 0) { isPrime = 0; break; }
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Nested Loops and Pattern Printing',
'# Nested Loops and Pattern Printing

The outer loop picks the row; the inner loop prints that row.

```c
/* right triangle of height n
   *
   **
   ***                     */
for (int r = 1; r <= n; r++) {
    for (int col = 1; col <= r; col++) printf("*");
    printf("\n");
}
```

Number triangle:

```c
for (int r = 1; r <= n; r++) {
    for (int col = 1; col <= r; col++) printf("%d", col);
    printf("\n");
}
```

Multiplication table:

```c
for (int m = 1; m <= 10; m++) printf("%d x %d = %d\n", n, m, n * m);
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 4: Looping Statements and Patterns';

-- ---- Module 5 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Functions: Parameters, Return Values and Scope',
'# Functions

Declare the prototype before `main`, define the body anywhere.

```c
#include <stdio.h>

int power(int base, int exp) {     /* parameters are copies (pass by value) */
    int result = 1;
    for (int i = 0; i < exp; i++) result *= base;
    return result;
}

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", power(a, b));
    return 0;
}
```

Variables declared inside a function (or block) are *local* to it. To let a
function modify a caller''s variable, pass a pointer (Module 8).

C has no function overloading - each function needs a unique name.', 1
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Recursion',
'# Recursion

A recursive function calls itself on a smaller input and must have a
**base case** that stops the recursion.

```c
long factorial(int n) {
    if (n <= 1) return 1;             /* base case */
    return n * factorial(n - 1);      /* recursive case */
}

int fib(int n) {                      /* F0 = 0, F1 = 1 */
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}
```

Every call adds a frame to the call stack, so deep recursion without a base
case overflows the stack.', 2
FROM modules WHERE track_id = @c AND title = 'Module 5: Functions and Recursion';

-- ---- Module 6 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, '1D Arrays: Traversal and Aggregates',
'# 1D Arrays

```c
int a[100];
int n;
scanf("%d", &n);
for (int i = 0; i < n; i++) scanf("%d", &a[i]);
```

Sum, max and running sum:

```c
long sum = 0;
int max = a[0];
for (int i = 0; i < n; i++) {
    sum += a[i];
    if (a[i] > max) max = a[i];
}

int run = 0;
for (int i = 0; i < n; i++) { run += a[i]; printf("%d ", run); }
```

Frequency of a target value:

```c
int count = 0;
for (int i = 0; i < n; i++) if (a[i] == target) count++;
```

Array indices run `0 .. n-1`. Reading or writing outside that range is
undefined behaviour.', 1
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, '2D Arrays and Linear Search',
'# 2D Arrays and Linear Search

```c
int grid[3][4];
for (int r = 0; r < 3; r++)
    for (int col = 0; col < 4; col++)
        scanf("%d", &grid[r][col]);
```

Row sums (used in "richest customer wealth"):

```c
int best = 0;
for (int r = 0; r < rows; r++) {
    int rowSum = 0;
    for (int col = 0; col < cols; col++) rowSum += grid[r][col];
    if (rowSum > best) best = rowSum;
}
```

Linear search returns the first matching index, or `-1`:

```c
int find(int a[], int n, int key) {
    for (int i = 0; i < n; i++) if (a[i] == key) return i;
    return -1;
}
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 6: Arrays and Searching Basics';

-- ---- Module 7 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'C Strings and <string.h>',
'# C Strings

A C string is a `char` array ending in a null terminator `''\0''`.

```c
char name[100];
scanf("%s", name);          /* reads one whitespace-delimited token */
printf("%s\n", name);
```

`<string.h>`:

| Function | Purpose |
|----------|---------|
| `strlen(s)` | length (excludes `\0`) |
| `strcpy(d, s)` | copy |
| `strcat(d, s)` | append |
| `strcmp(a, b)` | 0 if equal |

```c
#include <ctype.h>
for (int i = 0; s[i]; i++) s[i] = tolower((unsigned char) s[i]);
```

Read a whole line with `fgets(buf, sizeof buf, stdin)`.', 1
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'String Algorithms',
'# String Algorithms

Palindrome (two-pointer):

```c
int lo = 0, hi = strlen(s) - 1, ok = 1;
while (lo < hi) {
    if (s[lo] != s[hi]) { ok = 0; break; }
    lo++; hi--;
}
printf(ok ? "YES\n" : "NO\n");
```

Word count on a line:

```c
int words = 0, inWord = 0;
for (int i = 0; line[i]; i++) {
    if (line[i] != '' '') { if (!inWord) { words++; inWord = 1; } }
    else inWord = 0;
}
```

Character frequency with a 26-slot table:

```c
int freq[26] = {0};
for (int i = 0; s[i]; i++) freq[s[i] - ''a'']++;
```', 2
FROM modules WHERE track_id = @c AND title = 'Module 7: String Handling';

-- ---- Module 8 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Pointers and Pointer Arithmetic',
'# Pointers

A pointer stores the address of another object.

```c
int x = 10;
int *p = &x;      /* p points to x        */
printf("%d\n", *p);   /* 10  - dereference */
*p = 25;              /* x is now 25       */
```

Passing a pointer lets a function modify the caller''s variable:

```c
void swap(int *a, int *b) {
    int t = *a; *a = *b; *b = t;
}
/* swap(&m, &n); */
```

An array name decays to a pointer to its first element, so `a[i]` is
`*(a + i)`:

```c
for (int *q = a; q < a + n; q++) printf("%d ", *q);
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Dynamic Memory Allocation',
'# Dynamic Memory Allocation

Heap memory is requested at run time from `<stdlib.h>` and must be released.

```c
#include <stdlib.h>

int n;
scanf("%d", &n);

int *a = malloc(n * sizeof *a);     /* uninitialised            */
int *b = calloc(n, sizeof *b);      /* zero-initialised         */

if (a == NULL) return 1;            /* always check             */

a = realloc(a, 2 * n * sizeof *a);  /* grow / shrink            */

free(a);                            /* return it to the heap    */
free(b);
a = NULL;                           /* avoid dangling pointer   */
```

Rules: every `malloc`/`calloc` is paired with exactly one `free`; never use
memory after freeing it; never `free` the same block twice.', 2
FROM modules WHERE track_id = @c AND title = 'Module 8: Pointers and Dynamic Memory Allocation';

-- ---- Module 9 -------------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Structures and Unions',
'# Structures and Unions

A `struct` groups related fields under one type.

```c
struct Student {
    char name[50];
    int  marks;
};

struct Student s;
scanf("%s %d", s.name, &s.marks);
printf("%s scored %d\n", s.name, s.marks);
```

Array of structures + find the top scorer:

```c
struct Student list[100];
int best = 0;
for (int i = 1; i < n; i++)
    if (list[i].marks > list[best].marks) best = i;
printf("%s\n", list[best].name);
```

A `union` stores only one of its members at a time and occupies the size of
its largest member.

```c
union Value { int i; float f; };
```', 1
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'File Handling and CSV Basics',
'# File Handling

```c
#include <stdio.h>

FILE *fp = fopen("marks.txt", "r");   /* "r" read, "w" write, "a" append */
if (fp == NULL) { perror("open"); return 1; }

char name[50];
int  marks;
while (fscanf(fp, "%s %d", name, &marks) == 2)
    printf("%s -> %s\n", name, marks >= 40 ? "PASS" : "FAIL");

fclose(fp);
```

Writing:

```c
FILE *out = fopen("report.csv", "w");
fprintf(out, "name,marks,result\n");
fprintf(out, "%s,%d,%s\n", name, marks, marks >= 40 ? "PASS" : "FAIL");
fclose(out);
```

CSV is just text: split each line on commas with `strtok` or `sscanf`.', 2
FROM modules WHERE track_id = @c AND title = 'Module 9: Structures, Unions and File Handling';

-- ---- Module 10 ----------------------------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Debugging, Best Practices and Complexity',
'# Debugging, Best Practices and Complexity

**Debugging checklist**

- Reproduce with the smallest input that fails.
- Print intermediate values, or step through with `gdb` / an IDE debugger.
- Compile with warnings on: `gcc -Wall -Wextra file.c`.
- Watch for: `=` vs `==`, off-by-one loop bounds, missing `&` in `scanf`,
  uninitialised variables, array out-of-bounds, forgotten `break` in `switch`.

**Best practices**

- Meaningful names, one job per function, no magic numbers.
- Check every `scanf` / `malloc` / `fopen` return value.

**Complexity awareness**

| Pattern | Time |
|---------|------|
| single loop over n | O(n) |
| nested loop over n | O(n^2) |
| halving each step | O(log n) |

A single pass that keeps a running max is O(n); comparing every pair is O(n^2).', 1
FROM modules WHERE track_id = @c AND title = 'Module 10: Integrated Practice and Evaluation';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Interview-style Problem Solving',
'# Interview-style Problem Solving

For each problem, be ready to state:

1. **Approach** in one or two sentences.
2. **Dry run** on a small example.
3. **Complexity** (time and space).
4. **Edge cases**: empty input, single element, all equal, negatives, overflow.

Worked example - *maximum subarray sum* (Kadane):

```c
long best = a[0], cur = a[0];
for (int i = 1; i < n; i++) {
    cur = (a[i] > cur + a[i]) ? a[i] : cur + a[i];
    if (cur > best) best = cur;
}
printf("%ld\n", best);
```

Approach: keep the best sum ending at `i`; restart when it goes negative.
Time O(n), space O(1). Edge case: all-negative array returns the largest
single element.', 2
FROM modules WHERE track_id = @c AND title = 'Module 10: Integrated Practice and Evaluation';

-- ============================================================================
--  QUIZZES  (auto-graded coding problems: stdin -> stdout)
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Quiz 1 - Basics, I/O and Operators   (Modules 1-2)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 1: Basics, I/O and Operators',
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
--  Quiz 2 - Decision Making   (Module 3)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 2: Decision Making',
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
--  Quiz 3 - Loops and Patterns   (Module 4)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 3: Loops and Patterns',
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
--  Quiz 4 - Functions and Recursion   (Module 5)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 4: Functions and Recursion',
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
--  Quiz 5 - Arrays and Strings   (Modules 6-7)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 5: Arrays and Strings',
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
--  Quiz 6 - Pointers, Structures and Final Assessment   (Modules 8-10)
-- ---------------------------------------------------------------------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@c, 'C Quiz 6: Pointers, Structures and Final Assessment',
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
  (SELECT COUNT(*) FROM tests WHERE track_id = @c)                             AS quizzes,
  (SELECT COUNT(*) FROM test_items ti JOIN tests te ON te.id = ti.test_id
     WHERE te.track_id = @c)                                                   AS questions,
  (SELECT COUNT(*) FROM test_cases tc JOIN test_items ti ON ti.id = tc.item_id
     JOIN tests te ON te.id = ti.test_id WHERE te.track_id = @c)               AS test_cases;
