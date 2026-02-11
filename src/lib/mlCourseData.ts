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

export const mlModules: Module[] = [
  {
    id: 1,
    title: "The ML Foundations",
    subtitle: "Introduction to Machine Learning",
    icon: "🧠",
    color: "from-violet-600 to-purple-400",
    neonColor: "purple",
    questName: "Understand the ML Paradigm",
    questDescription: "Learn what makes machine learning different from traditional programming",
    xpRequired: 0,
    lessons: [
      {
        title: "What is Machine Learning?",
        content: "Machine Learning is a subset of AI where computers learn patterns from data instead of being explicitly programmed.\n\n**Types of Machine Learning:**\n- Supervised Learning: Learn from labeled data\n- Unsupervised Learning: Find patterns in unlabeled data\n- Reinforcement Learning: Learn through trial and error",
        codeExample: "# Traditional Programming vs ML\n# Traditional: explicit rules\ndef is_spam_traditional(email):\n    if \"free money\" in email:\n        return True\n    return False\n\n# ML Approach: learn from data\nfrom sklearn.naive_bayes import MultinomialNB\nmodel = MultinomialNB()\nmodel.fit(X_train, y_train)  # Learn patterns\npredictions = model.predict(X_test)",
        tips: ["ML finds patterns humans might miss", "Quality data is more important than complex algorithms", "Start simple, then increase complexity"]
      },
      {
        title: "The ML Workflow",
        content: "Every ML project follows a similar workflow:\n\n**The Pipeline:**\n1. Define the problem\n2. Collect and prepare data\n3. Choose a model\n4. Train the model\n5. Evaluate performance\n6. Deploy and monitor",
        codeExample: "from sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import accuracy_score\n\n# 1. Load data\nimport pandas as pd\ndf = pd.read_csv('data.csv')\n\n# 2. Prepare data\nX = df.drop('target', axis=1)\ny = df['target']\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\n\n# 3. Scale features\nscaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)\n\n# 4. Train model\nmodel = LogisticRegression()\nmodel.fit(X_train_scaled, y_train)\n\n# 5. Evaluate\npredictions = model.predict(X_test_scaled)\naccuracy = accuracy_score(y_test, predictions)\nprint(f\"Accuracy: {accuracy:.2f}\")",
        tips: ["Always split data before preprocessing", "Use the same scaler for train and test", "Set random_state for reproducibility"]
      },
      {
        title: "Scikit-Learn Basics",
        content: "Scikit-learn is the go-to library for ML in Python. It provides consistent APIs for all algorithms.\n\n**Key Concepts:**\n- Estimators: Objects that learn from data\n- fit(): Train the model\n- predict(): Make predictions\n- score(): Evaluate performance",
        codeExample: "from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.datasets import load_iris\n\n# Load sample dataset\niris = load_iris()\nX, y = iris.data, iris.target\n\n# Create and train model\nmodel = RandomForestClassifier(n_estimators=100)\nmodel.fit(X, y)\n\n# Make predictions\npredictions = model.predict(X[:5])\nprint(f\"Predictions: {predictions}\")\n\n# Get probabilities\nprobabilities = model.predict_proba(X[:5])\nprint(f\"Probabilities: {probabilities}\")\n\n# Feature importance\nimportance = model.feature_importances_\nprint(f\"Feature importance: {importance}\")",
        tips: ["All sklearn models follow the same pattern", "Use GridSearchCV for hyperparameter tuning", "Check documentation for model-specific parameters"]
      }
    ],
    challenges: [
      {
        id: "ml-1-1",
        question: "What is the main difference between supervised and unsupervised learning?",
        options: ["Speed of training", "Labeled vs unlabeled data", "Size of dataset", "Type of computer used"],
        correctAnswer: 1,
        explanation: "Supervised learning uses labeled data (with known outputs), while unsupervised learning finds patterns in unlabeled data",
        xpReward: 50
      },
      {
        id: "ml-1-2",
        question: "Which method trains a scikit-learn model?",
        options: ["model.train()", "model.fit()", "model.learn()", "model.build()"],
        correctAnswer: 1,
        explanation: "The fit() method is used to train models in scikit-learn",
        xpReward: 50
      },
      {
        id: "ml-1-3",
        question: "Why do we split data into training and test sets?",
        options: ["To save memory", "To evaluate model on unseen data", "To make training faster", "It's optional"],
        correctAnswer: 1,
        explanation: "Splitting data helps evaluate how well the model generalizes to new, unseen data",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code blocks to create a complete ML pipeline:",
      codeBlocks: [
        "X_train, X_test, y_train, y_test = train_test_split(X, y)",
        "model = RandomForestClassifier()",
        "model.fit(X_train, y_train)",
        "accuracy = model.score(X_test, y_test)"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "First split data, create model, train it, then evaluate!",
      xpReward: 200
    }
  },
  {
    id: 2,
    title: "The Regression Realm",
    subtitle: "Linear & Polynomial Regression",
    icon: "📈",
    color: "from-blue-600 to-cyan-400",
    neonColor: "cyan",
    questName: "Predict the Future",
    questDescription: "Master regression to predict continuous values from data",
    xpRequired: 300,
    lessons: [
      {
        title: "Linear Regression",
        content: "Linear regression finds the best straight line through your data points.\n\n**The Equation:**\ny = mx + b\n- y: predicted value\n- m: slope (coefficient)\n- x: input feature\n- b: intercept",
        codeExample: "from sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Sample data\nX = np.array([[1], [2], [3], [4], [5]])\ny = np.array([2, 4, 5, 4, 5])\n\n# Create and train model\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Get parameters\nprint(f\"Slope: {model.coef_[0]:.2f}\")\nprint(f\"Intercept: {model.intercept_:.2f}\")\n\n# Make predictions\npredictions = model.predict([[6], [7]])\nprint(f\"Predictions: {predictions}\")\n\n# R2 score (how well the line fits)\nr2_score = model.score(X, y)\nprint(f\"R2 Score: {r2_score:.2f}\")",
        tips: ["R² closer to 1 means better fit", "Check residuals for patterns", "Scale features for better convergence"]
      },
      {
        title: "Multiple Linear Regression",
        content: "When you have multiple features, use multiple linear regression.\n\n**The Equation:**\ny = b0 + b1*x1 + b2*x2 + ... + bn*xn\n\nEach coefficient shows how much y changes when that feature changes by 1.",
        codeExample: "from sklearn.linear_model import LinearRegression\nimport pandas as pd\n\n# Multiple features\ndf = pd.DataFrame({\n    'sqft': [1500, 2000, 1200, 1800, 2500],\n    'bedrooms': [3, 4, 2, 3, 5],\n    'age': [10, 5, 20, 8, 2],\n    'price': [300000, 450000, 200000, 350000, 550000]\n})\n\nX = df[['sqft', 'bedrooms', 'age']]\ny = df['price']\n\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Coefficients for each feature\nfor feature, coef in zip(X.columns, model.coef_):\n    print(f\"{feature}: {coef:.2f}\")\n\n# Predict new house price\nnew_house = [[1600, 3, 5]]\npredicted_price = model.predict(new_house)\nprint(f\"Predicted price: {predicted_price[0]:,.0f}\")",
        tips: ["Multicollinearity can distort coefficients", "Use feature selection for many features", "Standardize features to compare importance"]
      },
      {
        title: "Polynomial Regression",
        content: "When relationships aren't linear, add polynomial features.\n\n**Key Insight:**\nTurn x into [x, x², x³, ...] to capture curves.",
        codeExample: "from sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.pipeline import make_pipeline\nimport numpy as np\n\n# Non-linear data\nX = np.array([[1], [2], [3], [4], [5]])\ny = np.array([1, 4, 9, 16, 25])  # y = x²\n\n# Degree 1 (linear) - poor fit\nlinear_model = LinearRegression()\nlinear_model.fit(X, y)\nprint(f\"Linear R2: {linear_model.score(X, y):.2f}\")\n\n# Degree 2 (quadratic) - perfect fit\npoly_model = make_pipeline(\n    PolynomialFeatures(degree=2),\n    LinearRegression()\n)\npoly_model.fit(X, y)\nprint(f\"Polynomial R2: {poly_model.score(X, y):.2f}\")\n\n# Predictions\nprint(f\"Predict x=6: {poly_model.predict([[6]])[0]:.0f}\")",
        tips: ["Higher degree = more risk of overfitting", "Use cross-validation to find optimal degree", "Regularization helps prevent overfitting"]
      }
    ],
    challenges: [
      {
        id: "ml-2-1",
        question: "What does R² = 0.95 mean?",
        options: ["95% of predictions are correct", "Model explains 95% of variance", "Model is 95% fast", "Data has 95 rows"],
        correctAnswer: 1,
        explanation: "R² (coefficient of determination) measures how much variance in y is explained by the model. 0.95 means 95%.",
        xpReward: 50
      },
      {
        id: "ml-2-2",
        question: "In y = 3x + 5, what is the slope?",
        options: ["y", "x", "3", "5"],
        correctAnswer: 2,
        explanation: "The slope is the coefficient of x, which is 3. It means y increases by 3 for each unit increase in x.",
        xpReward: 50
      },
      {
        id: "ml-2-3",
        question: "When should you use polynomial regression?",
        options: ["When data is linear", "When relationship is curved", "When you have few features", "Always"],
        correctAnswer: 1,
        explanation: "Polynomial regression captures non-linear (curved) relationships between variables",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to build a polynomial regression pipeline:",
      codeBlocks: [
        "from sklearn.preprocessing import PolynomialFeatures",
        "from sklearn.pipeline import make_pipeline",
        "model = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())",
        "model.fit(X_train, y_train)"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Import, create pipeline, then train!",
      xpReward: 200
    }
  },
  {
    id: 3,
    title: "The Classification Castle",
    subtitle: "Classification Algorithms",
    icon: "🏰",
    color: "from-emerald-600 to-green-400",
    neonColor: "green",
    questName: "Classify the Unknown",
    questDescription: "Master classification to categorize data into discrete classes",
    xpRequired: 600,
    lessons: [
      {
        title: "Logistic Regression",
        content: "Despite its name, logistic regression is for classification! It predicts probabilities between 0 and 1.\n\n**Key Concepts:**\n- Sigmoid function squashes output to [0, 1]\n- Threshold (usually 0.5) determines class\n- Great for binary classification",
        codeExample: "from sklearn.linear_model import LogisticRegression\nfrom sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\n\n# Load data\ncancer = load_breast_cancer()\nX_train, X_test, y_train, y_test = train_test_split(\n    cancer.data, cancer.target, test_size=0.2\n)\n\n# Train model\nmodel = LogisticRegression(max_iter=1000)\nmodel.fit(X_train, y_train)\n\n# Accuracy\nprint(f\"Accuracy: {model.score(X_test, y_test):.2f}\")\n\n# Probabilities\nprobs = model.predict_proba(X_test[:3])\nprint(f\"Probabilities: {probs}\")\n\n# Classes\npredictions = model.predict(X_test[:3])\nprint(f\"Predictions: {predictions}\")",
        tips: ["Increase max_iter if convergence warnings appear", "Use class_weight='balanced' for imbalanced data", "Interpret coefficients as log-odds"]
      },
      {
        title: "Decision Trees",
        content: "Decision trees make predictions by asking a series of yes/no questions about features.\n\n**Advantages:**\n- Easy to interpret and visualize\n- No feature scaling needed\n- Handles non-linear relationships",
        codeExample: "from sklearn.tree import DecisionTreeClassifier, plot_tree\nimport matplotlib.pyplot as plt\n\n# Create and train\nmodel = DecisionTreeClassifier(max_depth=3, random_state=42)\nmodel.fit(X_train, y_train)\n\n# Evaluate\nprint(f\"Train Accuracy: {model.score(X_train, y_train):.2f}\")\nprint(f\"Test Accuracy: {model.score(X_test, y_test):.2f}\")\n\n# Feature importance\nfor name, importance in zip(feature_names, model.feature_importances_):\n    if importance > 0.05:\n        print(f\"{name}: {importance:.3f}\")\n\n# Visualize the tree\nplt.figure(figsize=(20, 10))\nplot_tree(model, feature_names=feature_names, \n          class_names=['No', 'Yes'], filled=True)\nplt.show()",
        tips: ["Limit max_depth to prevent overfitting", "min_samples_leaf controls leaf size", "Prune the tree for better generalization"]
      },
      {
        title: "Random Forests",
        content: "Random Forests combine many decision trees for better predictions.\n\n**The Wisdom of Crowds:**\n- Each tree sees random subset of data\n- Each split considers random features\n- Final prediction = majority vote",
        codeExample: "from sklearn.ensemble import RandomForestClassifier\n\n# Create forest with 100 trees\nmodel = RandomForestClassifier(\n    n_estimators=100,\n    max_depth=10,\n    min_samples_split=5,\n    random_state=42\n)\nmodel.fit(X_train, y_train)\n\n# Better generalization than single tree\nprint(f\"Train Accuracy: {model.score(X_train, y_train):.2f}\")\nprint(f\"Test Accuracy: {model.score(X_test, y_test):.2f}\")\n\n# Aggregate feature importance\nimportance = model.feature_importances_\nindices = importance.argsort()[::-1][:10]\n\nprint(\"Top 10 Features:\")\nfor i in indices:\n    print(f\"  {feature_names[i]}: {importance[i]:.3f}\")",
        tips: ["More trees = better but slower", "OOB score estimates generalization", "Random Forests rarely overfit"]
      }
    ],
    challenges: [
      {
        id: "ml-3-1",
        question: "What type of problem is logistic regression used for?",
        options: ["Regression", "Classification", "Clustering", "Dimensionality reduction"],
        correctAnswer: 1,
        explanation: "Despite its name, logistic regression is used for classification, not regression",
        xpReward: 50
      },
      {
        id: "ml-3-2",
        question: "What does max_depth control in a decision tree?",
        options: ["Number of features", "How deep the tree can grow", "Number of samples", "Learning rate"],
        correctAnswer: 1,
        explanation: "max_depth limits how many levels of questions the tree can ask, preventing overfitting",
        xpReward: 50
      },
      {
        id: "ml-3-3",
        question: "Why do Random Forests usually perform better than single decision trees?",
        options: ["They're faster", "They use less memory", "They reduce overfitting through averaging", "They don't need training"],
        correctAnswer: 2,
        explanation: "By combining many trees trained on different data subsets, Random Forests reduce variance and overfitting",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to build and evaluate a Random Forest classifier:",
      codeBlocks: [
        "from sklearn.ensemble import RandomForestClassifier",
        "model = RandomForestClassifier(n_estimators=100)",
        "model.fit(X_train, y_train)",
        "accuracy = model.score(X_test, y_test)"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Import, create model, train, evaluate!",
      xpReward: 200
    }
  },
  {
    id: 4,
    title: "The Evaluation Emporium",
    subtitle: "Model Evaluation & Metrics",
    icon: "📊",
    color: "from-orange-600 to-yellow-400",
    neonColor: "orange",
    questName: "Measure True Performance",
    questDescription: "Learn to properly evaluate and compare machine learning models",
    xpRequired: 900,
    lessons: [
      {
        title: "Classification Metrics",
        content: "Accuracy isn't everything! Different metrics matter for different problems.\n\n**Key Metrics:**\n- Precision: Of predicted positives, how many are correct?\n- Recall: Of actual positives, how many did we find?\n- F1 Score: Harmonic mean of precision and recall",
        codeExample: "from sklearn.metrics import (\n    accuracy_score, precision_score, recall_score, \n    f1_score, classification_report, confusion_matrix\n)\n\n# Get predictions\ny_pred = model.predict(X_test)\n\n# Individual metrics\nprint(f\"Accuracy: {accuracy_score(y_test, y_pred):.2f}\")\nprint(f\"Precision: {precision_score(y_test, y_pred):.2f}\")\nprint(f\"Recall: {recall_score(y_test, y_pred):.2f}\")\nprint(f\"F1 Score: {f1_score(y_test, y_pred):.2f}\")\n\n# Complete report\nprint(classification_report(y_test, y_pred))\n\n# Confusion matrix\ncm = confusion_matrix(y_test, y_pred)\nprint(\"Confusion Matrix:\")\nprint(cm)",
        tips: ["High recall for medical diagnosis (don't miss positives)", "High precision for spam detection (don't block good emails)", "F1 when you need balance"]
      },
      {
        title: "Cross-Validation",
        content: "Don't just split once! Cross-validation gives more reliable estimates.\n\n**K-Fold Cross-Validation:**\n1. Split data into K parts\n2. Train on K-1, test on 1\n3. Repeat K times, average results",
        codeExample: "from sklearn.model_selection import cross_val_score, KFold\n\n# 5-fold cross-validation\nscores = cross_val_score(model, X, y, cv=5)\nprint(f\"Scores: {scores}\")\nprint(f\"Mean: {scores.mean():.3f} (+/- {scores.std()*2:.3f})\")\n\n# Custom K-Fold\nkfold = KFold(n_splits=10, shuffle=True, random_state=42)\nscores = cross_val_score(model, X, y, cv=kfold)\nprint(f\"10-Fold Mean: {scores.mean():.3f}\")\n\n# Stratified for classification (maintains class distribution)\nfrom sklearn.model_selection import StratifiedKFold\nskfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\nscores = cross_val_score(model, X, y, cv=skfold)\nprint(f\"Stratified 5-Fold Mean: {scores.mean():.3f}\")",
        tips: ["Use 5 or 10 folds typically", "Stratified for imbalanced classes", "Higher variance = less reliable model"]
      },
      {
        title: "Hyperparameter Tuning",
        content: "Find the best settings for your model using systematic search.\n\n**Methods:**\n- Grid Search: Try all combinations\n- Random Search: Sample combinations\n- Bayesian Optimization: Smart search",
        codeExample: "from sklearn.model_selection import GridSearchCV, RandomizedSearchCV\n\n# Define parameter grid\nparam_grid = {\n    'n_estimators': [50, 100, 200],\n    'max_depth': [5, 10, 20, None],\n    'min_samples_split': [2, 5, 10]\n}\n\n# Grid Search\ngrid_search = GridSearchCV(\n    RandomForestClassifier(),\n    param_grid,\n    cv=5,\n    scoring='f1',\n    n_jobs=-1\n)\ngrid_search.fit(X_train, y_train)\n\nprint(f\"Best params: {grid_search.best_params_}\")\nprint(f\"Best score: {grid_search.best_score_:.3f}\")\n\n# Use best model\nbest_model = grid_search.best_estimator_\ntest_score = best_model.score(X_test, y_test)\nprint(f\"Test score: {test_score:.3f}\")",
        tips: ["GridSearchCV for small grids", "RandomizedSearchCV for large grids", "Use n_jobs=-1 for parallel processing"]
      }
    ],
    challenges: [
      {
        id: "ml-4-1",
        question: "When is recall more important than precision?",
        options: ["Email spam detection", "Medical disease screening", "Product recommendations", "Image captioning"],
        correctAnswer: 1,
        explanation: "In medical screening, we want to catch all positive cases (high recall) even if we have some false positives",
        xpReward: 50
      },
      {
        id: "ml-4-2",
        question: "What does 5-fold cross-validation do?",
        options: ["Trains 5 models on same data", "Splits data 5 ways and validates each", "Uses 5 features", "Makes 5 predictions"],
        correctAnswer: 1,
        explanation: "5-fold CV splits data into 5 parts, trains on 4 parts and tests on 1, rotating 5 times",
        xpReward: 50
      },
      {
        id: "ml-4-3",
        question: "What is the purpose of GridSearchCV?",
        options: ["Visualize data", "Find optimal hyperparameters", "Clean data", "Split data"],
        correctAnswer: 1,
        explanation: "GridSearchCV systematically tries all combinations of hyperparameters to find the best ones",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to perform hyperparameter tuning:",
      codeBlocks: [
        "param_grid = {'n_estimators': [50, 100], 'max_depth': [5, 10]}",
        "grid_search = GridSearchCV(RandomForestClassifier(), param_grid, cv=5)",
        "grid_search.fit(X_train, y_train)",
        "best_model = grid_search.best_estimator_"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Define grid, create search, fit, get best model!",
      xpReward: 200
    }
  },
  {
    id: 5,
    title: "The Neural Network Nexus",
    subtitle: "Introduction to Deep Learning",
    icon: "🧬",
    color: "from-pink-600 to-rose-400",
    neonColor: "pink",
    questName: "Unlock Deep Learning",
    questDescription: "Take your first steps into the world of neural networks",
    xpRequired: 1200,
    lessons: [
      {
        title: "Neural Network Basics",
        content: "Neural networks are inspired by the human brain. They learn complex patterns through layers of connected neurons.\n\n**Components:**\n- Input layer: Receives features\n- Hidden layers: Learn patterns\n- Output layer: Makes predictions\n- Activation functions: Add non-linearity",
        codeExample: "from sklearn.neural_network import MLPClassifier\n\n# Create neural network\nmodel = MLPClassifier(\n    hidden_layer_sizes=(100, 50),  # 2 hidden layers\n    activation='relu',\n    solver='adam',\n    max_iter=500,\n    random_state=42\n)\n\n# Train\nmodel.fit(X_train, y_train)\n\n# Evaluate\ntrain_acc = model.score(X_train, y_train)\ntest_acc = model.score(X_test, y_test)\nprint(f\"Train Accuracy: {train_acc:.3f}\")\nprint(f\"Test Accuracy: {test_acc:.3f}\")\n\n# Check convergence\nprint(f\"Iterations: {model.n_iter_}\")\nprint(f\"Loss: {model.loss_:.4f}\")",
        tips: ["Always scale your features for neural networks", "ReLU is the most common activation", "Adam optimizer works well in most cases"]
      },
      {
        title: "Building with TensorFlow/Keras",
        content: "Keras provides a high-level API for building neural networks in TensorFlow.\n\n**Sequential API:**\n- Stack layers one after another\n- Dense = fully connected layer\n- Activation functions after each layer",
        codeExample: "import tensorflow as tf\nfrom tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense, Dropout\n\n# Build model\nmodel = Sequential([\n    Dense(128, activation='relu', input_shape=(n_features,)),\n    Dropout(0.3),\n    Dense(64, activation='relu'),\n    Dropout(0.3),\n    Dense(1, activation='sigmoid')  # Binary classification\n])\n\n# Compile\nmodel.compile(\n    optimizer='adam',\n    loss='binary_crossentropy',\n    metrics=['accuracy']\n)\n\n# Train\nhistory = model.fit(\n    X_train, y_train,\n    epochs=50,\n    batch_size=32,\n    validation_split=0.2,\n    verbose=1\n)\n\n# Evaluate\nloss, accuracy = model.evaluate(X_test, y_test)\nprint(f\"Test Accuracy: {accuracy:.3f}\")",
        tips: ["Dropout prevents overfitting", "Monitor validation loss to detect overfitting", "Use early stopping for better results"]
      },
      {
        title: "Training Deep Networks",
        content: "Training neural networks effectively requires understanding key concepts.\n\n**Key Concepts:**\n- Epochs: Full passes through training data\n- Batch size: Samples per gradient update\n- Learning rate: Step size for updates\n- Callbacks: Actions during training",
        codeExample: "from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint\n\n# Callbacks\nearly_stop = EarlyStopping(\n    monitor='val_loss',\n    patience=10,\n    restore_best_weights=True\n)\n\ncheckpoint = ModelCheckpoint(\n    'best_model.h5',\n    monitor='val_accuracy',\n    save_best_only=True\n)\n\n# Train with callbacks\nhistory = model.fit(\n    X_train, y_train,\n    epochs=100,\n    batch_size=32,\n    validation_split=0.2,\n    callbacks=[early_stop, checkpoint]\n)\n\n# Plot training history\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(12, 4))\nplt.subplot(1, 2, 1)\nplt.plot(history.history['loss'], label='Train')\nplt.plot(history.history['val_loss'], label='Validation')\nplt.title('Loss')\nplt.legend()\n\nplt.subplot(1, 2, 2)\nplt.plot(history.history['accuracy'], label='Train')\nplt.plot(history.history['val_accuracy'], label='Validation')\nplt.title('Accuracy')\nplt.legend()\nplt.show()",
        tips: ["Early stopping prevents overfitting", "Save best model during training", "Plot learning curves to diagnose issues"]
      }
    ],
    challenges: [
      {
        id: "ml-5-1",
        question: "What is the purpose of activation functions in neural networks?",
        options: ["Speed up training", "Add non-linearity", "Reduce memory usage", "Increase accuracy"],
        correctAnswer: 1,
        explanation: "Activation functions add non-linearity, allowing networks to learn complex patterns beyond linear relationships",
        xpReward: 50
      },
      {
        id: "ml-5-2",
        question: "What does Dropout do?",
        options: ["Speeds up training", "Randomly ignores neurons to prevent overfitting", "Adds more neurons", "Removes bad data"],
        correctAnswer: 1,
        explanation: "Dropout randomly sets a fraction of neurons to zero during training, preventing the network from relying too heavily on specific neurons",
        xpReward: 50
      },
      {
        id: "ml-5-3",
        question: "What is an epoch in neural network training?",
        options: ["One gradient update", "One pass through all training data", "One batch of data", "One prediction"],
        correctAnswer: 1,
        explanation: "An epoch is one complete pass through the entire training dataset",
        xpReward: 50
      }
    ],
    bossFight: {
      question: "Arrange the code to build and train a Keras neural network:",
      codeBlocks: [
        "model = Sequential([Dense(64, activation='relu'), Dense(1, activation='sigmoid')])",
        "model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])",
        "model.fit(X_train, y_train, epochs=50, validation_split=0.2)",
        "accuracy = model.evaluate(X_test, y_test)[1]"
      ],
      correctOrder: [0, 1, 2, 3],
      explanation: "Build model, compile it, train it, evaluate it! You've completed the ML journey!",
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
  completedVideos?: number[]; // Optional for courses that don't track videos
}

export const getInitialProgress = (): CourseProgress => ({
  currentLevel: 1,
  totalXP: 0,
  completedModules: [],
  completedChallenges: [],
  completedBossFights: []
});

export const ML_STORAGE_KEY = 'ml_course_progress';
