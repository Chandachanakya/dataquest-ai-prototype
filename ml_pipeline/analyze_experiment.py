"""
Experiment Analysis Script
Analyzes A/B test results comparing ML vs heuristic personalization.

Usage:
    python analyze_experiment.py --experiment ml_vs_heuristic
"""

import argparse
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def load_experiment_data(experiment_name: str):
    """Load experiment groups and metrics from Supabase"""
    
    # Load experiment groups
    groups_response = supabase.table('experiment_groups').select('*').eq('experiment_name', experiment_name).execute()
    groups_df = pd.DataFrame(groups_response.data)
    
    # Load experiment metrics
    metrics_response = supabase.table('experiment_metrics').select('*').eq('experiment_name', experiment_name).execute()
    metrics_df = pd.DataFrame(metrics_response.data)
    
    return groups_df, metrics_df


def calculate_cohen_d(group1, group2):
    """Calculate Cohen's d effect size"""
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
    return (np.mean(group1) - np.mean(group2)) / pooled_std


def analyze_metric(control_values, treatment_values, metric_name):
    """Perform statistical analysis on a single metric"""
    
    # Descriptive statistics
    control_mean = np.mean(control_values)
    control_std = np.std(control_values)
    treatment_mean = np.mean(treatment_values)
    treatment_std = np.std(treatment_values)
    
    # T-test
    t_stat, p_value = stats.ttest_ind(control_values, treatment_values)
    
    # Effect size
    effect_size = calculate_cohen_d(control_values, treatment_values)
    
    # Confidence intervals (95%)
    control_ci = stats.t.interval(0.95, len(control_values)-1, 
                                   loc=control_mean, 
                                   scale=stats.sem(control_values))
    treatment_ci = stats.t.interval(0.95, len(treatment_values)-1,
                                     loc=treatment_mean,
                                     scale=stats.sem(treatment_values))
    
    return {
        'metric': metric_name,
        'control_mean': control_mean,
        'control_std': control_std,
        'control_n': len(control_values),
        'control_ci': control_ci,
        'treatment_mean': treatment_mean,
        'treatment_std': treatment_std,
        'treatment_n': len(treatment_values),
        'treatment_ci': treatment_ci,
        't_statistic': t_stat,
        'p_value': p_value,
        'effect_size': effect_size,
        'significant': p_value < 0.05
    }


def plot_metric_comparison(results_df, output_dir='./experiment_results'):
    """Create visualization comparing metrics"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Set style
    sns.set_style('whitegrid')
    
    # Create comparison plot
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    fig.suptitle('ML vs Heuristic A/B Test Results', fontsize=16, fontweight='bold')
    
    metrics = results_df['metric'].tolist()
    
    for idx, (ax, metric) in enumerate(zip(axes.flat, metrics)):
        row = results_df[results_df['metric'] == metric].iloc[0]
        
        # Bar plot with error bars
        x = ['Control\n(Heuristic)', 'Treatment\n(ML)']
        y = [row['control_mean'], row['treatment_mean']]
        yerr = [row['control_std'], row['treatment_std']]
        
        colors = ['#3498db', '#2ecc71']
        bars = ax.bar(x, y, yerr=yerr, capsize=5, color=colors, alpha=0.7, edgecolor='black')
        
        # Add significance marker
        if row['significant']:
            max_y = max(y) + max(yerr)
            ax.text(0.5, max_y * 1.1, '***' if row['p_value'] < 0.001 else '**' if row['p_value'] < 0.01 else '*',
                   ha='center', fontsize=16, fontweight='bold')
        
        # Labels
        ax.set_ylabel(metric.replace('_', ' ').title())
        ax.set_title(f"p={row['p_value']:.4f}, d={row['effect_size']:.2f}")
        
        # Add value labels on bars
        for bar, val in zip(bars, y):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{val:.2f}',
                   ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(f'{output_dir}/metric_comparison.png', dpi=300, bbox_inches='tight')
    print(f"✅ Saved visualization: {output_dir}/metric_comparison.png")


def generate_report(results_df, groups_df, output_dir='./experiment_results'):
    """Generate markdown report"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    report = f"""# A/B Test Results: ML vs Heuristic Personalization

## Experiment Overview

- **Experiment Name**: ml_vs_heuristic
- **Start Date**: {groups_df['assigned_at'].min()}
- **End Date**: {groups_df['assigned_at'].max()}
- **Total Users**: {len(groups_df)}
- **Control Group (Heuristic)**: {len(groups_df[groups_df['group_name'] == 'control'])} users
- **Treatment Group (ML)**: {len(groups_df[groups_df['group_name'] == 'treatment'])} users

---

## Results Summary

| Metric | Control (Heuristic) | Treatment (ML) | p-value | Effect Size (Cohen's d) | Significant? |
|--------|---------------------|----------------|---------|-------------------------|--------------|
"""
    
    for _, row in results_df.iterrows():
        sig_marker = '✅ Yes' if row['significant'] else '❌ No'
        report += f"| {row['metric'].replace('_', ' ').title()} | {row['control_mean']:.2f} ± {row['control_std']:.2f} | {row['treatment_mean']:.2f} ± {row['treatment_std']:.2f} | {row['p_value']:.4f} | {row['effect_size']:.2f} | {sig_marker} |\n"
    
    report += "\n---\n\n## Detailed Analysis\n\n"
    
    for _, row in results_df.iterrows():
        metric = row['metric'].replace('_', ' ').title()
        report += f"### {metric}\n\n"
        report += f"- **Control Group**: {row['control_mean']:.2f} (SD={row['control_std']:.2f}, n={row['control_n']})\n"
        report += f"- **Treatment Group**: {row['treatment_mean']:.2f} (SD={row['treatment_std']:.2f}, n={row['treatment_n']})\n"
        report += f"- **Statistical Test**: t({row['control_n'] + row['treatment_n'] - 2}) = {row['t_statistic']:.2f}, p = {row['p_value']:.4f}\n"
        report += f"- **Effect Size**: Cohen's d = {row['effect_size']:.2f}\n"
        
        if row['significant']:
            direction = "higher" if row['treatment_mean'] > row['control_mean'] else "lower"
            report += f"- **Result**: ✅ **Significant difference** - Treatment group has {direction} {metric.lower()}\n"
        else:
            report += f"- **Result**: ❌ No significant difference detected\n"
        
        report += "\n"
    
    report += "---\n\n## Recommendation\n\n"
    
    # Decision logic
    significant_improvements = results_df[
        (results_df['significant']) & 
        (results_df['treatment_mean'] > results_df['control_mean'])
    ]
    
    if len(significant_improvements) >= 2:
        report += "### ✅ **Ship ML Personalization**\n\n"
        report += "The ML-driven approach shows significant improvements in key metrics. Recommend rolling out to all users.\n"
    else:
        report += "### ⚠️ **Keep Heuristics**\n\n"
        report += "No significant improvements detected. Recommend keeping the existing heuristic approach.\n"
    
    # Save report
    with open(f'{output_dir}/experiment_report.md', 'w') as f:
        f.write(report)
    
    print(f"✅ Saved report: {output_dir}/experiment_report.md")


def main():
    parser = argparse.ArgumentParser(description='Analyze A/B test experiment results')
    parser.add_argument('--experiment', default='ml_vs_heuristic', help='Experiment name')
    parser.add_argument('--output', default='./experiment_results', help='Output directory')
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"A/B TEST ANALYSIS: {args.experiment}")
    print(f"{'='*60}\n")
    
    # Load data
    print("📊 Loading experiment data...")
    groups_df, metrics_df = load_experiment_data(args.experiment)
    
    if len(groups_df) == 0:
        print("❌ No experiment data found!")
        return
    
    print(f"✅ Loaded {len(groups_df)} users, {len(metrics_df)} metrics\n")
    
    # Merge groups and metrics
    merged_df = metrics_df.merge(groups_df[['user_id', 'group_name']], on='user_id')
    
    # Analyze each metric
    results = []
    metric_names = merged_df['metric_name'].unique()
    
    print("🔬 Analyzing metrics...\n")
    
    for metric in metric_names:
        metric_data = merged_df[merged_df['metric_name'] == metric]
        
        control = metric_data[metric_data['group_name'] == 'control']['metric_value'].values
        treatment = metric_data[metric_data['group_name'] == 'treatment']['metric_value'].values
        
        if len(control) < 2 or len(treatment) < 2:
            print(f"⚠️  Skipping {metric} - insufficient data")
            continue
        
        result = analyze_metric(control, treatment, metric)
        results.append(result)
        
        print(f"  {metric}:")
        print(f"    Control: {result['control_mean']:.2f} ± {result['control_std']:.2f}")
        print(f"    Treatment: {result['treatment_mean']:.2f} ± {result['treatment_std']:.2f}")
        print(f"    p-value: {result['p_value']:.4f} {'✅ Significant' if result['significant'] else '❌ Not significant'}")
        print()
    
    if not results:
        print("❌ No metrics to analyze!")
        return
    
    results_df = pd.DataFrame(results)
    
    # Generate visualizations
    print("📈 Creating visualizations...")
    plot_metric_comparison(results_df, args.output)
    
    # Generate report
    print("📝 Generating report...")
    generate_report(results_df, groups_df, args.output)
    
    print(f"\n{'='*60}")
    print("✅ ANALYSIS COMPLETE")
    print(f"{'='*60}\n")
    print(f"Results saved to: {args.output}/")


if __name__ == '__main__':
    main()
