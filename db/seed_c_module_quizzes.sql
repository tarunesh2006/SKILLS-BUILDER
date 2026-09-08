-- ============================================================================
--  C Programming track - per-module "Check Your Understanding" quizzes
--
--  Part of COURSE DELIVERY (not the Test module): 5 MCQs per module, shown on
--  the module page, retakeable, immediate feedback. Passing (>= pass_percent)
--  marks the module complete.
--
--  RE-RUNNABLE: deletes existing module quizzes for the C track first.
--
--  Usage:
--    docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 \
--      learning_platform < db/seed_c_module_quizzes.sql
-- ============================================================================
SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES,STRICT_TRANS_TABLES';
USE learning_platform;

SET @c := (SELECT id FROM tracks WHERE slug = 'c');

DELETE mq FROM module_quizzes mq
  JOIN modules m ON m.id = mq.module_id
 WHERE m.track_id = @c;

-- Helpers are not available in plain SQL, so each question is:
--   INSERT question -> SET @qq := LAST_INSERT_ID() -> INSERT 4 options.

-- ===========================================================================
-- Module 1: Introduction to C Programming
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 1 Quiz: Introduction to C'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 1:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Where does execution of every C program begin?', 'mcq',
        'Control always enters at `main`, regardless of where it is defined in the file.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The first function in the file', 0, 1),
(@qq, 'The `main` function', 1, 2),
(@qq, 'The first `#include` line', 0, 3),
(@qq, 'A function named `start`', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does `#include <stdio.h>` do?', 'mcq',
        'It pastes in the declarations for the standard I/O functions so the compiler knows about `printf`, `scanf`, etc.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Runs the standard input/output library', 0, 1),
(@qq, 'Makes declarations for functions like printf and scanf available', 1, 2),
(@qq, 'Links the final executable', 0, 3),
(@qq, 'Defines the main function', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which stage combines your compiled code with library code to produce the executable?', 'mcq',
        'Preprocess -> compile -> assemble -> **link**. The linker resolves references such as `printf` against the C library.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The preprocessor', 0, 1),
(@qq, 'The compiler', 0, 2),
(@qq, 'The linker', 1, 3),
(@qq, 'The loader', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the value of the expression `7 / 2` in C?', 'mcq',
        'Both operands are `int`, so integer division truncates toward zero: the result is `3`. Use `7 / 2.0` for `3.5`.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '3.5', 0, 1),
(@qq, '3', 1, 2),
(@qq, '4', 0, 3),
(@qq, 'Compilation error', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which `scanf` format specifier reads a value into a `double`?', 'mcq',
        '`scanf` needs `%lf` for `double`. (`printf` accepts `%f` for both `float` and `double`.)', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '%d', 0, 1),
(@qq, '%f', 0, 2),
(@qq, '%lf', 1, 3),
(@qq, '%c', 0, 4);

-- ===========================================================================
-- Module 2: Operators and Expressions
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 2 Quiz: Operators and Expressions'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 2:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'If `x` is 5, what value does `y` get from `int y = x++;`?', 'mcq',
        'Post-increment yields the old value first, then increments. `y` is 5 and `x` becomes 6.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '5', 1, 1),
(@qq, '6', 0, 2),
(@qq, '4', 0, 3),
(@qq, 'undefined', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which operator produces the remainder of an integer division?', 'mcq',
        '`%` is the modulo operator: `17 % 5` is `2`.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '/', 0, 1),
(@qq, '%', 1, 2),
(@qq, '&', 0, 3),
(@qq, 'mod', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is `6 & 3`?', 'mcq',
        'Bitwise AND: `110 & 011 = 010`, which is 2.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '2', 1, 1),
(@qq, '7', 0, 2),
(@qq, '9', 0, 3),
(@qq, '5', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In `a + b * c`, which operation happens first?', 'mcq',
        '`*` has higher precedence than `+`, so `b * c` is evaluated first.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'a + b', 0, 1),
(@qq, 'b * c', 1, 2),
(@qq, 'left to right, so a + b', 0, 3),
(@qq, 'undefined order', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'The test `(n & 1) == 0` is true when...', 'mcq',
        'The lowest bit is 0 exactly for even numbers.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'n is even', 1, 1),
(@qq, 'n is odd', 0, 2),
(@qq, 'n is negative', 0, 3),
(@qq, 'n is zero', 0, 4);

-- ===========================================================================
-- Module 3: Decision Making Statements
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 3 Quiz: Decision Making'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 3:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In an `if / else if / else` ladder, how many branches run?', 'mcq',
        'Evaluation stops at the first true condition; the rest are skipped.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'All whose condition is true', 0, 1),
(@qq, 'At most one', 1, 2),
(@qq, 'Exactly one, always', 0, 3),
(@qq, 'The last one', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What happens if a `switch` case has no `break`?', 'mcq',
        'Without `break`, control falls through into the following case(s).', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'A compile error', 0, 1),
(@qq, 'Execution falls through to the next case', 1, 2),
(@qq, 'The default case runs', 0, 3),
(@qq, 'The switch is skipped', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A `switch` expression in C may be...', 'mcq',
        '`switch` works on integer or character (integral) constant expressions - not floats or strings.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'an int or char expression', 1, 1),
(@qq, 'a float or double', 0, 2),
(@qq, 'a string', 0, 3),
(@qq, 'any expression at all', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does `if (a = 5)` do?', 'mcq',
        '`=` assigns. `a` becomes 5 and the expression value 5 is non-zero, so the branch always runs. You almost certainly meant `==`.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Compares a with 5', 0, 1),
(@qq, 'Assigns 5 to a; the condition is always true', 1, 2),
(@qq, 'Is a syntax error', 0, 3),
(@qq, 'Does nothing', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A year is a leap year when it is divisible by...', 'mcq',
        '`(y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)`.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '4 only', 0, 1),
(@qq, '4 and not 100, or by 400', 1, 2),
(@qq, '100 only', 0, 3),
(@qq, '2', 0, 4);

-- ===========================================================================
-- Module 4: Looping Statements and Patterns
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 4 Quiz: Loops and Patterns'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 4:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which loop always runs its body at least once?', 'mcq',
        '`do { ... } while (cond);` checks the condition *after* the body.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'for', 0, 1),
(@qq, 'while', 0, 2),
(@qq, 'do-while', 1, 3),
(@qq, 'None of them', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does `continue;` do inside a loop?', 'mcq',
        'It skips the rest of the current iteration and moves to the next one (running the update in a `for`).', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Exits the loop entirely', 0, 1),
(@qq, 'Skips to the next iteration', 1, 2),
(@qq, 'Restarts the loop from the beginning', 0, 3),
(@qq, 'Pauses the program', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'When printing a triangle pattern with nested loops, the outer loop usually controls...', 'mcq',
        'The outer loop iterates once per row; the inner loop prints the characters on that row.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'the current row', 1, 1),
(@qq, 'each character within a row', 0, 2),
(@qq, 'the total character count', 0, 3),
(@qq, 'nothing; only the inner loop matters', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How many times does the body of `for (int i = 0; i < n; i++)` run?', 'mcq',
        'i takes the values 0, 1, ..., n-1 - that is n iterations.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'n - 1 times', 0, 1),
(@qq, 'n times', 1, 2),
(@qq, 'n + 1 times', 0, 3),
(@qq, 'It depends on i', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A `break;` inside a nested loop exits...', 'mcq',
        '`break` leaves only the innermost enclosing loop (or switch).', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'all enclosing loops', 0, 1),
(@qq, 'only the innermost loop', 1, 2),
(@qq, 'the program', 0, 3),
(@qq, 'the outer loop only', 0, 4);

-- ===========================================================================
-- Module 5: Functions and Recursion
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 5 Quiz: Functions and Recursion'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 5:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Every useful recursive function must have...', 'mcq',
        'Without a base case the recursion never stops and the call stack overflows.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'a loop inside it', 0, 1),
(@qq, 'a base case that stops the recursion', 1, 2),
(@qq, 'at least two parameters', 0, 3),
(@qq, 'a global variable', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How are arguments passed to a C function by default?', 'mcq',
        'C passes by value - the function gets a copy, so assigning to a parameter does not change the caller variable.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'By reference', 0, 1),
(@qq, 'By value (a copy)', 1, 2),
(@qq, 'By name', 0, 3),
(@qq, 'It depends on the type', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'To let a function modify a variable in the caller, you pass...', 'mcq',
        'Pass `&x` (a pointer); the function dereferences it to write back.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'the variable directly', 0, 1),
(@qq, 'a pointer to the variable', 1, 2),
(@qq, 'a copy and return it', 0, 3),
(@qq, 'a global alias', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Does C allow two functions with the same name but different parameters (overloading)?', 'mcq',
        'No. Unlike C++, C requires every function to have a unique name.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Yes, always', 0, 1),
(@qq, 'No - each function name must be unique', 1, 2),
(@qq, 'Only for math functions', 0, 3),
(@qq, 'Only inside the same file', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A variable declared inside a function is...', 'mcq',
        'It is local: it exists only while that function runs and is invisible elsewhere.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'visible to every function', 0, 1),
(@qq, 'local to that function', 1, 2),
(@qq, 'stored on the heap', 0, 3),
(@qq, 'automatically returned', 0, 4);

-- ===========================================================================
-- Module 6: Arrays and Searching Basics
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 6 Quiz: Arrays and Searching'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 6:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'For `int a[n];`, what is the valid index range?', 'mcq',
        'Indices run from 0 to n-1. `a[n]` is out of bounds.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '1 to n', 0, 1),
(@qq, '0 to n - 1', 1, 2),
(@qq, '0 to n', 0, 3),
(@qq, '1 to n - 1', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, '`a[i]` is exactly equivalent to which expression?', 'mcq',
        'Array subscripting is defined as `*(a + i)`.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '*(a + i)', 1, 1),
(@qq, '*a + i', 0, 2),
(@qq, 'a + i', 0, 3),
(@qq, '&a[i]', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In the worst case, how many elements does linear search examine in an array of n items?', 'mcq',
        'If the key is absent or last, it checks all n - that is O(n).', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'about log n', 0, 1),
(@qq, 'all n', 1, 2),
(@qq, 'n / 2 always', 0, 3),
(@qq, '1', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How many `int` values does `int g[3][4];` hold?', 'mcq',
        '3 rows x 4 columns = 12 elements.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '7', 0, 1),
(@qq, '12', 1, 2),
(@qq, '3', 0, 3),
(@qq, '4', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Reading one element past the end of an array in C...', 'mcq',
        'It is undefined behaviour - it may crash, may read garbage, or may appear to work.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'always throws an exception', 0, 1),
(@qq, 'is undefined behaviour', 1, 2),
(@qq, 'returns 0', 0, 3),
(@qq, 'wraps around to a[0]', 0, 4);

-- ===========================================================================
-- Module 7: String Handling
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 7 Quiz: String Handling'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 7:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How does C know where a string ends?', 'mcq',
        'A C string is a char array terminated by the null character `\0`.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It stores the length in the first byte', 0, 1),
(@qq, 'By a null terminator \0', 1, 2),
(@qq, 'By a newline character', 0, 3),
(@qq, 'The compiler tracks it', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which function returns the number of characters in a string (excluding the terminator)?', 'mcq',
        '`strlen` from `<string.h>`.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'sizeof', 0, 1),
(@qq, 'strlen', 1, 2),
(@qq, 'strcpy', 0, 3),
(@qq, 'length', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, '`scanf("%s", s)` reads...', 'mcq',
        '`%s` stops at the first whitespace, so it reads a single token, not a whole line.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'the whole line including spaces', 0, 1),
(@qq, 'one whitespace-delimited word', 1, 2),
(@qq, 'exactly one character', 0, 3),
(@qq, 'everything until end of file', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, '`strcmp(a, b)` returns 0 when...', 'mcq',
        'It returns 0 for equal strings, negative/positive otherwise.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'a is longer than b', 0, 1),
(@qq, 'the two strings are equal', 1, 2),
(@qq, 'a comes before b alphabetically', 0, 3),
(@qq, 'either string is empty', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'To read a full line of text including spaces, use...', 'mcq',
        '`fgets(buf, sizeof buf, stdin)` reads up to a newline or buffer limit.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'scanf("%s", buf)', 0, 1),
(@qq, 'fgets(buf, sizeof buf, stdin)', 1, 2),
(@qq, 'getchar()', 0, 3),
(@qq, 'strcpy(buf, stdin)', 0, 4);

-- ===========================================================================
-- Module 8: Pointers and Dynamic Memory Allocation
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 8 Quiz: Pointers and Dynamic Memory'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 8:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does the `&` operator give you?', 'mcq',
        '`&x` is the address of `x` - suitable for initialising a pointer or passing to `scanf`.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The value stored in x', 0, 1),
(@qq, 'The address of x', 1, 2),
(@qq, 'A copy of x', 0, 3),
(@qq, 'The size of x', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'If `int *p = &x;`, what does `*p` refer to?', 'mcq',
        'Dereferencing `p` gives the object it points at - here, `x`.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The address of x', 0, 1),
(@qq, 'The value of x', 1, 2),
(@qq, 'The address of p', 0, 3),
(@qq, 'A new integer', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does `malloc` return?', 'mcq',
        'A pointer to an uninitialised block of the requested size, or `NULL` if the allocation fails.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Zero-initialised memory', 0, 1),
(@qq, 'A pointer to uninitialised memory, or NULL on failure', 1, 2),
(@qq, 'The number of bytes allocated', 0, 3),
(@qq, 'A copy of the heap', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Every successful `malloc` should be matched with exactly one...', 'mcq',
        'Call `free` once on each allocation. Freeing twice or using memory after `free` is undefined behaviour.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'delete', 0, 1),
(@qq, 'free', 1, 2),
(@qq, 'realloc', 0, 3),
(@qq, 'return', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How does `calloc(n, size)` differ from `malloc(n * size)`?', 'mcq',
        '`calloc` also zero-initialises the block.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It is faster', 0, 1),
(@qq, 'It zero-initialises the memory', 1, 2),
(@qq, 'It never returns NULL', 0, 3),
(@qq, 'It allocates on the stack', 0, 4);

-- ===========================================================================
-- Module 9: Structures, Unions and File Handling
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 9 Quiz: Structures, Unions and Files'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 9:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A `struct` lets you...', 'mcq',
        'A structure groups related values, possibly of different types, under one type name.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'group related variables of different types under one name', 1, 1),
(@qq, 'store only integers', 0, 2),
(@qq, 'define a new function', 0, 3),
(@qq, 'allocate heap memory automatically', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How much of a `union` is valid at any one time?', 'mcq',
        'A union overlays all members in the same storage; only the most recently written member is meaningful.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'All members simultaneously', 0, 1),
(@qq, 'Only one member at a time', 1, 2),
(@qq, 'The first member only', 0, 3),
(@qq, 'None until initialised', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, '`fopen("data.txt", "w")` opens the file for...', 'mcq',
        '`"w"` opens for writing and truncates any existing content. Use `"a"` to append, `"r"` to read.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'reading', 0, 1),
(@qq, 'writing, discarding existing content', 1, 2),
(@qq, 'appending to the end', 0, 3),
(@qq, 'reading and writing without truncating', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Given `struct Student *p;`, how do you read the `marks` field?', 'mcq',
        '`p->marks` is shorthand for `(*p).marks`.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'p.marks', 0, 1),
(@qq, 'p->marks', 1, 2),
(@qq, '*p.marks', 0, 3),
(@qq, '&p.marks', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What must you always check right after calling `fopen`?', 'mcq',
        '`fopen` returns `NULL` on failure (missing file, no permission); using a NULL `FILE *` crashes.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'that it returned NULL', 1, 1),
(@qq, 'the file size', 0, 2),
(@qq, 'that the disk is not full', 0, 3),
(@qq, 'nothing - fopen never fails', 0, 4);

-- ===========================================================================
-- Module 10: Integrated Practice and Evaluation
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 10 Quiz: Practice and Evaluation'
  FROM modules WHERE track_id = @c AND title LIKE 'Module 10:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A single loop that visits each of n items once runs in...', 'mcq',
        'Linear time, O(n).', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'O(1)', 0, 1),
(@qq, 'O(n)', 1, 2),
(@qq, 'O(n^2)', 0, 3),
(@qq, 'O(log n)', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Comparing every pair of elements in an array of n items with two nested loops is...', 'mcq',
        'About n^2/2 comparisons, i.e. O(n^2).', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'O(n)', 0, 1),
(@qq, 'O(n^2)', 1, 2),
(@qq, 'O(log n)', 0, 3),
(@qq, 'O(1)', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Writing `if (x = 0)` when you meant `if (x == 0)` is...', 'mcq',
        '`=` assigns 0 and the expression is 0 (false), so the branch never runs. A classic bug.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'the same thing', 0, 1),
(@qq, 'a bug: it assigns 0 and the condition is always false', 1, 2),
(@qq, 'a compile error', 0, 3),
(@qq, 'always true', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is usually the best first step when a program produces the wrong answer?', 'mcq',
        'Shrink the input to the smallest case that still fails - it makes the cause far easier to see.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Rewrite the whole program', 0, 1),
(@qq, 'Reproduce it with the smallest failing input', 1, 2),
(@qq, 'Add more features', 0, 3),
(@qq, 'Ignore it if it works on one input', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What do the `-Wall -Wextra` flags do for `gcc`?', 'mcq',
        'They turn on extra warnings that catch many common mistakes before you even run the program.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Enable extra compiler warnings', 1, 1),
(@qq, 'Optimise the code for speed', 0, 2),
(@qq, 'Link all libraries', 0, 3),
(@qq, 'Produce a smaller executable', 0, 4);

-- ===========================================================================
SELECT
  (SELECT COUNT(*) FROM module_quizzes mq JOIN modules m ON m.id = mq.module_id
     WHERE m.track_id = @c)                                                     AS quizzes,
  (SELECT COUNT(*) FROM module_quiz_questions qq
     JOIN module_quizzes mq ON mq.id = qq.quiz_id
     JOIN modules m ON m.id = mq.module_id WHERE m.track_id = @c)               AS questions,
  (SELECT COUNT(*) FROM module_quiz_options o
     JOIN module_quiz_questions qq ON qq.id = o.question_id
     JOIN module_quizzes mq ON mq.id = qq.quiz_id
     JOIN modules m ON m.id = mq.module_id WHERE m.track_id = @c)               AS options;
