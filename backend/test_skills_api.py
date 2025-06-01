#!/usr/bin/env python3

import requests
import json

# Test skills API without authentication first
url = "http://localhost:8000/api/skills"

try:
    response = requests.get(url)
    print(f"Status code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("Success!")
        skills = response.json()
        print(f"Retrieved {len(skills)} skills")
    else:
        print(f"Error response:")
        print(response.text)
        
except Exception as e:
    print(f"Request failed: {e}")
