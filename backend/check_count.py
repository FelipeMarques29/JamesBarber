import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
from app.db.database import db

def check_count():
    print("Collection reference:", db.collection("clientes"))
    count_query = db.collection("clientes").count()
    results = count_query.get()
    print("Aggregation Result:", results)
    print("Count:", results[0][0].value)

    docs = db.collection("clientes").limit(5).stream()
    docs_list = list(docs)
    print("Docs via stream:", len(docs_list))
    for d in docs_list:
        print(d.id, d.to_dict().get("nome"))

if __name__ == "__main__":
    check_count()
