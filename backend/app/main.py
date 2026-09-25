from fastapi import FastAPI

app = FastAPI(
    title="USM Carpool API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "USM Carpool API is running"
    }