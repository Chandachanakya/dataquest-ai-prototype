import { readFileSync } from 'node:fs';
import { calculateFeatureVector, isNewLearner } from '../src/lib/learnerFeatures.js';

const fixturePath = process.argv[2];
if (!fixturePath) throw new Error('Usage: runFeatureFixtures <fixtures.json>');
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
console.log(JSON.stringify(fixtures.map((fixture: any) => ({
  name: fixture.name,
  features: calculateFeatureVector(fixture.attempts, fixture.reference_time),
  frontend_new_learner: isNewLearner(calculateFeatureVector(fixture.attempts, fixture.reference_time).total_attempts),
})), null, 2));
