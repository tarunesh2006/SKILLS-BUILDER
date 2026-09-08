-- ============================================================================
--  Seed data: the 8 tracks + a little sample content and one sample test.
--  Users (admin + students) are seeded separately with hashed passwords by
--  `backend/scripts/seed.js` (run `npm run seed` in backend/).
-- ============================================================================
USE learning_platform;

INSERT INTO tracks (slug, title, description, kind, judge_language, sort_order) VALUES
  ('c',          'C Programming',        'Fundamentals of C: types, pointers, memory, standard library.', 'coding',     'c',      1),
  ('cpp',        'C++ Programming',      'C++ core language, STL, RAII, and object-oriented design.',      'coding',     'c++',    2),
  ('java',       'Java Programming',     'Java syntax, OOP, collections, exceptions, and the JVM.',        'coding',     'java',   3),
  ('python',     'Python Programming',   'Python basics, data structures, functions, and the stdlib.',     'coding',     'python', 4),
  ('mysql',      'MySQL',                'Relational modelling, SQL queries, joins, indexing.',            'non_coding', NULL,     5),
  ('mongodb',    'MongoDB',              'Document model, CRUD, aggregation pipeline, indexing.',          'non_coding', NULL,     6),
  ('react',      'React',                'Components, props, state, hooks, and rendering.',                'non_coding', NULL,     7),
  ('networking', 'Networking',           'OSI/TCP-IP model, addressing, routing, and switching.',          'non_coding', NULL,     8);

-- --- Sample content for the Python track ------------------------------------
INSERT INTO modules (track_id, title, summary, sort_order)
SELECT id, 'Getting Started with Python', 'Running Python, variables, and basic I/O.', 1 FROM tracks WHERE slug = 'python';
INSERT INTO modules (track_id, title, summary, sort_order)
SELECT id, 'Control Flow', 'Conditionals and loops.', 2 FROM tracks WHERE slug = 'python';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT m.id, 'Hello, World',
'# Hello, World

Every Python program can print to standard output with `print`:

```python
print("Hello, World")
```

Run it and you will see the text on its own line.', 1
FROM modules m JOIN tracks t ON t.id = m.track_id
WHERE t.slug = 'python' AND m.title = 'Getting Started with Python';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT m.id, 'Reading Input',
'# Reading Input

Use `input()` to read a line from standard input:

```python
name = input()
print(f"Hello, {name}")
```', 2
FROM modules m JOIN tracks t ON t.id = m.track_id
WHERE t.slug = 'python' AND m.title = 'Getting Started with Python';

-- --- Sample content for the Networking track --------------------------------
INSERT INTO modules (track_id, title, summary, sort_order)
SELECT id, 'The OSI Model', 'Seven layers and what each one does.', 1 FROM tracks WHERE slug = 'networking';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT m.id, 'Layers 1–4',
'# The Lower Layers

| Layer | Name | Example |
|-------|------|---------|
| 1 | Physical | cables, radio |
| 2 | Data Link | Ethernet, MAC |
| 3 | Network | IP, routing |
| 4 | Transport | TCP, UDP |', 1
FROM modules m JOIN tracks t ON t.id = m.track_id
WHERE t.slug = 'networking' AND m.title = 'The OSI Model';
