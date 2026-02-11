export interface Challenge {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    xpReward: number;
}

export interface LessonContent {
    title: string;
    content: string;
    codeExample?: string;
    tips?: string[];
}

export interface Module {
    id: number;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    neonColor: string;
    questName: string;
    questDescription: string;
    xpRequired: number;
    videoUrl?: string;
    lessons: LessonContent[];
    challenges: Challenge[];
    bossFight: {
        question: string;
        codeBlocks: string[];
        correctOrder: number[];
        explanation: string;
        xpReward: number;
    };
}

export const sqlModules: Module[] = [
    {
        id: 1,
        title: "Database Foundations",
        subtitle: "SQL Basics",
        icon: "🗄️",
        color: "from-blue-600 to-cyan-400",
        neonColor: "cyan",
        questName: "Query Your First Database",
        questDescription: "Master SELECT statements and basic filtering to retrieve data from tables",
        xpRequired: 0,
        videoUrl: "https://www.youtube.com/embed/HXV3zeQKqGY",
        lessons: [
            {
                title: "Introduction to Databases",
                content: `Databases are structured collections of data. SQL (Structured Query Language) is the universal language for working with relational databases.

**Why SQL?**
- Used by 90% of companies
- Works with MySQL, PostgreSQL, SQL Server, Oracle
- Essential for data analysis
- Powers web applications and analytics`,
                codeExample: `-- Your first SQL query
SELECT * FROM users;

-- Select specific columns
SELECT name, email FROM users;

-- Count rows
SELECT COUNT(*) FROM users;`,
                tips: ["SQL keywords are case-insensitive (SELECT = select)", "End statements with semicolon", "Use * sparingly - select only needed columns"]
            },
            {
                title: "SELECT Statement Basics",
                content: `The SELECT statement retrieves data from database tables. It's the most fundamental SQL command.

**Basic Syntax:**
- SELECT columns FROM table
- Use * to select all columns
- Separate multiple columns with commas`,
                codeExample: `-- Select all columns
SELECT * FROM products;

-- Select specific columns
SELECT product_name, price, category 
FROM products;

-- Select with column alias
SELECT 
    product_name AS name,
    price AS cost,
    category AS type
FROM products;`,
                tips: ["Use aliases (AS) for readable column names", "Format queries for readability", "Comments start with -- or /* */"]
            },
            {
                title: "Filtering with WHERE",
                content: `The WHERE clause filters rows based on conditions. Only rows matching the condition are returned.

**Common Operators:**
- = (equals)
- <, >, <=, >= (comparisons)
- <> or != (not equal)
- BETWEEN, IN, LIKE`,
                codeExample: `-- Simple filter
SELECT * FROM products 
WHERE price > 100;

-- Multiple conditions with AND
SELECT * FROM products 
WHERE price > 100 AND category = 'Electronics';

-- Multiple conditions with OR
SELECT * FROM products 
WHERE category = 'Electronics' OR category = 'Computers';

-- IN operator
SELECT * FROM products 
WHERE category IN ('Electronics', 'Computers', 'Gaming');

-- BETWEEN operator
SELECT * FROM products 
WHERE price BETWEEN 50 AND 200;`,
                tips: ["Use AND for all conditions to be true", "Use OR for any condition to be true", "Parentheses control condition order"]
            }
        ],
        challenges: [
            {
                id: "sql-1-1",
                question: "Which SQL keyword retrieves data from a database?",
                options: ["GET", "SELECT", "FETCH", "RETRIEVE"],
                correctAnswer: 1,
                explanation: "SELECT is the fundamental SQL keyword for querying data from tables",
                xpReward: 50
            },
            {
                id: "sql-1-2",
                question: "What does the WHERE clause do?",
                options: ["Sorts results", "Filters rows", "Joins tables", "Groups data"],
                correctAnswer: 1,
                explanation: "WHERE filters rows based on specified conditions",
                xpReward: 50
            },
            {
                id: "sql-1-3",
                question: "Which operator checks if a value is in a list?",
                options: ["CONTAINS", "IN", "HAS", "INCLUDES"],
                correctAnswer: 1,
                explanation: "The IN operator checks if a value matches any value in a list",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the SQL query to find all products in Electronics category priced over $100:",
            codeBlocks: [
                "SELECT product_name, price",
                "FROM products",
                "WHERE category = 'Electronics'",
                "AND price > 100;"
            ],
            correctOrder: [0, 1, 2, 3],
            explanation: "SELECT columns, FROM table, then filter with WHERE conditions!",
            xpReward: 200
        }
    },
    {
        id: 2,
        title: "Data Sorting & Aggregation",
        subtitle: "ORDER BY & GROUP BY",
        icon: "📊",
        color: "from-green-600 to-emerald-400",
        neonColor: "green",
        questName: "Analyze Sales Data",
        questDescription: "Use aggregate functions and grouping to calculate totals, averages, and statistics",
        xpRequired: 250,
        videoUrl: "https://www.youtube.com/embed/7mz73uXD9DA",
        lessons: [
            {
                title: "Sorting with ORDER BY",
                content: `ORDER BY sorts query results by one or more columns. Control the sort direction with ASC (ascending) or DESC (descending).

**Key Concepts:**
- Default is ascending (ASC)
- Can sort by multiple columns
- NULL values sort first or last`,
                codeExample: `-- Sort by single column
SELECT * FROM products 
ORDER BY price DESC;

-- Sort by multiple columns
SELECT * FROM products 
ORDER BY category ASC, price DESC;

-- Sort by column position
SELECT product_name, price 
FROM products 
ORDER BY 2 DESC;  -- Sort by 2nd column (price)

-- Sort with LIMIT
SELECT * FROM products 
ORDER BY price DESC 
LIMIT 10;  -- Top 10 most expensive`,
                tips: ["DESC for descending, ASC for ascending", "Multiple columns create nested sorting", "LIMIT restricts number of results"]
            },
            {
                title: "Aggregate Functions",
                content: `Aggregate functions perform calculations on sets of rows and return a single value.

**Common Functions:**
- COUNT(): Count rows
- SUM(): Total of values
- AVG(): Average value
- MIN(), MAX(): Minimum/maximum
- GROUP_CONCAT(): Concatenate values`,
                codeExample: `-- Count all products
SELECT COUNT(*) AS total_products 
FROM products;

-- Sum of prices
SELECT SUM(price) AS total_value 
FROM products;

-- Average price
SELECT AVG(price) AS avg_price 
FROM products;

-- Min and max
SELECT 
    MIN(price) AS cheapest,
    MAX(price) AS most_expensive
FROM products;

-- Multiple aggregates
SELECT 
    COUNT(*) AS count,
    AVG(price) AS avg_price,
    SUM(price) AS total_value
FROM products;`,
                tips: ["COUNT(*) counts all rows including NULLs", "COUNT(column) excludes NULL values", "Use aliases for readable results"]
            },
            {
                title: "Grouping with GROUP BY",
                content: `GROUP BY groups rows with the same values into summary rows. Combine with aggregate functions for powerful analysis.

**The Pattern:**
1. SELECT columns and aggregates
2. FROM table
3. WHERE filters (before grouping)
4. GROUP BY columns
5. HAVING filters (after grouping)`,
                codeExample: `-- Group by single column
SELECT category, COUNT(*) AS product_count
FROM products
GROUP BY category;

-- Group with multiple aggregates
SELECT 
    category,
    COUNT(*) AS count,
    AVG(price) AS avg_price,
    SUM(price) AS total_value
FROM products
GROUP BY category;

-- Group by multiple columns
SELECT 
    category,
    brand,
    COUNT(*) AS count
FROM products
GROUP BY category, brand;

-- Filter groups with HAVING
SELECT 
    category,
    COUNT(*) AS count
FROM products
GROUP BY category
HAVING COUNT(*) > 10;`,
                tips: ["All non-aggregate columns must be in GROUP BY", "WHERE filters before grouping", "HAVING filters after grouping"]
            }
        ],
        challenges: [
            {
                id: "sql-2-1",
                question: "Which clause sorts query results?",
                options: ["SORT BY", "ORDER BY", "ARRANGE BY", "RANK BY"],
                correctAnswer: 1,
                explanation: "ORDER BY sorts results in ascending or descending order",
                xpReward: 50
            },
            {
                id: "sql-2-2",
                question: "What does COUNT(*) return?",
                options: ["Sum of values", "Average value", "Number of rows", "Maximum value"],
                correctAnswer: 2,
                explanation: "COUNT(*) returns the total number of rows in the result set",
                xpReward: 50
            },
            {
                id: "sql-2-3",
                question: "What's the difference between WHERE and HAVING?",
                options: ["No difference", "WHERE filters rows, HAVING filters groups", "HAVING is faster", "WHERE is deprecated"],
                correctAnswer: 1,
                explanation: "WHERE filters individual rows before grouping, HAVING filters groups after aggregation",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the query to find categories with more than 5 products and their average price:",
            codeBlocks: [
                "SELECT category, COUNT(*) AS count, AVG(price) AS avg_price",
                "FROM products",
                "GROUP BY category",
                "HAVING COUNT(*) > 5",
                "ORDER BY avg_price DESC;"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "SELECT with aggregates, FROM table, GROUP BY, filter groups with HAVING, then ORDER BY!",
            xpReward: 200
        }
    },
    {
        id: 3,
        title: "Joining Tables",
        subtitle: "Relational Power",
        icon: "🔗",
        color: "from-purple-600 to-pink-400",
        neonColor: "purple",
        questName: "Connect Related Data",
        questDescription: "Master INNER JOIN, LEFT JOIN, and other joins to combine data from multiple tables",
        xpRequired: 500,
        videoUrl: "https://www.youtube.com/embed/9yeOJ0ZMUYw",
        lessons: [
            {
                title: "Understanding Relationships",
                content: `Relational databases store data across multiple related tables. Joins combine rows from two or more tables based on related columns.

**Why Multiple Tables?**
- Reduce data duplication
- Maintain data integrity
- Organize data logically
- Improve query performance

**Relationship Types:**
- One-to-Many (most common)
- Many-to-Many (requires junction table)
- One-to-One (rare)`,
                codeExample: `-- Example schema
-- customers table: id, name, email
-- orders table: id, customer_id, order_date, total

-- Primary Key: Unique identifier (id)
-- Foreign Key: References another table (customer_id)

-- Visual relationship:
-- customers.id ←→ orders.customer_id`,
                tips: ["Primary keys uniquely identify rows", "Foreign keys create relationships", "Draw diagrams to understand relationships"]
            },
            {
                title: "INNER JOIN",
                content: `INNER JOIN returns only rows where there's a match in both tables. It's the most common join type.

**Syntax:**
SELECT columns
FROM table1
INNER JOIN table2 ON table1.key = table2.key

**Result:** Only matching rows from both tables`,
                codeExample: `-- Join customers and orders
SELECT 
    customers.name,
    customers.email,
    orders.order_date,
    orders.total
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;

-- Using table aliases (cleaner)
SELECT 
    c.name,
    c.email,
    o.order_date,
    o.total
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;

-- Multiple joins
SELECT 
    c.name,
    o.order_date,
    p.product_name,
    oi.quantity
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;`,
                tips: ["Use table aliases for readability", "INNER JOIN can be written as just JOIN", "Only returns rows with matches in both tables"]
            },
            {
                title: "LEFT JOIN & Other Joins",
                content: `LEFT JOIN returns all rows from the left table and matching rows from the right table. NULL for non-matches.

**Join Types:**
- INNER JOIN: Only matches
- LEFT JOIN: All from left + matches from right
- RIGHT JOIN: All from right + matches from left
- FULL OUTER JOIN: All rows from both tables`,
                codeExample: `-- LEFT JOIN: All customers, even without orders
SELECT 
    c.name,
    c.email,
    o.order_date,
    o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;

-- Find customers with NO orders
SELECT 
    c.name,
    c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- RIGHT JOIN (less common)
SELECT 
    c.name,
    o.order_date
FROM customers c
RIGHT JOIN orders o ON c.id = o.customer_id;

-- Self join (compare rows in same table)
SELECT 
    e1.name AS employee,
    e2.name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;`,
                tips: ["LEFT JOIN keeps all rows from first table", "Use WHERE column IS NULL to find non-matches", "Self joins compare rows within same table"]
            }
        ],
        challenges: [
            {
                id: "sql-3-1",
                question: "What does INNER JOIN return?",
                options: ["All rows from both tables", "Only matching rows from both tables", "All rows from left table", "Random rows"],
                correctAnswer: 1,
                explanation: "INNER JOIN returns only rows where there's a match in both tables",
                xpReward: 50
            },
            {
                id: "sql-3-2",
                question: "What's the difference between INNER JOIN and LEFT JOIN?",
                options: ["No difference", "LEFT JOIN includes non-matching rows from left table", "LEFT JOIN is faster", "INNER JOIN is deprecated"],
                correctAnswer: 1,
                explanation: "LEFT JOIN returns all rows from the left table, with NULL for non-matching right table rows",
                xpReward: 50
            },
            {
                id: "sql-3-3",
                question: "What connects tables in a JOIN?",
                options: ["Primary keys only", "Foreign keys only", "Related columns (often PK-FK)", "Table names"],
                correctAnswer: 2,
                explanation: "Joins connect tables using related columns, typically primary key to foreign key relationships",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the query to find all customers and their order totals (including customers with no orders):",
            codeBlocks: [
                "SELECT c.name, c.email, SUM(o.total) AS total_spent",
                "FROM customers c",
                "LEFT JOIN orders o ON c.id = o.customer_id",
                "GROUP BY c.id, c.name, c.email",
                "ORDER BY total_spent DESC;"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "SELECT with aggregate, FROM customers, LEFT JOIN orders, GROUP BY customer, ORDER BY total!",
            xpReward: 200
        }
    },
    {
        id: 4,
        title: "Advanced Queries",
        subtitle: "Subqueries & CTEs",
        icon: "🎯",
        color: "from-red-600 to-orange-400",
        neonColor: "red",
        questName: "Master Complex Queries",
        questDescription: "Use subqueries, CTEs, and window functions for advanced data analysis",
        xpRequired: 750,
        videoUrl: "https://www.youtube.com/embed/m1KcNV-Zhmc",
        lessons: [
            {
                title: "Subqueries",
                content: `A subquery is a query nested inside another query. Use them to break complex problems into steps.

**Types:**
- Scalar subquery: Returns single value
- Row subquery: Returns single row
- Table subquery: Returns multiple rows
- Correlated subquery: References outer query`,
                codeExample: `-- Scalar subquery (single value)
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- IN subquery (multiple values)
SELECT name
FROM customers
WHERE id IN (
    SELECT customer_id 
    FROM orders 
    WHERE total > 1000
);

-- EXISTS subquery (check existence)
SELECT name
FROM customers c
WHERE EXISTS (
    SELECT 1 
    FROM orders o 
    WHERE o.customer_id = c.id
);

-- Subquery in FROM clause
SELECT category, avg_price
FROM (
    SELECT category, AVG(price) AS avg_price
    FROM products
    GROUP BY category
) AS category_stats
WHERE avg_price > 100;`,
                tips: ["Use subqueries to break complex logic into steps", "EXISTS is often faster than IN", "Subqueries in FROM need aliases"]
            },
            {
                title: "Common Table Expressions (CTEs)",
                content: `CTEs (WITH clause) create temporary named result sets. They make complex queries more readable and maintainable.

**Benefits:**
- Improved readability
- Reusable within query
- Easier debugging
- Support recursion`,
                codeExample: `-- Basic CTE
WITH high_value_products AS (
    SELECT * 
    FROM products 
    WHERE price > 500
)
SELECT category, COUNT(*) AS count
FROM high_value_products
GROUP BY category;

-- Multiple CTEs
WITH 
    product_stats AS (
        SELECT 
            category,
            AVG(price) AS avg_price,
            COUNT(*) AS count
        FROM products
        GROUP BY category
    ),
    customer_stats AS (
        SELECT 
            COUNT(*) AS total_customers,
            AVG(total_orders) AS avg_orders
        FROM (
            SELECT customer_id, COUNT(*) AS total_orders
            FROM orders
            GROUP BY customer_id
        ) AS t
    )
SELECT * FROM product_stats, customer_stats;

-- Recursive CTE (organizational hierarchy)
WITH RECURSIVE employee_hierarchy AS (
    -- Base case
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy;`,
                tips: ["CTEs are defined with WITH keyword", "Multiple CTEs separated by commas", "Recursive CTEs need RECURSIVE keyword"]
            },
            {
                title: "Window Functions",
                content: `Window functions perform calculations across rows related to the current row. Unlike GROUP BY, they don't collapse rows.

**Common Functions:**
- ROW_NUMBER(): Sequential number
- RANK(): Rank with gaps
- DENSE_RANK(): Rank without gaps
- LAG(), LEAD(): Previous/next row
- SUM(), AVG() OVER: Running totals`,
                codeExample: `-- Row number
SELECT 
    name,
    price,
    ROW_NUMBER() OVER (ORDER BY price DESC) AS row_num
FROM products;

-- Rank by category
SELECT 
    name,
    category,
    price,
    RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rank_in_category
FROM products;

-- Running total
SELECT 
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Compare with previous row
SELECT 
    order_date,
    total,
    LAG(total) OVER (ORDER BY order_date) AS previous_total,
    total - LAG(total) OVER (ORDER BY order_date) AS difference
FROM orders;

-- Moving average
SELECT 
    order_date,
    total,
    AVG(total) OVER (
        ORDER BY order_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7_days
FROM orders;`,
                tips: ["PARTITION BY creates groups within window", "ORDER BY determines row order", "ROWS/RANGE defines window frame"]
            }
        ],
        challenges: [
            {
                id: "sql-4-1",
                question: "What is a subquery?",
                options: ["A query that runs faster", "A query nested inside another query", "A query with multiple tables", "A query without WHERE"],
                correctAnswer: 1,
                explanation: "A subquery is a query nested inside another SQL query",
                xpReward: 50
            },
            {
                id: "sql-4-2",
                question: "What does WITH keyword create?",
                options: ["A new table", "A Common Table Expression (CTE)", "A view", "An index"],
                correctAnswer: 1,
                explanation: "WITH creates a Common Table Expression, a temporary named result set",
                xpReward: 50
            },
            {
                id: "sql-4-3",
                question: "How do window functions differ from GROUP BY?",
                options: ["They're the same", "Window functions don't collapse rows", "Window functions are faster", "GROUP BY is deprecated"],
                correctAnswer: 1,
                explanation: "Window functions perform calculations without collapsing rows like GROUP BY does",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the CTE query to find products priced above their category average:",
            codeBlocks: [
                "WITH category_averages AS (",
                "    SELECT category, AVG(price) AS avg_price",
                "    FROM products GROUP BY category",
                ")",
                "SELECT p.name, p.price, p.category, ca.avg_price",
                "FROM products p",
                "JOIN category_averages ca ON p.category = ca.category",
                "WHERE p.price > ca.avg_price;"
            ],
            correctOrder: [0, 1, 2, 3, 4, 5, 6, 7],
            explanation: "Define CTE with category averages, then join and filter products above their category average!",
            xpReward: 200
        }
    },
    {
        id: 5,
        title: "Data Modification & Optimization",
        subtitle: "INSERT, UPDATE, DELETE",
        icon: "⚡",
        color: "from-yellow-600 to-amber-400",
        neonColor: "yellow",
        questName: "Manage Database Data",
        questDescription: "Learn to insert, update, and delete data while optimizing query performance",
        xpRequired: 1000,
        videoUrl: "https://www.youtube.com/embed/Cz3WcZLRaWc",
        lessons: [
            {
                title: "Inserting Data",
                content: `INSERT adds new rows to tables. You can insert single rows, multiple rows, or data from other tables.

**Syntax Variations:**
- INSERT INTO table VALUES (...)
- INSERT INTO table (columns) VALUES (...)
- INSERT INTO table SELECT ...`,
                codeExample: `-- Insert single row
INSERT INTO products (name, price, category)
VALUES ('Laptop', 999.99, 'Electronics');

-- Insert multiple rows
INSERT INTO products (name, price, category)
VALUES 
    ('Mouse', 29.99, 'Electronics'),
    ('Keyboard', 79.99, 'Electronics'),
    ('Monitor', 299.99, 'Electronics');

-- Insert from SELECT
INSERT INTO archived_orders (order_id, customer_id, order_date, total)
SELECT id, customer_id, order_date, total
FROM orders
WHERE order_date < '2023-01-01';

-- Insert with default values
INSERT INTO products (name, category)
VALUES ('New Product', 'Electronics');
-- price will use default value or NULL`,
                tips: ["Specify column names for clarity", "Use multiple VALUES for batch inserts", "Check constraints before inserting"]
            },
            {
                title: "Updating & Deleting Data",
                content: `UPDATE modifies existing rows. DELETE removes rows. Both use WHERE to target specific rows.

**Critical:** Always use WHERE clause or you'll affect ALL rows!`,
                codeExample: `-- Update single column
UPDATE products
SET price = 899.99
WHERE name = 'Laptop';

-- Update multiple columns
UPDATE products
SET 
    price = price * 1.1,
    updated_at = CURRENT_TIMESTAMP
WHERE category = 'Electronics';

-- Update with subquery
UPDATE products
SET price = (
    SELECT AVG(price) 
    FROM products p2 
    WHERE p2.category = products.category
)
WHERE price IS NULL;

-- Delete specific rows
DELETE FROM orders
WHERE order_date < '2022-01-01';

-- Delete with JOIN (some databases)
DELETE o
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
WHERE c.status = 'inactive';

-- Truncate (fast delete all)
TRUNCATE TABLE temp_data;`,
                tips: ["ALWAYS test UPDATE/DELETE with SELECT first", "Use transactions for safety", "TRUNCATE is faster than DELETE for all rows"]
            },
            {
                title: "Query Optimization",
                content: `Optimize queries for better performance. Use indexes, analyze execution plans, and write efficient SQL.

**Optimization Techniques:**
- Create indexes on frequently queried columns
- Avoid SELECT *
- Use EXPLAIN to analyze queries
- Limit result sets
- Optimize JOIN conditions`,
                codeExample: `-- Create index
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Analyze query execution
EXPLAIN SELECT * FROM products WHERE category = 'Electronics';

-- Inefficient query
SELECT * FROM orders o
WHERE o.customer_id IN (
    SELECT id FROM customers WHERE status = 'active'
);

-- Optimized with JOIN
SELECT o.*
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
WHERE c.status = 'active';

-- Use LIMIT for large results
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 100;

-- Avoid functions on indexed columns
-- BAD: WHERE YEAR(order_date) = 2023
-- GOOD: WHERE order_date >= '2023-01-01' AND order_date < '2024-01-01'

-- Use covering indexes
CREATE INDEX idx_products_category_price ON products(category, price);
SELECT category, price FROM products WHERE category = 'Electronics';`,
                tips: ["Index columns used in WHERE, JOIN, ORDER BY", "Too many indexes slow down writes", "EXPLAIN shows query execution plan"]
            }
        ],
        challenges: [
            {
                id: "sql-5-1",
                question: "What happens if you UPDATE without WHERE clause?",
                options: ["Error occurs", "Nothing happens", "All rows are updated", "Only first row updates"],
                correctAnswer: 2,
                explanation: "Without WHERE, UPDATE affects ALL rows in the table - very dangerous!",
                xpReward: 50
            },
            {
                id: "sql-5-2",
                question: "What is the purpose of an index?",
                options: ["Store more data", "Speed up queries", "Backup data", "Encrypt data"],
                correctAnswer: 1,
                explanation: "Indexes speed up data retrieval by creating efficient lookup structures",
                xpReward: 50
            },
            {
                id: "sql-5-3",
                question: "Which is faster for deleting all rows?",
                options: ["DELETE FROM table", "TRUNCATE TABLE", "DROP TABLE", "They're equal"],
                correctAnswer: 1,
                explanation: "TRUNCATE is much faster as it doesn't log individual row deletions",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the safe UPDATE query with transaction to increase prices by 10% for Electronics:",
            codeBlocks: [
                "BEGIN TRANSACTION;",
                "UPDATE products",
                "SET price = price * 1.10",
                "WHERE category = 'Electronics';",
                "-- Review changes, then:",
                "COMMIT;  -- or ROLLBACK;"
            ],
            correctOrder: [0, 1, 2, 3, 4, 5],
            explanation: "Start transaction, UPDATE with WHERE clause, review, then COMMIT or ROLLBACK for safety!",
            xpReward: 200
        }
    }
];

export interface CourseProgress {
    currentLevel: number;
    totalXP: number;
    completedModules: number[];
    completedChallenges: string[];
    completedBossFights: number[];
    completedVideos: number[];
}

export const getInitialProgress = (): CourseProgress => ({
    currentLevel: 1,
    totalXP: 0,
    completedModules: [],
    completedChallenges: [],
    completedBossFights: [],
    completedVideos: []
});

export const SQL_STORAGE_KEY = 'sql_course_progress';
