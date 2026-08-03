import urllib.request
import json

try:
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/health")
    data = req.read().decode('utf-8')
    print("Health check response:", data)
except Exception as e:
    print("Error connecting to backend:", e)
