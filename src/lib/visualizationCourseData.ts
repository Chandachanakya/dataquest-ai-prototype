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

export const visualizationModules: Module[] = [
    {
        id: 1,
        title: "Chart Fundamentals",
        subtitle: "Matplotlib Basics",
        icon: "📊",
        color: "from-blue-600 to-blue-400",
        neonColor: "blue",
        questName: "Create Your First Plot",
        questDescription: "Master the basics of Matplotlib to create stunning line and scatter plots",
        xpRequired: 0,
        lessons: [
            {
                title: "Introduction to Matplotlib",
                content: `Matplotlib is the foundation of data visualization in Python. It provides complete control over every aspect of your plots.

**Why Matplotlib?**
- Industry standard for Python visualization
- Highly customizable
- Works seamlessly with NumPy and Pandas
- Foundation for other viz libraries`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Create simple line plot
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y)
plt.xlabel('X Values')
plt.ylabel('Y Values')
plt.title('My First Plot')
plt.show()`,
                tips: ["Always import as 'plt'", "Use plt.show() to display plots", "Set labels and titles for clarity"]
            },
            {
                title: "Line Plots & Customization",
                content: `Line plots are perfect for showing trends over time or continuous data. Matplotlib gives you full control over styling.

**Key Parameters:**
- color: Line color
- linestyle: Solid, dashed, dotted
- linewidth: Thickness
- marker: Point markers`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y1, color='blue', linestyle='-', linewidth=2, label='sin(x)')
plt.plot(x, y2, color='red', linestyle='--', linewidth=2, label='cos(x)')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Sine and Cosine Waves')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`,
                tips: ["Use figsize to control plot dimensions", "legend() shows which line is which", "grid() improves readability"]
            },
            {
                title: "Scatter Plots",
                content: `Scatter plots show relationships between two variables. Each point represents an observation.

**When to Use:**
- Exploring correlations
- Identifying clusters
- Detecting outliers`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Generate random data
np.random.seed(42)
x = np.random.randn(100)
y = 2 * x + np.random.randn(100) * 0.5

plt.figure(figsize=(8, 6))
plt.scatter(x, y, c='purple', alpha=0.6, s=50)
plt.xlabel('Variable X')
plt.ylabel('Variable Y')
plt.title('Scatter Plot: X vs Y')
plt.grid(True, alpha=0.3)
plt.show()`,
                tips: ["Use 'alpha' for transparency", "'s' controls point size", "'c' sets color"]
            }
        ],
        challenges: [
            {
                id: "viz-1-1",
                question: "Which function creates a line plot in Matplotlib?",
                options: ["plt.line()", "plt.plot()", "plt.draw()", "plt.create()"],
                correctAnswer: 1,
                explanation: "plt.plot() is the standard function for creating line plots",
                xpReward: 50
            },
            {
                id: "viz-1-2",
                question: "What parameter controls the transparency of plot elements?",
                options: ["opacity", "alpha", "transparent", "visibility"],
                correctAnswer: 1,
                explanation: "The 'alpha' parameter controls transparency (0=transparent, 1=opaque)",
                xpReward: 50
            },
            {
                id: "viz-1-3",
                question: "How do you add a legend to a plot?",
                options: ["plt.add_legend()", "plt.legend()", "plt.show_legend()", "plt.label()"],
                correctAnswer: 1,
                explanation: "plt.legend() displays the legend based on labels in plot() calls",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a customized line plot with labels and legend:",
            codeBlocks: [
                "plt.figure(figsize=(10, 6))",
                "plt.plot(x, y, color='blue', label='Data')",
                "plt.xlabel('Time')",
                "plt.ylabel('Value')",
                "plt.legend()",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4, 5],
            explanation: "Create figure, plot data with label, add axis labels, show legend, then display!",
            xpReward: 200
        }
    },
    {
        id: 2,
        title: "Bar Charts & Histograms",
        subtitle: "Categorical Data",
        icon: "📈",
        color: "from-green-600 to-emerald-400",
        neonColor: "green",
        questName: "Compare Categories",
        questDescription: "Use bar charts and histograms to visualize categorical and distribution data",
        xpRequired: 250,
        lessons: [
            {
                title: "Bar Charts Basics",
                content: `Bar charts compare quantities across categories. They're one of the most common chart types.

**Types:**
- Vertical bars: plt.bar()
- Horizontal bars: plt.barh()
- Grouped bars: Multiple bar() calls
- Stacked bars: bottom parameter`,
                codeExample: `import matplotlib.pyplot as plt

categories = ['Python', 'JavaScript', 'Java', 'C++']
values = [85, 72, 68, 55]

plt.figure(figsize=(10, 6))
plt.bar(categories, values, color='steelblue', alpha=0.8)
plt.xlabel('Programming Language')
plt.ylabel('Popularity Score')
plt.title('Language Popularity')
plt.ylim(0, 100)
plt.show()`,
                tips: ["Set ylim() to start at 0 for fair comparison", "Use color to highlight important bars", "Horizontal bars work better for long labels"]
            },
            {
                title: "Histograms for Distributions",
                content: `Histograms show the distribution of numerical data by grouping values into bins.

**Key Concepts:**
- Bins: Ranges that group data
- Frequency: Count in each bin
- Shape: Normal, skewed, bimodal`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Generate random data
data = np.random.normal(100, 15, 1000)

plt.figure(figsize=(10, 6))
plt.hist(data, bins=30, color='coral', alpha=0.7, edgecolor='black')
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.title('Distribution of Data')
plt.axvline(data.mean(), color='red', linestyle='--', label='Mean')
plt.legend()
plt.show()`,
                tips: ["More bins = more detail, fewer bins = clearer pattern", "Add mean/median lines for context", "edgecolor makes bins distinct"]
            },
            {
                title: "Grouped & Stacked Bars",
                content: `Compare multiple categories across groups with grouped or stacked bar charts.

**Use Cases:**
- Grouped: Compare side-by-side
- Stacked: Show composition`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

categories = ['Q1', 'Q2', 'Q3', 'Q4']
product_a = [20, 35, 30, 35]
product_b = [25, 32, 34, 20]

x = np.arange(len(categories))
width = 0.35

fig, ax = plt.subplots(figsize=(10, 6))
ax.bar(x - width/2, product_a, width, label='Product A', color='skyblue')
ax.bar(x + width/2, product_b, width, label='Product B', color='lightcoral')

ax.set_xlabel('Quarter')
ax.set_ylabel('Sales')
ax.set_title('Quarterly Sales Comparison')
ax.set_xticks(x)
ax.set_xticks_labels(categories)
ax.legend()
plt.show()`,
                tips: ["Use width to control bar thickness", "Offset x positions for grouped bars", "Keep color scheme consistent"]
            }
        ],
        challenges: [
            {
                id: "viz-2-1",
                question: "Which function creates a histogram?",
                options: ["plt.bar()", "plt.hist()", "plt.distribution()", "plt.frequency()"],
                correctAnswer: 1,
                explanation: "plt.hist() creates histograms to show data distributions",
                xpReward: 50
            },
            {
                id: "viz-2-2",
                question: "What does the 'bins' parameter control in a histogram?",
                options: ["Bar color", "Number of data groups", "Plot size", "Label position"],
                correctAnswer: 1,
                explanation: "The 'bins' parameter determines how many groups the data is divided into",
                xpReward: 50
            },
            {
                id: "viz-2-3",
                question: "For horizontal bar charts, which function do you use?",
                options: ["plt.bar(horizontal=True)", "plt.barh()", "plt.hbar()", "plt.bar_horizontal()"],
                correctAnswer: 1,
                explanation: "plt.barh() creates horizontal bar charts",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a grouped bar chart comparing two products:",
            codeBlocks: [
                "x = np.arange(len(categories))",
                "width = 0.35",
                "ax.bar(x - width/2, product_a, width, label='Product A')",
                "ax.bar(x + width/2, product_b, width, label='Product B')",
                "ax.legend()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Set positions, define width, plot both products offset, then show legend!",
            xpReward: 200
        }
    },
    {
        id: 3,
        title: "Seaborn Statistical Plots",
        subtitle: "Beautiful Visualizations",
        icon: "🎨",
        color: "from-purple-600 to-pink-400",
        neonColor: "purple",
        questName: "Statistical Insights",
        questDescription: "Create publication-quality statistical visualizations with Seaborn",
        xpRequired: 500,
        lessons: [
            {
                title: "Introduction to Seaborn",
                content: `Seaborn builds on Matplotlib with beautiful default styles and statistical plotting functions.

**Advantages:**
- Better default aesthetics
- Built-in themes
- Statistical functions
- Works with Pandas DataFrames`,
                codeExample: `import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

# Set theme
sns.set_theme(style="darkgrid")

# Sample data
tips = sns.load_dataset("tips")

# Create plot
plt.figure(figsize=(10, 6))
sns.scatterplot(data=tips, x="total_bill", y="tip", hue="time")
plt.title("Tips vs Total Bill")
plt.show()`,
                tips: ["set_theme() applies consistent styling", "Use 'hue' to add color dimension", "Seaborn works directly with DataFrames"]
            },
            {
                title: "Distribution Plots",
                content: `Seaborn provides powerful functions for visualizing distributions.

**Plot Types:**
- histplot: Histogram with KDE
- kdeplot: Kernel density estimate
- rugplot: Individual data points
- displot: Figure-level distribution`,
                codeExample: `import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")

# Histogram with KDE
plt.figure(figsize=(10, 6))
sns.histplot(data=tips, x="total_bill", kde=True, bins=20)
plt.title("Distribution of Total Bill")
plt.show()

# Multiple distributions
plt.figure(figsize=(10, 6))
sns.kdeplot(data=tips, x="total_bill", hue="time", fill=True)
plt.title("Bill Distribution by Time")
plt.show()`,
                tips: ["kde=True adds smooth density curve", "fill=True creates filled KDE plots", "Use hue for group comparisons"]
            },
            {
                title: "Box Plots & Violin Plots",
                content: `Box plots and violin plots show distribution statistics and are perfect for comparing groups.

**Box Plot Shows:**
- Median (line)
- Quartiles (box)
- Outliers (points)

**Violin Plot Adds:**
- Full distribution shape`,
                codeExample: `import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")

# Box plot
plt.figure(figsize=(10, 6))
sns.boxplot(data=tips, x="day", y="total_bill", palette="Set2")
plt.title("Bill Distribution by Day")
plt.show()

# Violin plot
plt.figure(figsize=(10, 6))
sns.violinplot(data=tips, x="day", y="total_bill", palette="muted")
plt.title("Bill Distribution (Violin)")
plt.show()`,
                tips: ["Box plots show outliers clearly", "Violin plots show full distribution", "Use palette for color schemes"]
            }
        ],
        challenges: [
            {
                id: "viz-3-1",
                question: "What does 'hue' parameter do in Seaborn?",
                options: ["Changes plot size", "Adds color dimension based on variable", "Sets plot title", "Adjusts transparency"],
                correctAnswer: 1,
                explanation: "The 'hue' parameter adds a color dimension to separate data by categories",
                xpReward: 50
            },
            {
                id: "viz-3-2",
                question: "Which Seaborn function creates a histogram with KDE?",
                options: ["sns.histogram()", "sns.histplot()", "sns.dist()", "sns.kde()"],
                correctAnswer: 1,
                explanation: "sns.histplot() with kde=True creates histograms with kernel density estimates",
                xpReward: 50
            },
            {
                id: "viz-3-3",
                question: "What does the box in a box plot represent?",
                options: ["Mean and std dev", "Min and max", "Q1 to Q3 (IQR)", "All data points"],
                correctAnswer: 2,
                explanation: "The box shows the interquartile range (Q1 to Q3), containing the middle 50% of data",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a Seaborn box plot comparing groups:",
            codeBlocks: [
                "import seaborn as sns",
                "sns.set_theme(style='darkgrid')",
                "sns.boxplot(data=df, x='category', y='value', palette='Set2')",
                "plt.title('Value Distribution by Category')",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Import Seaborn, set theme, create box plot, add title, display!",
            xpReward: 200
        }
    },
    {
        id: 4,
        title: "Heatmaps & Correlations",
        subtitle: "Matrix Visualizations",
        icon: "🔥",
        color: "from-red-600 to-orange-400",
        neonColor: "red",
        questName: "Reveal Patterns",
        questDescription: "Use heatmaps to visualize correlations and matrix data",
        xpRequired: 750,
        lessons: [
            {
                title: "Correlation Matrices",
                content: `Correlation matrices show relationships between all pairs of numerical variables.

**Correlation Values:**
- 1.0: Perfect positive correlation
- 0.0: No correlation
- -1.0: Perfect negative correlation`,
                codeExample: `import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt

# Create sample data
df = pd.DataFrame({
    'sales': [100, 120, 140, 180, 200],
    'marketing': [50, 60, 70, 90, 100],
    'customers': [200, 240, 280, 360, 400],
    'satisfaction': [4.2, 4.3, 4.5, 4.7, 4.8]
})

# Calculate correlation
corr = df.corr()

# Create heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(corr, annot=True, cmap='coolwarm', center=0, 
            square=True, linewidths=1, fmt='.2f')
plt.title('Correlation Matrix')
plt.show()`,
                tips: ["annot=True shows correlation values", "center=0 makes interpretation easier", "Use diverging colormaps for correlations"]
            },
            {
                title: "Heatmap Customization",
                content: `Heatmaps can visualize any matrix data. Customize them for maximum impact.

**Key Parameters:**
- cmap: Color palette
- annot: Show values
- fmt: Number format
- linewidths: Cell borders
- cbar: Show colorbar`,
                codeExample: `import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt

# Create sample matrix
data = np.random.rand(10, 12)

plt.figure(figsize=(12, 8))
sns.heatmap(data, 
            annot=True,
            fmt='.2f',
            cmap='YlOrRd',
            linewidths=0.5,
            cbar_kws={'label': 'Value'},
            square=False)
plt.title('Custom Heatmap')
plt.xlabel('Columns')
plt.ylabel('Rows')
plt.show()`,
                tips: ["Choose colormap based on data type", "square=True for correlation matrices", "Use cbar_kws to customize colorbar"]
            },
            {
                title: "Clustered Heatmaps",
                content: `Clustermap reorganizes rows and columns to group similar patterns together.

**Use Cases:**
- Gene expression analysis
- Customer segmentation
- Pattern discovery`,
                codeExample: `import seaborn as sns
import pandas as pd
import numpy as np

# Create sample data
np.random.seed(42)
df = pd.DataFrame(np.random.randn(50, 10),
                  columns=[f'Feature_{i}' for i in range(10)])

# Create clustermap
sns.clustermap(df, 
               cmap='viridis',
               figsize=(12, 10),
               dendrogram_ratio=0.1,
               cbar_pos=(0.02, 0.8, 0.03, 0.15))
plt.show()`,
                tips: ["Dendrograms show clustering hierarchy", "Useful for finding patterns", "Can cluster rows, columns, or both"]
            }
        ],
        challenges: [
            {
                id: "viz-4-1",
                question: "What does a correlation of 0.95 indicate?",
                options: ["No relationship", "Weak positive relationship", "Strong positive relationship", "Strong negative relationship"],
                correctAnswer: 2,
                explanation: "Values close to 1.0 indicate strong positive correlation",
                xpReward: 50
            },
            {
                id: "viz-4-2",
                question: "Which parameter shows values in heatmap cells?",
                options: ["show_values=True", "annot=True", "display=True", "values=True"],
                correctAnswer: 1,
                explanation: "annot=True displays the actual values in each cell",
                xpReward: 50
            },
            {
                id: "viz-4-3",
                question: "What does sns.clustermap() do differently than sns.heatmap()?",
                options: ["Uses different colors", "Reorders rows/columns by similarity", "Shows larger matrices", "Adds annotations"],
                correctAnswer: 1,
                explanation: "Clustermap reorganizes rows and columns to group similar patterns",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a correlation heatmap:",
            codeBlocks: [
                "corr = df.corr()",
                "plt.figure(figsize=(10, 8))",
                "sns.heatmap(corr, annot=True, cmap='coolwarm', center=0)",
                "plt.title('Correlation Matrix')",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Calculate correlation, create figure, plot heatmap, add title, display!",
            xpReward: 200
        }
    },
    {
        id: 5,
        title: "Time Series Visualization",
        subtitle: "Temporal Data",
        icon: "⏰",
        color: "from-cyan-600 to-blue-400",
        neonColor: "cyan",
        questName: "Track Trends Over Time",
        questDescription: "Master time series plots to reveal temporal patterns and trends",
        xpRequired: 1000,
        lessons: [
            {
                title: "Time Series Basics",
                content: `Time series plots show how data changes over time. Essential for trend analysis and forecasting.

**Key Concepts:**
- Trend: Long-term direction
- Seasonality: Repeating patterns
- Noise: Random variation`,
                codeExample: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Create time series data
dates = pd.date_range('2023-01-01', periods=365, freq='D')
values = np.cumsum(np.random.randn(365)) + 100

plt.figure(figsize=(14, 6))
plt.plot(dates, values, linewidth=2, color='steelblue')
plt.xlabel('Date')
plt.ylabel('Value')
plt.title('Time Series Data')
plt.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
                tips: ["Rotate x-axis labels for readability", "Use tight_layout() to prevent label cutoff", "Show grid for easier reading"]
            },
            {
                title: "Multiple Time Series",
                content: `Compare multiple time series on the same plot to identify relationships and patterns.

**Best Practices:**
- Use different colors/styles
- Add legend
- Consider dual y-axes for different scales`,
                codeExample: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

dates = pd.date_range('2023-01-01', periods=100, freq='D')
sales = np.cumsum(np.random.randn(100) * 10) + 1000
marketing = np.cumsum(np.random.randn(100) * 5) + 500

fig, ax1 = plt.subplots(figsize=(14, 6))

# First y-axis
ax1.plot(dates, sales, color='blue', linewidth=2, label='Sales')
ax1.set_xlabel('Date')
ax1.set_ylabel('Sales ($)', color='blue')
ax1.tick_params(axis='y', labelcolor='blue')

# Second y-axis
ax2 = ax1.twinx()
ax2.plot(dates, marketing, color='red', linewidth=2, label='Marketing')
ax2.set_ylabel('Marketing Spend ($)', color='red')
ax2.tick_params(axis='y', labelcolor='red')

plt.title('Sales vs Marketing Spend')
plt.tight_layout()
plt.show()`,
                tips: ["Use twinx() for dual y-axes", "Match axis label color to line color", "Keep scales meaningful"]
            },
            {
                title: "Rolling Averages & Trends",
                content: `Smooth noisy data with rolling averages to reveal underlying trends.

**Common Windows:**
- 7 days: Weekly average
- 30 days: Monthly average
- 365 days: Yearly average`,
                codeExample: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Create noisy time series
dates = pd.date_range('2023-01-01', periods=365, freq='D')
values = np.cumsum(np.random.randn(365)) + np.sin(np.arange(365) * 2 * np.pi / 365) * 20 + 100

# Calculate rolling average
df = pd.DataFrame({'value': values}, index=dates)
df['rolling_7'] = df['value'].rolling(window=7).mean()
df['rolling_30'] = df['value'].rolling(window=30).mean()

plt.figure(figsize=(14, 6))
plt.plot(df.index, df['value'], alpha=0.3, label='Original', color='gray')
plt.plot(df.index, df['rolling_7'], linewidth=2, label='7-day avg', color='blue')
plt.plot(df.index, df['rolling_30'], linewidth=2, label='30-day avg', color='red')
plt.xlabel('Date')
plt.ylabel('Value')
plt.title('Time Series with Rolling Averages')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
                tips: ["Larger windows = smoother curves", "Show original data with low alpha", "Multiple windows show different timescales"]
            }
        ],
        challenges: [
            {
                id: "viz-5-1",
                question: "What does a rolling average do?",
                options: ["Removes all noise", "Smooths data by averaging over a window", "Predicts future values", "Removes outliers"],
                correctAnswer: 1,
                explanation: "Rolling averages smooth data by calculating the mean over a moving window",
                xpReward: 50
            },
            {
                id: "viz-5-2",
                question: "Which method creates a second y-axis?",
                options: ["ax.secondary_y()", "ax.twinx()", "ax.add_yaxis()", "ax.dual_axis()"],
                correctAnswer: 1,
                explanation: "ax.twinx() creates a second y-axis sharing the same x-axis",
                xpReward: 50
            },
            {
                id: "viz-5-3",
                question: "Why rotate x-axis labels in time series plots?",
                options: ["Looks better", "Prevents overlapping dates", "Required by Matplotlib", "Improves performance"],
                correctAnswer: 1,
                explanation: "Rotating labels prevents date labels from overlapping and improves readability",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a time series with rolling average:",
            codeBlocks: [
                "df = pd.DataFrame({'value': values}, index=dates)",
                "df['rolling'] = df['value'].rolling(window=7).mean()",
                "plt.plot(df.index, df['value'], alpha=0.3, label='Original')",
                "plt.plot(df.index, df['rolling'], linewidth=2, label='7-day avg')",
                "plt.legend()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Create DataFrame, calculate rolling average, plot both series, show legend!",
            xpReward: 200
        }
    },
    {
        id: 6,
        title: "Interactive Plotly Charts",
        subtitle: "Web Visualizations",
        icon: "🌐",
        color: "from-indigo-600 to-purple-400",
        neonColor: "indigo",
        questName: "Create Interactive Dashboards",
        questDescription: "Build interactive, web-ready visualizations with Plotly",
        xpRequired: 1250,
        lessons: [
            {
                title: "Introduction to Plotly",
                content: `Plotly creates interactive, publication-quality graphs that work in web browsers and Jupyter notebooks.

**Key Features:**
- Hover tooltips
- Zoom and pan
- Export to PNG/SVG
- Works in dashboards`,
                codeExample: `import plotly.express as px
import pandas as pd

# Sample data
df = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [10, 11, 12, 13, 14],
    'category': ['A', 'B', 'A', 'B', 'A']
})

# Create interactive scatter
fig = px.scatter(df, x='x', y='y', color='category',
                 title='Interactive Scatter Plot',
                 hover_data=['category'])
fig.show()`,
                tips: ["Plotly Express (px) is the high-level API", "Hover shows data by default", "Figures are interactive in browsers"]
            },
            {
                title: "Advanced Plotly Features",
                content: `Plotly offers advanced customization and interactivity options.

**Interactive Features:**
- Dropdown menus
- Sliders
- Buttons
- Animations`,
                codeExample: `import plotly.graph_objects as go

# Create figure
fig = go.Figure()

# Add traces
fig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6],
                         mode='lines+markers',
                         name='Series 1'))

# Update layout
fig.update_layout(
    title='Customized Plot',
    xaxis_title='X Axis',
    yaxis_title='Y Axis',
    hovermode='x unified'
)

fig.show()`,
                tips: ["graph_objects (go) for low-level control", "update_layout() customizes appearance", "Add multiple traces for complex plots"]
            }
        ],
        challenges: [
            {
                id: "viz-6-1",
                question: "What makes Plotly different from Matplotlib?",
                options: ["Faster rendering", "Interactive by default", "Better colors", "Smaller file size"],
                correctAnswer: 1,
                explanation: "Plotly creates interactive plots with hover, zoom, and pan by default",
                xpReward: 50
            },
            {
                id: "viz-6-2",
                question: "Which Plotly module is the high-level API?",
                options: ["plotly.graph_objects", "plotly.express", "plotly.figure", "plotly.interactive"],
                correctAnswer: 1,
                explanation: "plotly.express (px) is the high-level, easy-to-use API",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create an interactive Plotly scatter plot:",
            codeBlocks: [
                "import plotly.express as px",
                "fig = px.scatter(df, x='x', y='y', color='category')",
                "fig.update_layout(title='My Interactive Plot')",
                "fig.show()"
            ],
            correctOrder: [0, 1, 2, 3],
            explanation: "Import Plotly Express, create scatter plot, customize layout, display!",
            xpReward: 200
        }
    },
    {
        id: 7,
        title: "Chart Types Mastery",
        subtitle: "Advanced Plots",
        icon: "📉",
        color: "from-teal-600 to-cyan-400",
        neonColor: "teal",
        questName: "Master All Chart Types",
        questDescription: "Learn when and how to use different chart types effectively",
        xpRequired: 1500,
        lessons: [
            {
                title: "Choosing the Right Chart",
                content: `Different data requires different visualizations. Choose wisely!

**Chart Selection Guide:**
- Comparison: Bar charts
- Distribution: Histograms, box plots
- Relationship: Scatter plots
- Composition: Pie charts, stacked bars
- Trend: Line charts`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Pie chart for composition
sizes = [30, 25, 20, 15, 10]
labels = ['A', 'B', 'C', 'D', 'E']

plt.figure(figsize=(8, 8))
plt.pie(sizes, labels=labels, autopct='%1.1f%%',
        startangle=90, colors=plt.cm.Set3.colors)
plt.title('Market Share Distribution')
plt.axis('equal')
plt.show()`,
                tips: ["Match chart type to your message", "Avoid pie charts for many categories", "Use bar charts for precise comparisons"]
            },
            {
                title: "Area Charts & Stacked Plots",
                content: `Area charts show cumulative totals and composition over time.

**Use Cases:**
- Showing total + breakdown
- Cumulative metrics
- Part-to-whole relationships`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

x = np.arange(10)
y1 = np.random.randint(10, 30, 10)
y2 = np.random.randint(10, 30, 10)
y3 = np.random.randint(10, 30, 10)

plt.figure(figsize=(12, 6))
plt.stackplot(x, y1, y2, y3,
              labels=['Product A', 'Product B', 'Product C'],
              alpha=0.8)
plt.xlabel('Time Period')
plt.ylabel('Sales')
plt.title('Stacked Area Chart')
plt.legend(loc='upper left')
plt.show()`,
                tips: ["stackplot() creates stacked area charts", "Use for showing composition over time", "Keep number of series manageable"]
            }
        ],
        challenges: [
            {
                id: "viz-7-1",
                question: "Which chart type is best for showing composition?",
                options: ["Line chart", "Scatter plot", "Pie chart or stacked bar", "Histogram"],
                correctAnswer: 2,
                explanation: "Pie charts and stacked bars show part-to-whole relationships",
                xpReward: 50
            },
            {
                id: "viz-7-2",
                question: "What does autopct parameter do in pie charts?",
                options: ["Sets colors", "Shows percentages", "Adjusts size", "Rotates chart"],
                correctAnswer: 1,
                explanation: "autopct displays percentage labels on pie slices",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a pie chart with percentages:",
            codeBlocks: [
                "sizes = [30, 25, 20, 15, 10]",
                "labels = ['A', 'B', 'C', 'D', 'E']",
                "plt.pie(sizes, labels=labels, autopct='%1.1f%%')",
                "plt.title('Distribution')",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Define data, create pie chart with percentages, add title, display!",
            xpReward: 200
        }
    },
    {
        id: 8,
        title: "Color Theory & Design",
        subtitle: "Visual Communication",
        icon: "🎨",
        color: "from-pink-600 to-rose-400",
        neonColor: "pink",
        questName: "Design Beautiful Visualizations",
        questDescription: "Master color theory and design principles for impactful visualizations",
        xpRequired: 1750,
        lessons: [
            {
                title: "Color Palettes",
                content: `Colors convey meaning and emotion. Choose them carefully!

**Palette Types:**
- Sequential: Light to dark (single hue)
- Diverging: Two hues from center
- Qualitative: Distinct colors for categories
- Perceptually uniform: Equal visual importance`,
                codeExample: `import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Show different palettes
palettes = ['viridis', 'coolwarm', 'Set2', 'rocket']

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
for ax, palette in zip(axes.flat, palettes):
    data = np.random.randn(10, 12)
    sns.heatmap(data, cmap=palette, ax=ax, cbar=False)
    ax.set_title(f'{palette} palette')
plt.tight_layout()
plt.show()`,
                tips: ["Use sequential for ordered data", "Diverging for data with meaningful center", "Qualitative for categories"]
            },
            {
                title: "Accessibility & Readability",
                content: `Design for all audiences, including colorblind viewers.

**Best Practices:**
- Use colorblind-friendly palettes
- Add patterns/textures
- Ensure sufficient contrast
- Label directly when possible`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Colorblind-friendly palette
colors = ['#0173B2', '#DE8F05', '#029E73', '#CC78BC']

data = [25, 30, 20, 25]
labels = ['Q1', 'Q2', 'Q3', 'Q4']

plt.figure(figsize=(10, 6))
bars = plt.bar(labels, data, color=colors, edgecolor='black', linewidth=1.5)

# Add value labels
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
             f'{int(height)}',
             ha='center', va='bottom', fontweight='bold')

plt.title('Accessible Bar Chart')
plt.ylabel('Value')
plt.show()`,
                tips: ["Test with colorblind simulators", "Add edge colors for clarity", "Direct labeling reduces cognitive load"]
            }
        ],
        challenges: [
            {
                id: "viz-8-1",
                question: "Which palette type is best for temperature data (cold to hot)?",
                options: ["Qualitative", "Diverging", "Sequential", "Random"],
                correctAnswer: 1,
                explanation: "Diverging palettes work well for data with a meaningful center (like temperature)",
                xpReward: 50
            },
            {
                id: "viz-8-2",
                question: "Why use colorblind-friendly palettes?",
                options: ["They look better", "Required by law", "Make visualizations accessible to all", "Easier to print"],
                correctAnswer: 2,
                explanation: "Colorblind-friendly palettes ensure everyone can interpret your visualizations",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create an accessible bar chart with labels:",
            codeBlocks: [
                "bars = plt.bar(labels, data, color=colors, edgecolor='black')",
                "for bar in bars:",
                "    height = bar.get_height()",
                "    plt.text(bar.get_x() + bar.get_width()/2., height, f'{int(height)}', ha='center')",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Create bars, loop through them, get height, add text labels, display!",
            xpReward: 200
        }
    },
    {
        id: 9,
        title: "Data Storytelling",
        subtitle: "Narrative Visualization",
        icon: "📖",
        color: "from-amber-600 to-yellow-400",
        neonColor: "amber",
        questName: "Tell Stories with Data",
        questDescription: "Learn to craft compelling narratives through visualization",
        xpRequired: 2000,
        lessons: [
            {
                title: "The Storytelling Framework",
                content: `Great visualizations tell stories. Follow this framework:

**Story Structure:**
1. Setup: What's the context?
2. Conflict: What's the problem?
3. Resolution: What's the insight?
4. Call to action: What should we do?`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

# Story: Sales declining, then recovered
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
sales = [100, 95, 85, 90, 110, 125]

fig, ax = plt.subplots(figsize=(12, 6))

# Plot with annotations
ax.plot(months, sales, marker='o', linewidth=3, markersize=10, color='steelblue')

# Annotate key points
ax.annotate('Decline begins', xy=('Feb', 95), xytext=('Jan', 105),
            arrowprops=dict(arrowstyle='->', color='red', lw=2),
            fontsize=12, color='red')

ax.annotate('Recovery!', xy=('May', 110), xytext=('Apr', 120),
            arrowprops=dict(arrowstyle='->', color='green', lw=2),
            fontsize=12, color='green')

ax.set_title('Sales Recovery Story', fontsize=16, fontweight='bold')
ax.set_ylabel('Sales ($1000s)')
ax.grid(True, alpha=0.3)
plt.show()`,
                tips: ["Use annotations to guide attention", "Highlight key insights", "Keep the narrative clear"]
            },
            {
                title: "Visual Hierarchy",
                content: `Guide viewers' attention with visual hierarchy.

**Techniques:**
- Size: Larger = more important
- Color: Bright = attention
- Position: Top-left = first seen
- Contrast: Different = notable`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
values = [45, 30, 60, 25, 40]

# Highlight best performer
colors = ['lightgray' if v != max(values) else 'gold' for v in values]

plt.figure(figsize=(10, 6))
bars = plt.bar(categories, values, color=colors, edgecolor='black', linewidth=2)

# Emphasize winner
max_idx = values.index(max(values))
bars[max_idx].set_height(values[max_idx] * 1.05)  # Slightly taller

plt.title('Product Performance (Best Highlighted)', fontsize=14, fontweight='bold')
plt.ylabel('Sales')
plt.ylim(0, max(values) * 1.2)
plt.show()`,
                tips: ["Use color to highlight key data", "Reduce visual clutter", "One clear focal point"]
            }
        ],
        challenges: [
            {
                id: "viz-9-1",
                question: "What's the first step in data storytelling?",
                options: ["Create the plot", "Establish context", "Add colors", "Export image"],
                correctAnswer: 1,
                explanation: "Start by establishing context so viewers understand what they're looking at",
                xpReward: 50
            },
            {
                id: "viz-9-2",
                question: "How do you guide viewer attention in a visualization?",
                options: ["Use many colors", "Visual hierarchy (size, color, position)", "Add more data", "Use 3D effects"],
                correctAnswer: 1,
                explanation: "Visual hierarchy using size, color, and position guides attention effectively",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a storytelling visualization with annotations:",
            codeBlocks: [
                "ax.plot(months, sales, marker='o', linewidth=3)",
                "ax.annotate('Key Event', xy=('Mar', 85), xytext=('Feb', 95),",
                "            arrowprops=dict(arrowstyle='->', color='red'))",
                "ax.set_title('Sales Story')",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explanation: "Plot data, add annotation with arrow, set title, display the story!",
            xpReward: 200
        }
    },
    {
        id: 10,
        title: "Dashboard Creation",
        subtitle: "Multi-Plot Layouts",
        icon: "📊",
        color: "from-violet-600 to-purple-400",
        neonColor: "violet",
        questName: "Build Complete Dashboards",
        questDescription: "Combine multiple visualizations into cohesive dashboards",
        xpRequired: 2250,
        lessons: [
            {
                title: "Subplot Layouts",
                content: `Dashboards combine multiple plots. Master subplot layouts!

**Layout Options:**
- plt.subplots(): Grid layout
- GridSpec: Custom sizing
- subplot2grid(): Flexible positioning`,
                codeExample: `import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Plot 1: Line chart
axes[0, 0].plot([1, 2, 3, 4], [10, 20, 25, 30])
axes[0, 0].set_title('Trend Over Time')

# Plot 2: Bar chart
axes[0, 1].bar(['A', 'B', 'C'], [15, 25, 20])
axes[0, 1].set_title('Category Comparison')

# Plot 3: Scatter
axes[1, 0].scatter(np.random.randn(50), np.random.randn(50))
axes[1, 0].set_title('Correlation Analysis')

# Plot 4: Histogram
axes[1, 1].hist(np.random.randn(1000), bins=30)
axes[1, 1].set_title('Distribution')

plt.suptitle('Analytics Dashboard', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()`,
                tips: ["Use tight_layout() to prevent overlap", "Keep consistent styling", "Add overall title with suptitle()"]
            },
            {
                title: "Advanced Dashboard Design",
                content: `Professional dashboards need careful design and organization.

**Best Practices:**
- Logical flow (top-left to bottom-right)
- Consistent color scheme
- Clear section headers
- Appropriate chart types`,
                codeExample: `import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
import numpy as np

fig = plt.figure(figsize=(16, 10))
gs = GridSpec(3, 3, figure=fig)

# Large main plot (top, spanning 2 columns)
ax1 = fig.add_subplot(gs[0, :2])
ax1.plot(np.cumsum(np.random.randn(100)), linewidth=2)
ax1.set_title('Main Metric Trend', fontsize=14, fontweight='bold')

# KPI box (top right)
ax2 = fig.add_subplot(gs[0, 2])
ax2.text(0.5, 0.5, '↑ 23%', ha='center', va='center',
         fontsize=40, color='green', fontweight='bold')
ax2.set_title('Growth Rate')
ax2.axis('off')

# Supporting plots (bottom row)
ax3 = fig.add_subplot(gs[1:, 0])
ax3.bar(['Q1', 'Q2', 'Q3', 'Q4'], [20, 25, 30, 35])
ax3.set_title('Quarterly Performance')

ax4 = fig.add_subplot(gs[1:, 1])
ax4.pie([30, 25, 25, 20], labels=['A', 'B', 'C', 'D'], autopct='%1.0f%%')
ax4.set_title('Market Share')

ax5 = fig.add_subplot(gs[1:, 2])
ax5.hist(np.random.randn(500), bins=20, color='coral')
ax5.set_title('Distribution')

plt.suptitle('Executive Dashboard', fontsize=18, fontweight='bold', y=0.98)
plt.tight_layout()
plt.show()`,
                tips: ["Use GridSpec for custom layouts", "Highlight key metrics prominently", "Balance detail and clarity"]
            }
        ],
        challenges: [
            {
                id: "viz-10-1",
                question: "What does plt.tight_layout() do?",
                options: ["Makes plots smaller", "Prevents subplot overlap", "Changes colors", "Adds borders"],
                correctAnswer: 1,
                explanation: "tight_layout() automatically adjusts spacing to prevent overlapping elements",
                xpReward: 50
            },
            {
                id: "viz-10-2",
                question: "Which tool allows custom subplot sizing?",
                options: ["plt.subplots()", "GridSpec", "plt.figure()", "plt.layout()"],
                correctAnswer: 1,
                explanation: "GridSpec allows flexible, custom-sized subplot layouts",
                xpReward: 50
            }
        ],
        bossFight: {
            question: "Arrange the code to create a 2x2 dashboard:",
            codeBlocks: [
                "fig, axes = plt.subplots(2, 2, figsize=(14, 10))",
                "axes[0, 0].plot(data1)",
                "axes[0, 1].bar(categories, values)",
                "axes[1, 0].scatter(x, y)",
                "axes[1, 1].hist(distribution)",
                "plt.tight_layout()",
                "plt.show()"
            ],
            correctOrder: [0, 1, 2, 3, 4, 5, 6],
            explanation: "Create subplot grid, add four different plots, apply layout, display dashboard!",
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

export const VIZ_STORAGE_KEY = 'visualization_course_progress';
