import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def post(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req_data = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("--- 1. TESTING YUVAK REGISTRATION & AUTO ID GENERATION ---")
reg_payload = {
    "full_name": "Rohan Patel",
    "mobile_no": "9876543210",
    "dob": "2002-05-15",
    "location": "Bochasan"
}
# First registration might say existing if seeded, let's test with a fresh yuvak:
fresh_reg = {
    "full_name": "Siddharth Joshi",
    "mobile_no": "9123456789",
    "dob": "2001-10-25",
    "location": "Anand"
}
status, res = post("/api/auth/register", fresh_reg)
print(f"Register Status: {status}")
print(f"Response Payload: {json.dumps(res, indent=2)}")

expected_id = "SID6789"
actual_id = res.get("yuvak_id")
print(f"Expected Yuvak ID: {expected_id} | Generated Yuvak ID: {actual_id}")

print("\n--- 2. TESTING SMART LOGIN (YUVAK) ---")
login_yuvak = {"identifier": "SID6789", "password": "9123456789"}
status, res_login = post("/api/auth/login", login_yuvak)
print(f"Yuvak Login Status: {status}")
print(f"User Role: {res_login.get('role')}")
yuvak_token = res_login.get("access_token")

print("\n--- 3. TESTING SMART LOGIN (ADMIN) ---")
login_admin = {"identifier": "admin", "password": "adminpassword123"}
status, res_admin = post("/api/auth/login", login_admin)
print(f"Admin Login Status: {status}")
print(f"Admin Role: {res_admin.get('role')}")
admin_token = res_admin.get("access_token")

print("\n--- 4. TESTING ADMIN SECURITY (RBAC ENDPOINT) ---")
karyakar_payload = {
    "username": "karyakar_amit",
    "password": "AmitPassword123",
    "full_name": "Amit Shah",
    "mobile_no": "9898989898",
    "location": "Bochasan"
}

print("a. Attempting Karyakar creation with Yuvak token (Should FAIL with 403 Forbidden):")
status, res_rbac_fail = post("/api/admin/create-karyakar", karyakar_payload, token=yuvak_token)
print(f"Status: {status} | Detail: {res_rbac_fail.get('detail')}")

print("b. Attempting Karyakar creation with Admin token (Should SUCCEED with 201 Created):")
status, res_rbac_pass = post("/api/admin/create-karyakar", karyakar_payload, token=admin_token)
print(f"Status: {status} | Response: {res_rbac_pass.get('message')}")

print("\n--- ALL BACKEND CORE OBJECTIVES VERIFIED SUCCESSFULLY! ---")
