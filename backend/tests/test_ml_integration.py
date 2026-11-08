"""
Integration Test Script for ML API
Tests the complete ML pipeline integration with TypeScript frontend.

Tests:
1. ML API health check
2. Drop risk prediction endpoint
3. Intervention recommendation endpoint
4. Next quest recommendation endpoint
5. Error handling and fallback behavior
"""

import requests
import json
from datetime import datetime

# Configuration
ML_API_URL = "http://localhost:8000"
TEST_USER_ID = "test-user-123"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST: {name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")

def print_info(message):
    print(f"ℹ️  {message}")


# Test 1: Health Check
def run_health_check():
    print_test("Health Check")
    
    try:
        response = requests.get(f"{ML_API_URL}/", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success("ML API is running")
            print_info(f"Service: {data.get('service')}")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Model Version: {data.get('model_version')}")
            print_info(f"Using Real Model: {data.get('using_real_model')}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Cannot connect to ML API: {e}")
        print_warning("Make sure the API is running: cd api && python main.py")
        return False


# Test 2: Drop Risk Prediction
def run_drop_risk_prediction():
    print_test("Drop Risk Prediction")
    
    # Test case 1: High risk user
    print_info("Test Case 1: High risk user (inactive for 15 days)")
    payload = {
        "user_id": TEST_USER_ID,
        "days_since_last_active": 15,
        "activity_frequency": 2,
        "average_score": 45.0,
        "total_attempts": 10,
        "completion_time_vs_median": 1.5,
        "retry_ratio": 2.0,
        "score_variance": 150.0,
        "recent_xp_velocity": 5.0
    }
    
    try:
        response = requests.post(
            f"{ML_API_URL}/predict/drop-risk",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Prediction successful")
            print_info(f"Risk Level: {data['risk_level']}")
            print_info(f"Probability: {data['probability']:.2%}")
            print_info(f"Model Version: {data['model_version']}")
            print(f"\nFull Response:\n{json.dumps(data, indent=2)}")
            
            # Validate response structure
            assert 'user_id' in data
            assert 'probability' in data
            assert 'risk_level' in data
            assert data['risk_level'] in ['low', 'medium', 'high']
            print_success("Response structure is valid")
            
        else:
            print_error(f"Prediction failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return False
    
    # Test case 2: Low risk user
    print_info("\nTest Case 2: Low risk user (active, good scores)")
    payload2 = {
        "user_id": TEST_USER_ID,
        "days_since_last_active": 1,
        "activity_frequency": 15,
        "average_score": 85.0,
        "total_attempts": 50,
        "completion_time_vs_median": 0.8,
        "retry_ratio": 1.1,
        "score_variance": 50.0,
        "recent_xp_velocity": 200.0
    }
    
    try:
        response = requests.post(
            f"{ML_API_URL}/predict/drop-risk",
            json=payload2,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Prediction successful")
            print_info(f"Risk Level: {data['risk_level']}")
            print_info(f"Probability: {data['probability']:.2%}")
            
        else:
            print_error(f"Prediction failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return False
    
    return True


# Test 3: Intervention Recommendation
def run_intervention_recommendation():
    print_test("Intervention Recommendation")
    
    payload = {
        "user_id": TEST_USER_ID,
        "context": {
            "learner_state_distribution": {
                "Drop-risk": 0.6,
                "Struggling": 0.3,
                "Consistent": 0.1,
                "Fast": 0.0
            },
            "recent_performance": 55.0,
            "fatigue_score": 0.7
        }
    }
    
    try:
        response = requests.post(
            f"{ML_API_URL}/predict/intervention",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Intervention recommendation successful")
            print_info(f"Intervention Type: {data['intervention_type']}")
            print_info(f"Expected Reward: {data['expected_reward']:.2f}")
            print_info(f"Confidence: {data['confidence']:.2f}")
            print_info(f"Reason: {data['reason']}")
            print(f"\nFull Response:\n{json.dumps(data, indent=2)}")
            
            # Validate response
            assert 'intervention_type' in data
            assert 'expected_reward' in data
            print_success("Response structure is valid")
            return True
            
        else:
            print_error(f"Intervention prediction failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return False


# Test 4: Next Quest Recommendation
def run_next_quest_recommendation():
    print_test("Next Quest Recommendation")
    
    payload = {
        "user_id": TEST_USER_ID,
        "available_quests": [
            {"id": "quest-python-1", "difficulty": "beginner", "topic": "python"},
            {"id": "quest-ml-1", "difficulty": "intermediate", "topic": "ml"},
            {"id": "quest-viz-1", "difficulty": "beginner", "topic": "visualization"}
        ],
        "user_state": {
            "current_level": 5,
            "recent_topics": ["python", "data-structures"],
            "average_score": 75.0
        }
    }
    
    try:
        response = requests.post(
            f"{ML_API_URL}/predict/next-quest",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Quest recommendation successful")
            print_info(f"Recommended Quest: {data['quest_id']}")
            print_info(f"Expected Reward: {data['expected_reward']:.2f}")
            print_info(f"Reason: {data['reason']}")
            print(f"\nFull Response:\n{json.dumps(data, indent=2)}")
            
            # Validate response
            assert 'quest_id' in data
            assert 'expected_reward' in data
            print_success("Response structure is valid")
            return True
            
        else:
            print_error(f"Quest prediction failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return False


# Test 5: Error Handling
def run_error_handling():
    print_test("Error Handling")
    
    # Test invalid payload
    print_info("Test Case: Invalid payload (missing required fields)")
    payload = {
        "user_id": TEST_USER_ID
        # Missing required features
    }
    
    try:
        response = requests.post(
            f"{ML_API_URL}/predict/drop-risk",
            json=payload,
            timeout=5
        )
        
        # Should still return 200 with mock prediction
        if response.status_code == 200:
            print_success("API handles missing features gracefully")
            data = response.json()
            print_info(f"Risk Level: {data['risk_level']}")
        else:
            print_warning(f"API returned error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return False
    
    return True


# Main test runner
def test_health_check():
    assert run_health_check()

def test_drop_risk_prediction():
    assert run_drop_risk_prediction()

def test_intervention_recommendation():
    assert run_intervention_recommendation()

def test_next_quest_recommendation():
    assert run_next_quest_recommendation()

def test_error_handling():
    assert run_error_handling()

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}ML API INTEGRATION TEST SUITE{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API URL: {ML_API_URL}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    results = {}
    
    # Run tests
    results['health_check'] = run_health_check()
    
    if results['health_check']:
        results['drop_risk'] = run_drop_risk_prediction()
        results['intervention'] = run_intervention_recommendation()
        results['next_quest'] = run_next_quest_recommendation()
        results['error_handling'] = run_error_handling()
    else:
        print_error("\nSkipping remaining tests - API is not available")
        results['drop_risk'] = False
        results['intervention'] = False
        results['next_quest'] = False
        results['error_handling'] = False
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}✅ ALL TESTS PASSED!{RESET}")
        print(f"\n{GREEN}The ML API integration is working correctly.{RESET}")
        print(f"{GREEN}You can now enable it in the frontend by setting:{RESET}")
        print(f"{GREEN}VITE_USE_ML_API=true in your .env file{RESET}")
    else:
        print(f"\n{RED}❌ SOME TESTS FAILED{RESET}")
        print(f"{YELLOW}Please check the errors above and fix them.{RESET}")
    
    print(f"\n{BLUE}{'='*60}{RESET}\n")


if __name__ == "__main__":
    main()
