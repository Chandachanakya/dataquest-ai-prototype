"""Genuine Python/TypeScript feature-parity and cold-start regression tests."""
import asyncio, csv, json, math, subprocess, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST_DIR = Path(__file__).resolve().parent
FEATURES = ['days_since_last_active','activity_frequency','average_score','total_attempts','completion_time_vs_median','retry_ratio','score_variance','recent_xp_velocity','completion_rate','avg_difficulty']
BASELINE = 599.0

def timestamp(value):
    try: return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc)
    except (ValueError, AttributeError): return None

def num(value, default=0.0):
    try:
        n = float(value)
        return n if math.isfinite(n) else default
    except (TypeError, ValueError): return default

def r(value, places): return float(f'{value:.{places}f}')

def python_features(attempts, reference_time):
    ref = timestamp(reference_time)
    rows = [(a, timestamp(a.get('started_at'))) for a in attempts]
    rows = [(a, t) for a, t in rows if t and t <= ref]
    if not rows: return dict(zip(FEATURES, [30,0,0,0,1,1,0,0,0,1]))
    scores = [num(a.get('score')) for a, _ in rows]
    diffs = [min(6, max(1, num(a.get('difficulty'), 1))) for a, _ in rows]
    total = len(rows); latest = max(t for _, t in rows)
    completed = [a for a, _ in rows if a.get('status') == 'completed']
    completed_times = [num(a.get('completion_time')) for a in completed if num(a.get('completion_time')) > 0]
    mean_time = sum(completed_times)/len(completed_times) if completed_times else BASELINE
    active = {t.date().isoformat() for _, t in rows if t >= ref - timedelta(days=30)}
    recent = sum(num(a.get('score')) for a,t in rows if t >= ref - timedelta(days=7))
    mean = sum(scores)/total
    std = math.sqrt(sum((x-mean)**2 for x in scores)/(total-1)) if total > 1 else 0
    return {'days_since_last_active':r(max(0,(ref-latest).total_seconds()/86400),2),'activity_frequency':len(active),'average_score':r(sum(s/(d*10)*100 for s,d in zip(scores,diffs))/total,2),'total_attempts':total,'completion_time_vs_median':r(mean_time/BASELINE,4),'retry_ratio':r(total/len({a.get('quest_id') for a,_ in rows}),4),'score_variance':r(std,2),'recent_xp_velocity':r(recent/7,4),'completion_rate':r(len(completed)/total,4),'avg_difficulty':r(sum(diffs)/total,2)}

def execute_typescript(fixtures_path):
    frontend = ROOT / 'frontend'; build = frontend / '.feature-test-build'
    command = [str(frontend/'node_modules/.bin/tsc.cmd'), '--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','--esModuleInterop','--skipLibCheck','--outDir',str(build),'--rootDir',str(frontend), 'src/lib/learnerFeatures.ts','tests/runFeatureFixtures.ts']
    subprocess.run(command, cwd=frontend, check=True, capture_output=True, text=True)
    output = subprocess.run(['node', str(build/'tests/runFeatureFixtures.js'), str(fixtures_path)], cwd=frontend, check=True, capture_output=True, text=True)
    return {item['name']: item['features'] for item in json.loads(output.stdout)}

def test_cross_language_parity():
    fixtures_path = TEST_DIR / 'feature_fixtures.json'; fixtures = json.loads(fixtures_path.read_text())
    ts = execute_typescript(fixtures_path); report = []
    for fixture in fixtures:
        py = python_features(fixture['attempts'], fixture['reference_time']); actual = ts[fixture['name']]
        differences = {name: abs(py[name] - actual[name]) for name in FEATURES}
        report.append({'scenario':fixture['name'],'python_features':py,'typescript_features':actual,'absolute_differences':differences,'passed':max(differences.values()) == 0})
    (TEST_DIR/'validation_results.json').write_text(json.dumps({'baseline_seconds':BASELINE,'all_passed':all(x['passed'] for x in report),'scenarios':report}, indent=2))
    assert all(x['passed'] for x in report), report

def test_baseline_matches_committed_raw_dataset():
    values = sorted(float(row['completion_time']) for row in csv.DictReader((ROOT/'backend/ml_pipeline/data/quest_attempts.csv').open()))
    assert len(values) == 3203
    assert values[len(values)//2] == BASELINE

def test_cold_start_policy_contract():
    # Frontend state guard and actual backend endpoint reserve cold start for zero only.
    engine = (ROOT/'frontend/src/lib/learnerEngine.ts').read_text(); api = (ROOT/'backend/api/main.py').read_text()
    assert 'metrics.total_attempts === 0' in engine
    assert 'total_attempts == 0.0' in api
    sys.path.insert(0, str(ROOT/'backend/api'))
    import main
    from schemas import DropRiskRequest
    zero = asyncio.run(main.predict_drop_risk_endpoint(DropRiskRequest(user_id='new', features={'total_attempts': 0})))
    dormant = asyncio.run(main.predict_drop_risk_endpoint(DropRiskRequest(user_id='returning', features={'total_attempts': 2, 'days_since_last_active': 45})))
    assert zero.model_version.endswith(':cold_start')
    assert not dormant.model_version.endswith(':cold_start')

if __name__ == '__main__':
    test_cross_language_parity()
    test_baseline_matches_committed_raw_dataset()
    test_cold_start_policy_contract()
    print('PASS: cross-language feature parity, baseline, and cold-start contracts')
