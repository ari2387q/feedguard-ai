from fastapi import FastAPI
import joblib
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load('spam_model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

class Message(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "Spam Detector API is running"}

@app.post("/predict")
def predict(message:Message):
    text_tfidf = vectorizer.transform([message.text])
    prediction = model.predict(text_tfidf)[0]
    probability = model.predict_proba(text_tfidf)[0]
    label = "SPAM" if prediction == 1 else "HAM"
    confidence=round(max(probability)*100,1)
    return {"label":label,"confidence":confidence,"message": message.text}


