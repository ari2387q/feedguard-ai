from fastapi import FastAPI
import joblib
from pydantic import BaseModel,Field
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
try:
    model = joblib.load('spam_model.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    model_toxic = joblib.load('toxic_model.pkl')
    vectorizer_toxic = joblib.load('vectorizer_toxic.pkl')
except FileNotFoundError as e:
    raise RuntimeError(f"Model file not found: {e}. Run the training notebook first.")

class Message(BaseModel):
    text: str=Field(..., min_length=1, max_length=2000)

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

@app.post("/predict-toxic")
def predict_toxic(message: Message):
    text_tfidf = vectorizer_toxic.transform([message.text])
    prediction = model_toxic.predict(text_tfidf)[0]
    probability = model_toxic.predict_proba(text_tfidf)[0]
    label = "TOXIC" if prediction == 1 else "CLEAN"
    confidence = round(max(probability) * 100, 1)
    return {"label": label, "confidence": confidence}
