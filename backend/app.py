from src import create_app

app = create_app()
app.secret_key="skibidi_banks_banks"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)