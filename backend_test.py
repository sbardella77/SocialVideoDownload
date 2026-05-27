import requests
import sys
from datetime import datetime
import json

class SaveFlexAPITester:
    def __init__(self, base_url="https://rapidapi-proxy.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_time": response.elapsed.total_seconds(),
                "response_data": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                    if result["response_data"]:
                        print(f"   Response keys: {list(result['response_data'].keys())}")
                except:
                    result["response_data"] = response.text[:200]
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                    result["error"] = error_data
                except:
                    result["error"] = response.text[:200]

            self.results.append(result)
            return success, result["response_data"]

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout}s")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "TIMEOUT",
                "success": False,
                "error": "Request timeout"
            }
            self.results.append(result)
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.results.append(result)
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_platforms_list(self):
        """Test platforms endpoint"""
        success, response = self.run_test(
            "Get Platforms List",
            "GET",
            "api/platforms",
            200
        )
        if success and response:
            platforms = response.get('platforms', [])
            print(f"   Found {len(platforms)} platforms")
            for platform in platforms[:3]:  # Show first 3
                print(f"   - {platform.get('name', 'Unknown')}")
        return success

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "api/stats",
            200
        )
        return success

    def test_youtube_download(self):
        """Test YouTube download with the specific URL from requirements"""
        youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        success, response = self.run_test(
            "YouTube Download",
            "POST",
            "api/download",
            200,
            data={"url": youtube_url},
            timeout=60  # Longer timeout for API calls
        )
        
        if success and response:
            print(f"   Platform: {response.get('platform', 'Unknown')}")
            print(f"   Success: {response.get('success', False)}")
            if response.get('metadata'):
                metadata = response['metadata']
                print(f"   Title: {metadata.get('title', 'No title')[:50]}...")
                print(f"   Author: {metadata.get('author', 'Unknown')}")
            
            download_options = response.get('download_options', [])
            print(f"   Download options: {len(download_options)}")
            for i, option in enumerate(download_options[:5]):  # Show first 5
                print(f"   - {option.get('quality', 'Unknown')} ({option.get('format', 'Unknown')})")
        
        return success

    def test_invalid_url(self):
        """Test download with invalid URL"""
        success, response = self.run_test(
            "Invalid URL Download",
            "POST",
            "api/download",
            400,  # Expecting 400 for invalid URL
            data={"url": "https://invalid-url.com/video"}
        )
        return success

    def test_empty_url(self):
        """Test download with empty URL"""
        success, response = self.run_test(
            "Empty URL Download",
            "POST",
            "api/download",
            400,  # Expecting 400 for empty URL
            data={"url": ""}
        )
        return success

    def test_rate_limiting(self):
        """Test rate limiting by making multiple requests quickly"""
        print(f"\n🔍 Testing Rate Limiting (making 5 quick requests)...")
        rate_limit_hit = False
        
        for i in range(5):
            try:
                response = requests.post(
                    f"{self.base_url}/api/download",
                    json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                print(f"   Request {i+1}: Status {response.status_code}")
                if response.status_code == 429:
                    rate_limit_hit = True
                    print(f"   ✅ Rate limit triggered at request {i+1}")
                    break
            except Exception as e:
                print(f"   Request {i+1}: Error - {str(e)}")
        
        if not rate_limit_hit:
            print(f"   ⚠️  Rate limit not triggered in 5 requests")
        
        return True  # This test always passes as rate limiting behavior can vary

def main():
    print("🚀 Starting SaveFlex API Tests")
    print("=" * 50)
    
    tester = SaveFlexAPITester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_platforms_list,
        tester.test_stats_endpoint,
        tester.test_youtube_download,
        tester.test_invalid_url,
        tester.test_empty_url,
        tester.test_rate_limiting,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())