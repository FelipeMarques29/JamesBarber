import firebase_admin
from firebase_admin import credentials, firestore

#firebase
cred = credentials.Certificate("firebase-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    
db = firestore.client()