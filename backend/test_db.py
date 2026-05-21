import psycopg2
import sys

def test_conn(url, name):
    try:
        conn = psycopg2.connect(url, connect_timeout=3)
        conn.close()
        print(f"[SUCCESS] {name} worked!")
        return True
    except Exception as e:
        print(f"[FAILED] {name}: {e}")
        return False

# Base credentials
pwd = "Shree%40151005"
ref = "rgmncaznslvuxamrquqs"

urls = {
    "1. Direct (IPv6 - will fail if no IPv6)": f"postgresql://postgres:{pwd}@db.{ref}.supabase.co:5432/postgres",
    "2. Pooler (postgres.ref)": f"postgresql://postgres.{ref}:{pwd}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
    "3. Pooler (options=endpoint)": f"postgresql://postgres:{pwd}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?options=endpoint%3D{ref}",
    "4. Pooler (options=project)": f"postgresql://postgres:{pwd}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?options=-c%20project%3D{ref}",
    "5. Session Pooler Port (5432)": f"postgresql://postgres.{ref}:{pwd}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
}

print("Testing Supabase Connections...\n")
for name, url in urls.items():
    test_conn(url, name)
