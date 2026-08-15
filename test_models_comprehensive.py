"""
Comprehensive AI Model Testing Script
======================================

Tests Gemini and OpenAI models with 3 different types of questions:
1. Technical Questions (understanding_agent scenario)
2. Requirement Analysis (requirement_categorization scenario)
3. Test Generation (test_cases scenario)

Shows how integration happens in the webapp and displays performance metrics.
"""

import json
import time
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import requests


# ============================================================================
# CONFIGURATION & KEY MANAGEMENT
# ============================================================================

class KeyManager:
    """Loads and manages all available AI keys from the keys folder."""
    
    def __init__(self, keys_dir: Path = None):
        if keys_dir is None:
            keys_dir = Path(__file__).parent / "keys"
        self.keys_dir = keys_dir
        self.gemini_keys: List[str] = []
        self.openai_keys: List[str] = []
        self._load_keys()
    
    def _load_keys(self):
        """Load all available keys from key files."""
        # Load Gemini keys
        gemini_files = [
            "gemini keys.txt",
            "gemini keys 2.txt",
            "gemini keys 3.txt",
        ]
        
        for file in gemini_files:
            file_path = self.keys_dir / file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        keys = [line.strip() for line in f if line.strip()]
                        self.gemini_keys.extend(keys)
                        print(f"✓ Loaded {len(keys)} Gemini key(s) from {file}")
                except Exception as e:
                    print(f"✗ Error loading {file}: {e}")
        
        # Load OpenAI keys
        openai_file = self.keys_dir / "openai keys.txt"
        if openai_file.exists():
            try:
                with open(openai_file, 'r', encoding='utf-8') as f:
                    keys = [line.strip() for line in f if line.strip()]
                    self.openai_keys.extend(keys)
                    print(f"✓ Loaded {len(keys)} OpenAI key(s) from openai keys.txt")
            except Exception as e:
                print(f"✗ Error loading openai keys.txt: {e}")
    
    def get_gemini_keys(self) -> List[str]:
        return [k for k in self.gemini_keys if k]
    
    def get_openai_keys(self) -> List[str]:
        return [k for k in self.openai_keys if k]
    
    def mask_key(self, key: str) -> str:
        """Mask sensitive key information for display."""
        if not key or len(key) < 16:
            return "***[short]***"
        return f"{key[:6]}...{key[-6:]}"


# ============================================================================
# TEST QUESTIONS - 3 DIFFERENT TYPES
# ============================================================================

class TestQuestions:
    """Three types of questions simulating different webapp scenarios."""
    
    TECHNICAL_QUESTIONS = [
        {
            "name": "API Architecture Analysis",
            "scenario": "understanding_agent",
            "question": "Analyze this FastAPI endpoint structure: FastAPI with async routes /api/v1/runs/{run_id}/[stage]/[action]. Explain how to add authentication middleware and what middleware order matters. Also explain the request/response cycle.",
            "expected_focus": "Architecture, middleware ordering, async patterns, authentication flow"
        },
        {
            "name": "Python Async Problem",
            "scenario": "understanding_agent",
            "question": "I have a Python async function that calls database queries sequentially in a loop. Each query takes 500ms. I need to process 10 items. What pattern should I use to parallelize this? Compare asyncio.gather() vs asyncio.TaskGroup(). What are the error handling differences?",
            "expected_focus": "Async patterns, concurrency, error handling, performance"
        },
        {
            "name": "TypeScript Type Safety",
            "scenario": "understanding_agent",
            "question": "How would you type a React hook that accepts different event handlers for different component types? Example: for Button need (onClick: MouseEvent), for Input need (onChange: ChangeEvent<HTMLInputElement>). Should I use function overloads or generics? What's the best practice?",
            "expected_focus": "TypeScript generics, overloads, React patterns, type safety"
        }
    ]
    
    REQUIREMENT_QUESTIONS = [
        {
            "name": "E-commerce Requirement",
            "scenario": "requirement_categorization",
            "question": """
            Requirement: "As a customer, I should be able to filter products by price range, color, and brand. 
            Filters should update results in real-time without page reload. 
            The page should show 'No results' if no products match. 
            Filters should be saved in URL query params so I can share filtered searches."
            
            Please categorize this requirement into: Functional requirements, Non-functional requirements, 
            User interface requirements, API requirements, and Database requirements. 
            For each category, provide specific acceptance criteria.
            """,
            "expected_focus": "Requirement decomposition, functional vs non-functional, acceptance criteria"
        },
        {
            "name": "Mobile App Requirement",
            "scenario": "requirement_categorization",
            "question": """
            Requirement: "Users should receive push notifications when their order status changes. 
            The app should store notification history and let users customize notification frequency. 
            Notifications should work offline but sync when internet returns."
            
            Break this down into: Core features, Edge cases, Performance requirements, 
            Storage requirements, and Network requirements. Identify any potential conflicts.
            """,
            "expected_focus": "Feature breakdown, edge cases, offline-first patterns, conflicts"
        },
        {
            "name": "Payment System Requirement",
            "scenario": "requirement_categorization",
            "question": """
            Requirement: "Process credit card payments securely. Support multiple payment methods 
            (credit card, debit card, digital wallets). Provide payment receipt. 
            Implement fraud detection. Store minimal PCI data. Comply with PCI DSS level 1."
            
            Categorize by: Security requirements, Compliance requirements, Feature requirements, 
            Data storage requirements, and API integration requirements.
            """,
            "expected_focus": "Security, compliance, standards, data classification"
        }
    ]
    
    TEST_GENERATION_QUESTIONS = [
        {
            "name": "Login Test Generation",
            "scenario": "test_cases",
            "question": """
            Feature to test: User login with email and password.
            Success criteria: Valid email + password → logged in, stored token
            
            Generate 10 test cases covering:
            1. Happy path scenarios
            2. Validation edge cases (empty fields, invalid email format)
            3. Security scenarios (wrong password, SQL injection attempts)
            4. Error handling (timeout, network failure)
            5. State management (already logged in, token expiry)
            
            For each test case provide: Test ID, Scenario, Steps, Expected Result.
            """,
            "expected_focus": "Test case structure, edge cases, security testing, error scenarios"
        },
        {
            "name": "Shopping Cart Test Generation",
            "scenario": "test_cases",
            "question": """
            Feature to test: Add item to shopping cart with quantity adjustment.
            
            Create test cases for:
            1. Adding single item
            2. Adding item multiple times (should increment quantity)
            3. Quantity boundary conditions (1 item, max items, 0 items)
            4. Product inventory (out of stock, limited stock)
            5. Price updates and tax calculations
            6. Concurrent add operations
            7. Session persistence
            
            Format each test with: Test ID, Setup, Action, Assert, Teardown.
            """,
            "expected_focus": "Cart logic, state management, boundary testing, concurrency"
        },
        {
            "name": "API Response Validation Test",
            "scenario": "test_cases",
            "question": """
            Endpoint to test: GET /api/v1/products?category=electronics&limit=50
            
            Response schema:
            {
              "data": [{id, name, price, stock}, ...],
              "pagination": {page, total_pages, total_count},
              "metadata": {cached, timestamp}
            }
            
            Generate comprehensive test cases for:
            1. Response structure validation
            2. Data type validation for each field
            3. Pagination boundary conditions
            4. Filter combinations
            5. Performance (large result sets)
            6. Caching behavior
            7. Error responses (invalid filters, permissions)
            
            Include assertions for status codes, headers, and body structure.
            """,
            "expected_focus": "API testing, schema validation, pagination, response contracts"
        }
    ]


# ============================================================================
# MODEL TESTERS
# ============================================================================

class GeminiModelTester:
    """Tests Gemini models via generative API."""
    
    def __init__(self, api_key: str, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()
        self.available_models = []
        self._discover_models()
    
    def _discover_models(self):
        """Discover available Gemini models."""
        try:
            response = self.session.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                params={"key": self.api_key},
                timeout=self.timeout
            )
            if response.status_code == 200:
                models = response.json().get("models", [])
                self.available_models = [
                    m.get("name", "").replace("models/", "")
                    for m in models
                    if "generateContent" in m.get("supportedGenerationMethods", [])
                ]
                self.available_models = sorted(self.available_models)
        except Exception as e:
            print(f"  Error discovering Gemini models: {e}")
    
    def test_question(self, question: str, model: str = None, timeout: int = 30) -> Tuple[Optional[str], Dict[str, Any]]:
        """Test a question against a Gemini model."""
        
        if model is None:
            # Use best available model
            if not self.available_models:
                return None, {"error": "No models available"}
            # Prefer latest flash model
            flash_models = [m for m in self.available_models if "flash" in m.lower()]
            model = flash_models[0] if flash_models else self.available_models[0]
        
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": self.api_key},
                json={
                    "contents": [
                        {"parts": [{"text": question}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 2500,
                        "topP": 0.9,
                        "topK": 40
                    }
                },
                timeout=timeout,
                headers={"Content-Type": "application/json"}
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                text = ""
                if "candidates" in data and data["candidates"]:
                    content = data["candidates"][0].get("content", {})
                    if "parts" in content:
                        for part in content["parts"]:
                            if "text" in part:
                                text += part["text"]
                
                return text, {
                    "model": model,
                    "status": "success",
                    "tokens_in": data.get("usageMetadata", {}).get("promptTokenCount", 0),
                    "tokens_out": data.get("usageMetadata", {}).get("candidatesTokenCount", 0),
                    "elapsed_ms": int(elapsed * 1000),
                    "finish_reason": data.get("candidates", [{}])[0].get("finishReason", "UNKNOWN")
                }
            else:
                return None, {
                    "model": model,
                    "status": "error",
                    "error_code": response.status_code,
                    "error_message": response.text[:200],
                    "elapsed_ms": int(elapsed * 1000)
                }
        
        except requests.Timeout:
            return None, {
                "model": model,
                "status": "timeout",
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            return None, {
                "model": model,
                "status": "exception",
                "error": str(e),
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }


class OpenAIModelTester:
    """Tests OpenAI models via ChatCompletion API."""
    
    def __init__(self, api_key: str, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()
        self.available_models = []
        self._discover_models()
    
    def _discover_models(self):
        """Discover available OpenAI models."""
        try:
            response = self.session.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=self.timeout
            )
            if response.status_code == 200:
                models = response.json().get("data", [])
                # Filter to only GPT models that support chat
                self.available_models = [
                    m.get("id", "")
                    for m in models
                    if "gpt" in m.get("id", "").lower()
                ]
                self.available_models = sorted(self.available_models, reverse=True)
        except Exception as e:
            print(f"  Error discovering OpenAI models: {e}")
    
    def test_question(self, question: str, model: str = None, timeout: int = 30) -> Tuple[Optional[str], Dict[str, Any]]:
        """Test a question against an OpenAI model."""
        
        if model is None:
            if not self.available_models:
                return None, {"error": "No models available"}
            # Use best available model
            model = self.available_models[0]
        
        start_time = time.time()
        
        try:
            response = self.session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "user", "content": question}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2500,
                    "top_p": 0.9
                },
                timeout=timeout
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"] if data.get("choices") else ""
                
                return text, {
                    "model": model,
                    "status": "success",
                    "tokens_in": data.get("usage", {}).get("prompt_tokens", 0),
                    "tokens_out": data.get("usage", {}).get("completion_tokens", 0),
                    "elapsed_ms": int(elapsed * 1000),
                    "finish_reason": data.get("choices", [{}])[0].get("finish_reason", "stop")
                }
            else:
                return None, {
                    "model": model,
                    "status": "error",
                    "error_code": response.status_code,
                    "error_message": response.text[:200],
                    "elapsed_ms": int(elapsed * 1000)
                }
        
        except requests.Timeout:
            return None, {
                "model": model,
                "status": "timeout",
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            return None, {
                "model": model,
                "status": "exception",
                "error": str(e),
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }


# ============================================================================
# WEBAPP INTEGRATION ANALYZER
# ============================================================================

class WebappIntegrationAnalyzer:
    """Analyzes how models are used in the webapp."""
    
    @staticmethod
    def print_integration_info():
        """Print how models are integrated in the webapp."""
        print("\n" + "=" * 80)
        print("WEBAPP INTEGRATION POINTS")
        print("=" * 80)
        
        integration_points = {
            "AISettingsPanel.tsx": {
                "location": "src/components/AISettingsPanel.tsx",
                "purpose": "UI component for selecting and configuring AI providers",
                "features": [
                    "Provider selection (Gemini vs OpenAI)",
                    "API key input and validation",
                    "Model discovery display",
                    "Real-time verification"
                ]
            },
            "LLMService": {
                "location": "backend/src/services/llm_service.py",
                "purpose": "Core service for AI provider abstraction",
                "features": [
                    "Multi-key failover support",
                    "Model discovery and ranking",
                    "Retry logic with exponential backoff",
                    "Error classification and handling"
                ]
            },
            "FastAPI Endpoints": {
                "location": "backend/src/api/fastapi_app.py",
                "purpose": "REST API endpoints for AI operations",
                "endpoints": [
                    "/api/v1/ai/settings - Get configured AI settings",
                    "/api/v1/ai/settings/verify - Verify API keys",
                    "/api/v1/runs/{run_id}/understanding - Understanding agent",
                    "/api/v1/runs/{run_id}/test-cases - Test case generation",
                    "/api/v1/runs/{run_id}/requirement-categorization - Requirement analysis"
                ]
            },
            "Agent Pipelines": {
                "location": "backend/src/workflows/pipeline.py",
                "purpose": "Sequential execution of AI agents",
                "agents": [
                    "UnderstandingAgent - Analyzes requirements with AI",
                    "RequirementCategorizationAgent - Breaks down requirements",
                    "TestCasesAgent - Generates test cases with AI",
                    "TestDataAgent - Creates test data",
                    "PlaywrightAgent - Executes tests",
                    "ReportAgent - Generates reports"
                ]
            }
        }
        
        for component, info in integration_points.items():
            print(f"\n📍 {component}")
            print(f"   Location: {info.get('location', 'N/A')}")
            print(f"   Purpose: {info.get('purpose', 'N/A')}")
            
            if "features" in info:
                print("   Features:")
                for feat in info["features"]:
                    print(f"     • {feat}")
            
            if "endpoints" in info:
                print("   Endpoints:")
                for ep in info["endpoints"]:
                    print(f"     • {ep}")
            
            if "agents" in info:
                print("   Agents:")
                for agent in info["agents"]:
                    print(f"     • {agent}")


# ============================================================================
# MAIN TESTER
# ============================================================================

class ComprehensiveModelTester:
    """Main tester orchestrating all tests."""
    
    def __init__(self):
        self.key_manager = KeyManager()
        self.results = {
            "gemini": {},
            "openai": {}
        }
    
    def run_all_tests(self):
        """Run comprehensive tests."""
        print("\n" + "=" * 80)
        print("COMPREHENSIVE AI MODEL TEST SUITE")
        print("=" * 80)
        
        # Show key summary
        self._show_key_summary()
        
        # Test with Gemini
        self._test_gemini()
        
        # Test with OpenAI
        self._test_openai()
        
        # Show integration info
        WebappIntegrationAnalyzer.print_integration_info()
        
        # Print results summary
        self._print_results_summary()
    
    def _show_key_summary(self):
        """Display summary of available keys."""
        print("\n📋 AVAILABLE KEYS")
        print("-" * 80)
        gemini_keys = self.key_manager.get_gemini_keys()
        openai_keys = self.key_manager.get_openai_keys()
        
        print(f"Gemini Keys: {len(gemini_keys)} found")
        for i, key in enumerate(gemini_keys, 1):
            print(f"  {i}. {self.key_manager.mask_key(key)}")
        
        print(f"\nOpenAI Keys: {len(openai_keys)} found")
        for i, key in enumerate(openai_keys, 1):
            print(f"  {i}. {self.key_manager.mask_key(key)}")
    
    def _test_gemini(self):
        """Test Gemini models with all question types."""
        print("\n" + "=" * 80)
        print("GEMINI MODELS TEST")
        print("=" * 80)
        
        gemini_keys = self.key_manager.get_gemini_keys()
        if not gemini_keys:
            print("⚠️  No Gemini keys found. Skipping Gemini tests.")
            return
        
        primary_key = gemini_keys[0]
        print(f"\n🔑 Using Gemini key: {self.key_manager.mask_key(primary_key)}")
        
        tester = GeminiModelTester(primary_key)
        
        print(f"\n📊 Available Gemini models: {len(tester.available_models)}")
        if tester.available_models:
            for model in tester.available_models[:5]:
                print(f"   • {model}")
            if len(tester.available_models) > 5:
                print(f"   ... and {len(tester.available_models) - 5} more")
        
        # Test all question types
        all_questions = (
            TestQuestions.TECHNICAL_QUESTIONS +
            TestQuestions.REQUIREMENT_QUESTIONS +
            TestQuestions.TEST_GENERATION_QUESTIONS
        )
        
        self.results["gemini"]["tests"] = []
        
        for idx, q_dict in enumerate(all_questions, 1):
            print(f"\n🧪 Test {idx}/9: {q_dict['name']}")
            print(f"   Scenario: {q_dict['scenario']}")
            print(f"   Expected Focus: {q_dict['expected_focus']}")
            
            text, metadata = tester.test_question(q_dict['question'])
            
            if text:
                # Show first 300 chars of response
                preview = text[:300].replace("\n", " ")
                print(f"   ✓ Success ({metadata['elapsed_ms']}ms, {metadata['tokens_out']} tokens)")
                print(f"   Model: {metadata['model']}")
                print(f"   Response Preview: {preview}...")
            else:
                print(f"   ✗ Failed: {metadata.get('status', 'unknown')}")
                print(f"   Error: {metadata.get('error_message', metadata.get('error', 'Unknown error'))}")
            
            self.results["gemini"]["tests"].append({
                "question": q_dict['name'],
                "scenario": q_dict['scenario'],
                "success": bool(text),
                "metadata": metadata
            })
    
    def _test_openai(self):
        """Test OpenAI models with all question types."""
        print("\n" + "=" * 80)
        print("OPENAI MODELS TEST")
        print("=" * 80)
        
        openai_keys = self.key_manager.get_openai_keys()
        if not openai_keys:
            print("⚠️  No OpenAI keys found. Skipping OpenAI tests.")
            return
        
        primary_key = openai_keys[0]
        print(f"\n🔑 Using OpenAI key: {self.key_manager.mask_key(primary_key)}")
        
        tester = OpenAIModelTester(primary_key)
        
        print(f"\n📊 Available OpenAI models: {len(tester.available_models)}")
        if tester.available_models:
            for model in tester.available_models[:5]:
                print(f"   • {model}")
            if len(tester.available_models) > 5:
                print(f"   ... and {len(tester.available_models) - 5} more")
        
        # Test all question types
        all_questions = (
            TestQuestions.TECHNICAL_QUESTIONS +
            TestQuestions.REQUIREMENT_QUESTIONS +
            TestQuestions.TEST_GENERATION_QUESTIONS
        )
        
        self.results["openai"]["tests"] = []
        
        for idx, q_dict in enumerate(all_questions, 1):
            print(f"\n🧪 Test {idx}/9: {q_dict['name']}")
            print(f"   Scenario: {q_dict['scenario']}")
            print(f"   Expected Focus: {q_dict['expected_focus']}")
            
            text, metadata = tester.test_question(q_dict['question'])
            
            if text:
                preview = text[:300].replace("\n", " ")
                print(f"   ✓ Success ({metadata['elapsed_ms']}ms, {metadata['tokens_out']} tokens)")
                print(f"   Model: {metadata['model']}")
                print(f"   Response Preview: {preview}...")
            else:
                print(f"   ✗ Failed: {metadata.get('status', 'unknown')}")
                print(f"   Error: {metadata.get('error_message', metadata.get('error', 'Unknown error'))}")
            
            self.results["openai"]["tests"].append({
                "question": q_dict['name'],
                "scenario": q_dict['scenario'],
                "success": bool(text),
                "metadata": metadata
            })
    
    def _print_results_summary(self):
        """Print summary of all tests."""
        print("\n" + "=" * 80)
        print("TEST RESULTS SUMMARY")
        print("=" * 80)
        
        for provider in ["gemini", "openai"]:
            tests = self.results[provider].get("tests", [])
            if not tests:
                print(f"\n{provider.upper()}: No tests run")
                continue
            
            successful = sum(1 for t in tests if t["success"])
            total = len(tests)
            
            print(f"\n{provider.upper()}: {successful}/{total} tests passed")
            
            # Group by scenario
            by_scenario = {}
            for test in tests:
                scenario = test["scenario"]
                if scenario not in by_scenario:
                    by_scenario[scenario] = []
                by_scenario[scenario].append(test)
            
            for scenario, scenario_tests in by_scenario.items():
                successful = sum(1 for t in scenario_tests if t["success"])
                print(f"  • {scenario}: {successful}/{len(scenario_tests)} passed")
            
            # Performance stats
            successful_tests = [t for t in tests if t["success"]]
            if successful_tests:
                avg_time = sum(t["metadata"]["elapsed_ms"] for t in successful_tests) / len(successful_tests)
                avg_tokens = sum(t["metadata"]["tokens_out"] for t in successful_tests if "tokens_out" in t["metadata"]) / len(successful_tests)
                print(f"  • Avg Response Time: {avg_time:.0f}ms")
                print(f"  • Avg Output Tokens: {avg_tokens:.0f}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════════════════════╗
    ║        COMPREHENSIVE AI MODEL TESTING & WEBAPP INTEGRATION ANALYSIS        ║
    ║                                                                            ║
    ║  Tests:                                                                   ║
    ║  • 3 Technical Questions (understanding_agent scenarios)                  ║
    ║  • 3 Requirement Analysis Questions (requirement_categorization)          ║
    ║  • 3 Test Generation Questions (test_cases agent)                         ║
    ║                                                                            ║
    ║  Providers:                                                               ║
    ║  • Gemini (auto-discovers available models)                               ║
    ║  • OpenAI (auto-discovers available models)                               ║
    ║                                                                            ║
    ║  Metrics:                                                                 ║
    ║  • Response latency (ms)                                                  ║
    ║  • Token usage                                                            ║
    ║  • Model availability                                                     ║
    ║  • Integration points in webapp                                           ║
    ╚════════════════════════════════════════════════════════════════════════════╝
    """)
    
    tester = ComprehensiveModelTester()
    tester.run_all_tests()
    
    print("\n✅ Test suite completed!")
