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

export const pythonModules: Module[] = [
  {
    id: 1,
    title: "The Syntax Sanctuary",
    subtitle: "Python Basics",
    icon: "🏛️",
    color: "from-purple-600 to-purple-400",
    neonColor: "purple",
    questName: "Fix the Broken Inventory",
    questDescription: "Master Lists and Dictionaries to repair the ancient inventory system",
    xpRequired: 0,
    lessons: [
      {
        title: "Welcome to Python",
        content: `Python is your gateway to data science. It's readable, powerful, and beloved by data scientists worldwide.

**Why Python for Data Science?**
- Simple, readable syntax
- Massive ecosystem of libraries
- Strong community support
- Used by Google, Netflix, NASA`,
        codeExample: `# Your first Python code
message = "Welcome, Data Warrior!"
print(message)

# Variables can hold different types
name = "Hero"
level = 1
is_ready = True`,
        tips: ["Use meaningful variable names", "Python is case-sensitive", "Indentation matters in Python"]
      },
      {
        title: "Lists - Your Data Arsenal",
        content: `Lists are ordered collections that can hold any type of data. They're mutable, meaning you can change them after creation.

**Key Operations:**
- Create: \`my_list = [1, 2, 3]\`
- Access: \`my_list[0]\` → first element
- Append: \`my_list.append(4)\`
- Slice: \`my_list[1:3]\``,
        codeExample: `# Creating and manipulating lists
inventory = ["sword", "shield", "potion"]

# Add an item
inventory.append("map")

# Access items
first_item = inventory[0]  # "sword"

# List slicing
weapons = inventory[:2]  # ["sword", "shield"]

# Check length
total_items = len(inventory)  # 4`,
        tips: ["Lists are zero-indexed", "Negative indices count from the end", "Use list comprehensions for efficiency"]
      },
      {
        title: "Dictionaries - Key-Value Magic",
        content: `Dictionaries store data as key-value pairs. They're perfect for structured data like player stats or item properties.

**Key Operations:**
- Create: \`my_dict = {"key": "value"}\`
- Access: \`my_dict["key"]\`
- Add: \`my_dict["new_key"] = "new_value"\`
- Get safely: \`my_dict.get("key", default)\``,
        codeExample: `# Player stats dictionary
player = {
    "name": "DataKnight",
    "level": 5,
    "xp": 1250,
    "skills": ["Python", "SQL"]
}

# Access values
player_name = player["name"]

# Update values
player["level"] += 1

# Add new key
player["guild"] = "Data Warriors"

# Safe access with default
health = player.get("health", 100)`,
        tips: ["Keys must be immutable (strings, numbers, tuples)", "Use .get() to avoid KeyError", "Dictionaries are unordered before Python 3.7"]
      }
    ],
    challenges: [
      {
        id: "1-1",
        question: "What will `inventory[1]` return if `inventory = ['gold', 'silver', 'bronze']`?",
        options: ["'gold'", "'silver'", "'bronze'", "Error"],
        correctAnswer: 1,
        explanation: "Lists are zero-indexed, so index 1 returns the second element: 'silver'",
        xpReward: 50
      },
      {
        id: "1-2",
        question: "How do you add a new key-value pair to a dictionary?",
        options: ["dict.add('key', 'value')", "dict['key'] = 'value'", "dict.append('key': 'value')", "dict.insert('key', 'value')"],
        correctAnswer: 1,
        explanation: "Use bracket notation: dict['key'] = 'value' to add or update pairs",
        xpReward: 50
      },
      {
        id: "1-3",
        question: "What does `len(['a', 'b', 'c'])` return?",
        options: ["2", "3", "4", "'abc'"],
        correctAnswer: 1,
        explanation: "len() returns the number of elements in a list, which is 3",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code blocks to create a function that fixes the broken inventory by removing duplicates and sorting items:",
      codeBlocks: [
        "def fix_inventory(items):",
        "    unique_items = list(set(items))",
        "    unique_items.sort()",
        "    return unique_items"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "First define the function, convert to set for uniqueness, sort the list, then return it!",
      xpReward: 200
    }
  },
  {
    id: 2,
    title: "The Array Alchemist",
    subtitle: "NumPy Mastery",
    icon: "⚗️",
    color: "from-blue-600 to-cyan-400",
    neonColor: "cyan",
    questName: "Speed Up the Computation",
    questDescription: "Use vectorization to beat the timer and unlock the power of NumPy",
    xpRequired: 300,
    lessons: [
      {
        title: "Enter NumPy",
        content: `NumPy is the foundation of scientific computing in Python. It provides fast, efficient arrays and mathematical operations.

**Why NumPy?**
- 50x faster than Python lists for numerical operations
- Broadcasting for element-wise operations
- Essential for ML and data science`,
        codeExample: `import numpy as np

# Create arrays
arr = np.array([1, 2, 3, 4, 5])

# Array operations are vectorized
doubled = arr * 2  # [2, 4, 6, 8, 10]

# Mathematical functions
mean_val = np.mean(arr)  # 3.0
sum_val = np.sum(arr)    # 15`,
        tips: ["Always import as 'np'", "Arrays are homogeneous (same type)", "Vectorized operations are key to speed"]
      },
      {
        title: "Vectorization Magic",
        content: `Vectorization means operating on entire arrays at once instead of looping through elements. This is NumPy's superpower.

**The Speed Difference:**
- Loop: O(n) Python operations
- Vectorized: Single optimized C operation`,
        codeExample: `import numpy as np

# SLOW: Python loop
def slow_square(arr):
    result = []
    for x in arr:
        result.append(x ** 2)
    return result

# FAST: Vectorized
def fast_square(arr):
    return arr ** 2

# Example
data = np.arange(1000000)
result = fast_square(data)  # Instant!

# Element-wise operations
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
c = a + b  # [5, 7, 9]`,
        tips: ["Avoid loops when possible", "Use broadcasting for different shaped arrays", "Profile your code to see the difference"]
      },
      {
        title: "Array Reshaping & Slicing",
        content: `NumPy arrays can be reshaped and sliced in powerful ways. Master these to manipulate data efficiently.

**Key Concepts:**
- reshape(): Change array dimensions
- Slicing: Extract subsets of data
- Boolean indexing: Filter by condition`,
        codeExample: `import numpy as np

# Create and reshape
arr = np.arange(12)
matrix = arr.reshape(3, 4)

# Slicing
first_row = matrix[0, :]
first_col = matrix[:, 0]

# Boolean indexing
data = np.array([1, 5, 3, 8, 2])
big_values = data[data > 3]  # [5, 8]

# Fancy indexing
indices = [0, 2, 4]
selected = data[indices]  # [1, 3, 2]`,
        tips: ["reshape(-1, n) auto-calculates first dimension", "Boolean masks are incredibly powerful", "Views vs copies: be careful with memory"]
      }
    ],
    challenges: [
      {
        id: "2-1",
        question: "What is the result of `np.array([1, 2, 3]) * 2`?",
        options: ["[1, 2, 3, 1, 2, 3]", "[2, 4, 6]", "Error", "[1, 2, 3, 2]"],
        correctAnswer: 1,
        explanation: "NumPy performs element-wise multiplication, resulting in [2, 4, 6]",
        xpReward: 50
      },
      {
        id: "2-2",
        question: "Which is faster for numerical operations?",
        options: ["Python lists with loops", "NumPy vectorized operations", "Both are equal", "Depends on data size"],
        correctAnswer: 1,
        explanation: "NumPy vectorized operations are implemented in C and are significantly faster",
        xpReward: 50
      },
      {
        id: "2-3",
        question: "What does `np.arange(5)` create?",
        options: ["[1, 2, 3, 4, 5]", "[0, 1, 2, 3, 4]", "[0, 1, 2, 3, 4, 5]", "[5, 4, 3, 2, 1]"],
        correctAnswer: 1,
        explanation: "np.arange(5) creates array [0, 1, 2, 3, 4] - starts at 0, ends before 5",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to create a function that normalizes data (scales to 0-1 range) using vectorization:",
      codeBlocks: [
        "def normalize(data):",
        "    min_val = np.min(data)",
        "    max_val = np.max(data)",
        "    return (data - min_val) / (max_val - min_val)"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Normalize by subtracting min and dividing by range - all vectorized operations!",
      xpReward: 200
    }
  },
  {
    id: 3,
    title: "The Data Wrangler's Dungeon",
    subtitle: "Pandas Power",
    icon: "🐼",
    color: "from-emerald-600 to-green-400",
    neonColor: "green",
    questName: "Find the Hidden Insights",
    questDescription: "Master .groupby() and filtering to uncover secrets in messy CSV data",
    xpRequired: 600,
    lessons: [
      {
        title: "Meet Pandas",
        content: `Pandas is the Swiss Army knife for data manipulation. It provides DataFrames - powerful 2D data structures perfect for tabular data.

**Core Structures:**
- Series: 1D labeled array
- DataFrame: 2D labeled data structure`,
        codeExample: `import pandas as pd

# Create DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'score': [95, 87, 92],
    'grade': ['A', 'B', 'A']
})

# Read CSV
df = pd.read_csv('data.csv')

# Basic info
print(df.shape)      # (rows, cols)
print(df.columns)    # column names
print(df.head())     # first 5 rows`,
        tips: ["Import as 'pd'", "DataFrames are like Excel spreadsheets", "Always explore with .head() and .info()"]
      },
      {
        title: "Filtering & Selection",
        content: `Filtering data is a core skill. Pandas makes it intuitive with boolean indexing and query methods.

**Selection Methods:**
- \`df['column']\` - Select column
- \`df.loc[]\` - Label-based selection
- \`df.iloc[]\` - Integer-based selection`,
        codeExample: `import pandas as pd

# Boolean filtering
high_scores = df[df['score'] > 90]

# Multiple conditions
top_performers = df[(df['score'] > 90) & (df['grade'] == 'A')]

# Query method (more readable)
result = df.query("score > 90 and grade == 'A'")

# Select specific columns
names_only = df[['name', 'score']]

# loc for labels
first_row = df.loc[0]
specific = df.loc[0:2, 'name':'score']`,
        tips: ["Use & for AND, | for OR", "Wrap conditions in parentheses", "query() is great for complex conditions"]
      },
      {
        title: "GroupBy - Split-Apply-Combine",
        content: `GroupBy is one of Pandas' most powerful features. It lets you split data, apply functions, and combine results.

**The Pattern:**
1. Split data into groups
2. Apply a function to each group
3. Combine results`,
        codeExample: `import pandas as pd

# Sample sales data
sales = pd.DataFrame({
    'region': ['East', 'West', 'East', 'West'],
    'product': ['A', 'A', 'B', 'B'],
    'revenue': [100, 150, 200, 175]
})

# Group by single column
by_region = sales.groupby('region')['revenue'].sum()

# Multiple aggregations
summary = sales.groupby('region').agg({
    'revenue': ['sum', 'mean', 'count']
})

# Multiple grouping columns
detailed = sales.groupby(['region', 'product'])['revenue'].sum()

# Transform (same shape as input)
sales['pct_of_total'] = sales.groupby('region')['revenue'].transform(
    lambda x: x / x.sum() * 100
)`,
        tips: ["agg() for multiple aggregations", "transform() returns same-shaped output", "reset_index() to flatten results"]
      }
    ],
    challenges: [
      {
        id: "3-1",
        question: "Which method reads a CSV file into a DataFrame?",
        options: ["pd.open_csv()", "pd.read_csv()", "pd.load_csv()", "pd.import_csv()"],
        correctAnswer: 1,
        explanation: "pd.read_csv() is the standard method to read CSV files into a DataFrame",
        xpReward: 50
      },
      {
        id: "3-2",
        question: "How do you filter rows where column 'age' > 30?",
        options: ["df.filter(age > 30)", "df[df['age'] > 30]", "df.where('age' > 30)", "df.select(age > 30)"],
        correctAnswer: 1,
        explanation: "Boolean indexing with df[df['age'] > 30] filters the DataFrame",
        xpReward: 50
      },
      {
        id: "3-3",
        question: "What does groupby().sum() return?",
        options: ["A single number", "The original DataFrame", "Sum of each group", "Error"],
        correctAnswer: 2,
        explanation: "groupby().sum() returns the sum calculated for each group",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to find the top-selling product in each region:",
      codeBlocks: [
        "result = df.groupby('region')",
        ".apply(lambda x: x.nlargest(1, 'sales'))",
        ".reset_index(drop=True)"
      ],
      correctOrder: [0, 1, 2],
      explanation: "Group by region, find the largest sale in each, then clean up the index!",
      xpReward: 200
    }
  },
  {
    id: 4,
    title: "The Visionary's Vault",
    subtitle: "Data Visualization",
    icon: "🎨",
    color: "from-orange-600 to-yellow-400",
    neonColor: "orange",
    questName: "Reveal the Secret Path",
    questDescription: "Draw the correlation heatmap to unlock hidden patterns in your data",
    xpRequired: 900,
    lessons: [
      {
        title: "Matplotlib Foundations",
        content: `Matplotlib is the foundation of Python visualization. Most other libraries are built on top of it.

**Key Concepts:**
- Figure: The whole window
- Axes: Individual plots
- pyplot: Quick plotting interface`,
        codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Basic line plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)', color='blue')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
plt.show()

# Multiple subplots
fig, axes = plt.subplots(2, 2, figsize=(12, 8))
axes[0, 0].plot(x, y)
axes[0, 1].scatter(x[::10], y[::10])`,
        tips: ["Always set figure size", "Use subplots for multiple plots", "plt.tight_layout() fixes overlapping"]
      },
      {
        title: "Seaborn - Statistical Visualization",
        content: `Seaborn builds on Matplotlib with beautiful statistical plots and automatic styling.

**Popular Plots:**
- distplot/histplot: Distributions
- scatterplot: Relationships
- heatmap: Correlations
- boxplot: Comparisons`,
        codeExample: `import seaborn as sns
import pandas as pd

# Set style
sns.set_theme(style="darkgrid")

# Load sample data
tips = sns.load_dataset("tips")

# Distribution plot
sns.histplot(data=tips, x="total_bill", kde=True)

# Scatter with regression
sns.regplot(data=tips, x="total_bill", y="tip")

# Categorical comparison
sns.boxplot(data=tips, x="day", y="total_bill")

# Heatmap for correlations
corr = tips.select_dtypes('number').corr()
sns.heatmap(corr, annot=True, cmap='coolwarm')`,
        tips: ["set_theme() for consistent styling", "hue parameter adds color dimensions", "Use palettes for beautiful colors"]
      },
      {
        title: "Correlation Heatmaps",
        content: `Heatmaps visualize matrices of data. They're perfect for showing correlations between variables.

**Correlation Values:**
- 1: Perfect positive correlation
- 0: No correlation
- -1: Perfect negative correlation`,
        codeExample: `import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt

# Create correlation matrix
df = pd.DataFrame({
    'sales': [100, 120, 140, 180],
    'marketing': [50, 60, 70, 90],
    'customers': [200, 240, 280, 360]
})

corr_matrix = df.corr()

# Create heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(
    corr_matrix,
    annot=True,           # Show values
    cmap='RdYlBu_r',      # Color palette
    center=0,             # Center at 0
    square=True,          # Square cells
    linewidths=0.5,       # Cell borders
    fmt='.2f'             # 2 decimal places
)
plt.title('Correlation Heatmap')
plt.tight_layout()`,
        tips: ["center=0 makes interpretation easier", "annot=True shows correlation values", "Choose colormap based on data type"]
      }
    ],
    challenges: [
      {
        id: "4-1",
        question: "Which library provides heatmap() function?",
        options: ["matplotlib", "seaborn", "pandas", "numpy"],
        correctAnswer: 1,
        explanation: "Seaborn provides the heatmap() function for creating heat maps",
        xpReward: 50
      },
      {
        id: "4-2",
        question: "What does a correlation of -0.9 indicate?",
        options: ["Strong positive relationship", "No relationship", "Strong negative relationship", "Error in data"],
        correctAnswer: 2,
        explanation: "Values close to -1 indicate strong negative correlation",
        xpReward: 50
      },
      {
        id: "4-3",
        question: "How do you add labels to a matplotlib plot?",
        options: ["plt.label()", "plt.xlabel() and plt.ylabel()", "plt.add_labels()", "plot.labels()"],
        correctAnswer: 1,
        explanation: "Use plt.xlabel() and plt.ylabel() to add axis labels",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to create a correlation heatmap:",
      codeBlocks: [
        "corr = df.corr()",
        "plt.figure(figsize=(10, 8))",
        "sns.heatmap(corr, annot=True, cmap='coolwarm')",
        "plt.title('Correlation Matrix')"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Calculate correlation, set figure size, create heatmap, then add title!",
      xpReward: 200
    }
  },
  {
    id: 5,
    title: "The Grand Finale",
    subtitle: "EDA Project",
    icon: "🏆",
    color: "from-pink-600 to-rose-400",
    neonColor: "pink",
    questName: "The Ultimate Analysis",
    questDescription: "Combine all your skills in a complete Exploratory Data Analysis project",
    xpRequired: 1200,
    lessons: [
      {
        title: "EDA Framework",
        content: `Exploratory Data Analysis (EDA) is the process of understanding your data before modeling. Follow this framework:

**The EDA Checklist:**
1. Load & Inspect
2. Clean & Prepare
3. Analyze & Visualize
4. Document Insights`,
        codeExample: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Step 1: Load and Inspect
df = pd.read_csv('data.csv')
print(df.shape)
print(df.info())
print(df.describe())
print(df.head())

# Step 2: Check for issues
print(df.isnull().sum())
print(df.duplicated().sum())

# Step 3: Data types
print(df.dtypes)`,
        tips: ["Always start with .info() and .describe()", "Check for missing values early", "Document your findings as you go"]
      },
      {
        title: "Data Cleaning Pipeline",
        content: `Clean data is essential for accurate analysis. Build a systematic cleaning pipeline.

**Common Issues:**
- Missing values
- Duplicate rows
- Incorrect types
- Outliers`,
        codeExample: `import pandas as pd

def clean_data(df):
    # Make a copy
    df = df.copy()
    
    # Handle missing values
    df['numeric_col'].fillna(df['numeric_col'].median(), inplace=True)
    df['category_col'].fillna('Unknown', inplace=True)
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Fix data types
    df['date_col'] = pd.to_datetime(df['date_col'])
    df['category_col'] = df['category_col'].astype('category')
    
    # Handle outliers (IQR method)
    Q1 = df['value'].quantile(0.25)
    Q3 = df['value'].quantile(0.75)
    IQR = Q3 - Q1
    df = df[(df['value'] >= Q1 - 1.5*IQR) & 
            (df['value'] <= Q3 + 1.5*IQR)]
    
    return df`,
        tips: ["Always work on a copy", "Document why you remove data", "Consider domain knowledge for outliers"]
      },
      {
        title: "Complete EDA Report",
        content: `Put it all together in a comprehensive analysis. Tell a story with your data.

**Report Structure:**
1. Executive Summary
2. Data Description
3. Key Findings
4. Visualizations
5. Recommendations`,
        codeExample: `# Full EDA Template
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def full_eda(df):
    # 1. Overview
    print("="*50)
    print("DATASET OVERVIEW")
    print("="*50)
    print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")
    
    # 2. Distributions
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # Numeric distributions
    numeric_cols = df.select_dtypes('number').columns[:4]
    for i, col in enumerate(numeric_cols):
        ax = axes[i//2, i%2]
        sns.histplot(df[col], ax=ax, kde=True)
        ax.set_title(f'Distribution of {col}')
    
    plt.tight_layout()
    
    # 3. Correlations
    plt.figure(figsize=(10, 8))
    sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
    plt.title('Correlation Matrix')
    
    # 4. Key statistics
    print("\\nKEY STATISTICS:")
    print(df.describe())
    
    return df`,
        tips: ["Tell a story with your analysis", "Include actionable insights", "Make visualizations publication-ready"]
      }
    ],
    challenges: [
      {
        id: "5-1",
        question: "What's the first step in EDA?",
        options: ["Build a model", "Load and inspect the data", "Create visualizations", "Handle outliers"],
        correctAnswer: 1,
        explanation: "Always start by loading and inspecting your data to understand its structure",
        xpReward: 50
      },
      {
        id: "5-2",
        question: "Which method shows missing values per column?",
        options: ["df.missing()", "df.isnull().sum()", "df.na_count()", "df.check_null()"],
        correctAnswer: 1,
        explanation: "df.isnull().sum() counts missing values in each column",
        xpReward: 50
      },
      {
        id: "5-3",
        question: "What does IQR stand for in outlier detection?",
        options: ["Internal Quality Range", "Interquartile Range", "Indexed Query Result", "Integer Quantile Ratio"],
        correctAnswer: 1,
        explanation: "IQR (Interquartile Range) is Q3 - Q1, used to detect outliers",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the complete EDA pipeline:",
      codeBlocks: [
        "df = pd.read_csv('data.csv')",
        "df = clean_missing_values(df)",
        "summary_stats = df.describe()",
        "plot_distributions_and_correlations(df)"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Load data, clean it, compute statistics, then visualize! You've completed the journey!",
      xpReward: 300
    }
  }
];

export interface CourseProgress {
  currentLevel: number;
  totalXP: number;
  completedModules: number[];
  completedChallenges: string[];
  completedBossFights: number[];
}

export const getInitialProgress = (): CourseProgress => ({
  currentLevel: 1,
  totalXP: 0,
  completedModules: [],
  completedChallenges: [],
  completedBossFights: []
});

export const STORAGE_KEY = 'python_ds_course_progress';
