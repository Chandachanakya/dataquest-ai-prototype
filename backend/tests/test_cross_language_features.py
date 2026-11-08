"""Genuine Python/TypeScript feature-parity and cold-start regression tests."""
import asyncio, csv, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST_DIR = Path(__file__).resolve().parent
FEATURES = ['days_since_last_active','activity_frequency','average_score','total_attempts','completion_time_vs_median','retry_ratio','score_variance','recent_xp_velocity','completion_rate','avg_difficulty']
BASELINE = 576.0
sys.path.insert(0, str(ROOT / 'backend' / 'ml_pipeline'))
from engineer_features import calculate_user_features

def python_features(fixture):
    """Run the real training implementation using an adapter for TS fixtures."""
    import pandas as pd
    user_id = fixture['name']
    rows = [{
        'user_id': user_id, 'persona_type': 'fixture', 'quest_id': a['quest_id'],
        'difficulty': a.get('difficulty'), 'score': a.get('score'),
        'completion_time': a.get('completion_time'),
        'completed': a.get('status') == 'completed', 'timestamp': a.get('started_at'),
    } for a in fixture['attempts']]
    frame = pd.DataFrame(rows, columns=['user_id','persona_type','quest_id','difficulty','score','completion_time','completed','timestamp'])
    result = calculate_user_features(frame, reference_time=fixture['reference_time'],
                                     dataset_median_time=BASELINE, user_ids=[user_id])
    return {name: float(result.iloc[0][name]) for name in FEATURES}

def execute_typescript(fixtures_path):
    frontend = ROOT / 'frontend'; build = frontend / '.feature-test-build'
    command = [str(frontend/'node_modules/.bin/tsc.cmd'), '--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','--esModuleInterop','--skipLibCheck','--outDir',str(build),'--rootDir',str(frontend), 'src/lib/learnerFeatures.ts','tests/runFeatureFixtures.ts']
    subprocess.run(command, cwd=frontend, check=True, capture_output=True, text=True)
    output = subprocess.run(['node', str(build/'tests/runFeatureFixtures.js'), str(fixtures_path)], cwd=frontend, check=True, capture_output=True, text=True)
    return {item['name']: item for item in json.loads(output.stdout)}

def test_cross_language_parity():
    fixtures_path = TEST_DIR / 'feature_fixtures.json'; fixtures = json.loads(fixtures_path.read_text())
    ts = execute_typescript(fixtures_path); report = []
    for fixture in fixtures:
        py = python_features(fixture); actual = ts[fixture['name']]['features']
        differences = {name: abs(py[name] - actual[name]) for name in FEATURES}
        report.append({'scenario':fixture['name'],'python_features':py,'typescript_features':actual,'absolute_differences':differences,'passed':max(differences.values()) == 0})
    (TEST_DIR/'validation_results.json').write_text(json.dumps({'baseline_seconds':BASELINE,'all_passed':all(x['passed'] for x in report),'scenarios':report}, indent=2))
    assert all(x['passed'] for x in report), report

def test_baseline_matches_committed_raw_dataset():
    values = sorted(float(row['completion_time']) for row in csv.DictReader((ROOT/'backend/ml_pipeline/data/quest_attempts.csv').open()))
    assert len(values) == 2865
    assert values[len(values)//2] == BASELINE

def test_cold_start_policy_contract():
    # Frontend state guard and actual backend endpoint reserve cold start for zero only.
    engine = (ROOT/'frontend/src/lib/learnerEngine.ts').read_text(); api = (ROOT/'backend/api/main.py').read_text()
    assert 'isNewLearner(metrics.total_attempts)' in engine
    assert 'total_attempts == 0.0' in api
    sys.path.insert(0, str(ROOT/'backend/api'))
    import main
    from schemas import DropRiskRequest
    zero = asyncio.run(main.predict_drop_risk_endpoint(DropRiskRequest(user_id='new', features={'total_attempts': 0})))
    dormant = asyncio.run(main.predict_drop_risk_endpoint(DropRiskRequest(user_id='returning', features={'total_attempts': 2, 'days_since_last_active': 45})))
    assert zero.model_version.endswith(':cold_start')
    assert not dormant.model_version.endswith(':cold_start')
    frontend = execute_typescript(TEST_DIR / 'feature_fixtures.json')
    assert frontend['zero_attempt']['frontend_new_learner'] is True
    assert frontend['dormant_returning_over_30_days']['frontend_new_learner'] is False

def test_synthetic_generation_reproducibility():
    sys.path.insert(0, str(ROOT / 'backend' / 'ml_pipeline'))
    from generate_training_data import simulate_users, RANDOM_SEED, GENERATION_TIMESTAMP
    first = simulate_users(num_users=20, seed=RANDOM_SEED, generation_timestamp=GENERATION_TIMESTAMP)
    second = simulate_users(num_users=20, seed=RANDOM_SEED, generation_timestamp=GENERATION_TIMESTAMP)
    assert first.to_csv(index=False) == second.to_csv(index=False)

if __name__ == '__main__':
    test_cross_language_parity()
    test_baseline_matches_committed_raw_dataset()
    test_cold_start_policy_contract()
    test_synthetic_generation_reproducibility()
    print('PASS: cross-language feature parity, baseline, and cold-start contracts')
