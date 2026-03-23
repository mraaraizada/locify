#!/usr/bin/env python3
"""
Vegh File Sharing - Python Backend Server
P2P File Sharing with WebRTC and Socket.io
"""

import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('ADMIN_COOKIE_PASS', 'secret!')

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://locify-sigma.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175"
        ]
    }
})

# Initialize Socket.IO with compatibility for Socket.IO v2 clients
    socketio = SocketIO(
    app,
    cors_allowed_origins=[
        "https://locify-sigma.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    async_mode='gevent',
    logger=False,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25
)

# In-memory storage for rooms and users
users = {}  # {roomID: [socket_ids]}
users_names = {}  # {roomID: [{id: socket_id, name: random_name}]}
socket_to_room = {}  # {socket_id: roomID}

# MongoDB connection (optional)
MONGO_URL = os.getenv('MONGO_URL', 'test')
db = None

if MONGO_URL != 'test':
    try:
        from pymongo import MongoClient
        client = MongoClient(MONGO_URL)
        db = client.get_database()
        print("✓ MongoDB connected")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        print("  Running without database")


# Routes
@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'response': 'Server is up and running.',
        'users': users,
        'users_names': users_names
    }), 200


@app.route('/log', methods=['POST'])
def log_transfer():
    """Log file transfer data"""
    try:
        data = request.get_json()
        
        if db is not None:
            # Store in MongoDB
            collection = db['transfers']
            data['timestamp'] = datetime.utcnow()
            collection.insert_one(data)
        
        print(f"✓ Transfer logged: {data.get('roomID')} - {data.get('data')} bytes")
        return jsonify({'status': 'logged'}), 200
    except Exception as e:
        print(f"✗ Error logging transfer: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/datasum', methods=['GET'])
def data_sum():
    """Get total data transferred"""
    if db is None:
        return jsonify({'error': 'Database not configured'}), 503
    
    try:
        collection = db['transfers']
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'TotalCount': {'$sum': '$data'}
                }
            }
        ]
        result = list(collection.aggregate(pipeline))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/countUsers', methods=['GET'])
def count_users():
    """Get total number of users"""
    if db is None:
        return jsonify({'error': 'Database not configured'}), 503
    
    try:
        collection = db['transfers']
        count = collection.count_documents({})
        return jsonify(count), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/dataLog', methods=['GET'])
def data_log():
    """Get all transfer logs"""
    if db is None:
        return jsonify({'error': 'Database not configured'}), 503
    
    try:
        collection = db['transfers']
        data = list(collection.find({}, {'_id': 0}))
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f'✓ Client connected: {request.sid}')


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f'✗ Client disconnected: {request.sid}')
    
    room_id = socket_to_room.get(request.sid)
    
    if room_id and room_id in users:
        # Find position and username of disconnected user
        room = users[room_id]
        pos = None
        username = None
        
        for index, sid in enumerate(room):
            if sid == request.sid:
                pos = index
                break
        
        # Get username before removing
        if pos is not None and room_id in users_names:
            if pos < len(users_names[room_id]):
                username = users_names[room_id][pos]['name']
        
        # Remove user from room
        room = [sid for sid in room if sid != request.sid]
        users[room_id] = room
        
        # Remove user name
        if pos is not None and room_id in users_names:
            users_names[room_id] = [
                item for index, item in enumerate(users_names[room_id])
                if index != pos
            ]
        
        # Clean up empty rooms
        if len(users[room_id]) == 0:
            del users[room_id]
            if room_id in users_names:
                del users_names[room_id]
        else:
            # Notify remaining users
            remaining_users = users[room_id]
            for user_sid in remaining_users:
                socketio.emit('usernames', users_names[room_id], room=user_sid)
                socketio.emit('user left', {
                    'signal': 'user left',
                    'userID': request.sid,
                    'username': username
                }, room=user_sid)
        
        # Remove from socket_to_room mapping
        if request.sid in socket_to_room:
            del socket_to_room[request.sid]


@socketio.on('join room')
def handle_join_room(room_id, is_private=False):
    """Handle user joining a room"""
    print(f'✓ Join room request: {room_id} (private: {is_private})')
    
    if is_private:
        # Private room logic (max 2 users)
        if room_id in users:
            if len(users[room_id]) >= 2:
                emit('room full')
                return
            
            name = random.randint(1, 50)
            users[room_id].append(request.sid)
            users_names[room_id].append({'id': request.sid, 'name': name})
        else:
            # Create new private room
            name = random.randint(1, 50)
            users[room_id] = [request.sid]
            users_names[room_id] = [{'id': request.sid, 'name': name}]
            emit('usernames', users_names[room_id])
    
    # Join the room
    join_room(room_id)
    socket_to_room[request.sid] = room_id
    
    # Send current users to new user
    users_in_room = [sid for sid in users[room_id] if sid != request.sid]
    users_names_in_room = users_names[room_id]
    
    emit('usernames', users_names_in_room)
    emit('all users', {
        'usersInThisRoom': users_in_room,
        'usersNamesInThisRoom': users_names_in_room
    })


@socketio.on('join room using ip')
def handle_join_room_ip(room_id):
    """Handle user joining a public room using IP (supports up to 5 users)"""
    print(f'✓ Join public room: {room_id}')
    
    if room_id in users:
        if len(users[room_id]) >= 5:
            emit('room full')
            return
        
        name = random.randint(1, 50)
        users[room_id].append(request.sid)
        users_names[room_id].append({'id': request.sid, 'name': name})
    else:
        # Create new public room
        name = random.randint(1, 50)
        users[room_id] = [request.sid]
        users_names[room_id] = [{'id': request.sid, 'name': name}]
    
    # Join the room
    join_room(room_id)
    socket_to_room[request.sid] = room_id
    
    # Send current users to new user
    users_in_room = [sid for sid in users[room_id] if sid != request.sid]
    users_names_in_room = users_names[room_id]
    
    # Notify all existing users about the new user
    for user_sid in users_in_room:
        socketio.emit('usernames', users_names_in_room, room=user_sid)
    
    # Send user list to new user
    emit('usernames', users_names_in_room)
    emit('all users', {
        'usersInThisRoom': users_in_room,
        'usersNamesInThisRoom': users_names_in_room
    })


@socketio.on('sending signal')
def handle_sending_signal(data):
    """Handle WebRTC signaling from initiator"""
    room_id = socket_to_room.get(request.sid)
    
    if room_id:
        users_names_in_room = users_names.get(room_id, [])
        emit('usernames', users_names_in_room)
        
        # Find the sender's username
        sender_name = None
        for user in users_names_in_room:
            if user['id'] == request.sid:
                sender_name = user['name']
                break
        
        # Send signal to target user
        socketio.emit('user joined', {
            'signal': data['signal'],
            'callerID': data['callerID'],
            'username': sender_name
        }, room=data['userToSignal'])


@socketio.on('returning signal')
def handle_returning_signal(data):
    """Handle WebRTC signaling response"""
    room_id = socket_to_room.get(request.sid)
    
    if room_id:
        users_names_in_room = [
            item for item in users_names.get(room_id, [])
            if item['name'] != request.sid
        ]
        emit('usernames', users_names_in_room)
        
        # Send signal back to caller
        socketio.emit('receiving returned signal', {
            'signal': data['signal'],
            'id': request.sid,
            'username': data.get('username')
        }, room=data['callerID'])


# Run server
if __name__ == '__main__':
    port = int(os.getenv('BACKEND_PORT', 8000))
    print(f'\n{"="*50}')
    print(f'🚀 Vegh Python Backend Server')
    print(f'{"="*50}')
    print(f'✓ Server starting on port {port}')
    print(f'✓ CORS enabled for: localhost:3000, localhost:5173, localhost:5174, localhost:5175')
    print(f'✓ MongoDB: {"Connected" if db else "Disabled (test mode)"}')
    print(f'{"="*50}\n')
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=False
    )
