import os
import json
from flask import Flask, render_template, send_from_directory, request, jsonify

app = Flask(__name__)

# Serve static files cleanly from existing folders without changing the project architecture structure
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(app.root_path, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(app.root_path, 'js'), filename)

@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory(os.path.join(app.root_path, 'img'), filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

DATA_FILE = os.path.join(app.root_path, 'data.json')

@app.route('/api/data', methods=['GET', 'POST'])
def api_data():
    if request.method == 'POST':
        # Overwrite data.json with the incoming JSON payload
        try:
            new_data = request.get_json()
            with open(DATA_FILE, 'w') as f:
                json.dump(new_data, f, indent=4)
            return jsonify({"status": "success"})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
            
    # GET request: return data.json contents
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
                return jsonify(data)
        else:
            return jsonify({"plans": [], "settings": {}, "tariffs": {}}) # Fallback schema
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Vercel serverless functions require the application instance to be named 'app'.
if __name__ == '__main__':
    app.run(debug=True, port=8080)
