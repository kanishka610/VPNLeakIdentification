from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
import time
from datetime import datetime
import os

from config import Config
from utils.vpn_detector import VPNDetector

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)
app.config.from_object(Config)

vpn_detector = VPNDetector()
active_monitors = {}
youtube_detections = {}

# Serve frontend files
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# API Routes
@app.route('/api/')
def api_index():
    return jsonify({
        'message': 'VPN Leak Detection API',
        'status': 'running',
        'endpoints': {
            '/api/detect': 'Perform VPN detection',
            '/api/youtube-detected': 'Report YouTube detection',
            '/api/get-youtube-detections': 'Get YouTube detection history'
        }
    })

@app.route('/api/detect', methods=['GET', 'POST'])
def detect_vpn():
    result = vpn_detector.detect_vpn_leak()
    return jsonify(result)

@app.route('/api/youtube-detected', methods=['POST'])
def youtube_detected():
    data = request.json or {}
    print(f"🎬 YouTube detection received: {data}")
    
    session_id = data.get('session_id', 'default')
    url = data.get('url', 'Unknown')
    
    vpn_result = vpn_detector.detect_vpn_leak()
    
    detection_data = {
        'timestamp': datetime.now().isoformat(),
        'vpn_result': vpn_result,
        'url': url,
        'session_id': session_id
    }
    
    if session_id not in youtube_detections:
        youtube_detections[session_id] = []
    
    youtube_detections[session_id].append(detection_data)
    
    if len(youtube_detections[session_id]) > 10:
        youtube_detections[session_id] = youtube_detections[session_id][-10:]
    
    print(f"📍 IP: {vpn_result.get('public_ip')}")
    print(f"🔍 VPN Detected: {vpn_result.get('is_vpn_detected')}")
    print(f"🚨 Leak: {vpn_result.get('leak_detected')}")
    print("-" * 50)
    
    return jsonify({
        'message': 'YouTube detection recorded',
        'vpn_status': vpn_result,
        'session_id': session_id
    })

@app.route('/api/get-youtube-detections', methods=['GET'])
def get_youtube_detections():
    session_id = request.args.get('session_id', 'default')
    detections = youtube_detections.get(session_id, [])
    return jsonify({
        'session_id': session_id,
        'detections': detections,
        'total_detections': len(detections)
    })

@app.route('/api/start-monitor', methods=['POST'])
def start_monitoring():
    data = request.json or {}
    session_id = data.get('session_id', 'default')
    
    if session_id in active_monitors:
        return jsonify({'error': 'Monitoring already active'}), 400
    
    def monitor_loop(sid):
        while sid in active_monitors:
            try:
                result = vpn_detector.detect_vpn_leak()
                active_monitors[sid]['last_result'] = result
                active_monitors[sid]['last_check'] = datetime.now().isoformat()
                
                if result.get('leak_detected'):
                    print(f"🚨 VPN LEAK DETECTED for session {sid}!")
                
            except Exception as e:
                print(f"Monitoring error: {e}")
            
            time.sleep(30)
    
    active_monitors[session_id] = {
        'started_at': datetime.now().isoformat(),
        'last_result': None,
        'last_check': None,
        'thread': None
    }
    
    monitor_thread = threading.Thread(target=monitor_loop, args=(session_id,), daemon=True)
    monitor_thread.start()
    active_monitors[session_id]['thread'] = monitor_thread
    
    return jsonify({
        'message': f'Monitoring started for session {session_id}',
        'session_id': session_id
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    session_id = request.args.get('session_id', 'default')
    
    if session_id in active_monitors:
        monitor_data = active_monitors[session_id]
        return jsonify({
            'active': True,
            'session_id': session_id,
            'last_check': monitor_data['last_check'],
            'last_result': monitor_data['last_result']
        })
    else:
        return jsonify({'active': False, 'session_id': session_id})

if __name__ == '__main__':
    print("🚀 VPN Leak Detector Server Starting...")
    print("🌐 Your Dashboard: https://a3412e272b54.ngrok-free.app/dashboard.html")
    print("📊 API Running on: https://a3412e272b54.ngrok-free.app/api/")
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG, use_reloader=False)