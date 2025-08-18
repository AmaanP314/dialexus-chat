# app/websocket/connection_manager.py
from fastapi import WebSocket
from typing import Dict, List, Set

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        """Disconnect a WebSocket."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)

    async def broadcast_to_users(self, message: str, user_ids: List[int]):
        """Send a message to a list of specific users."""
        for user_id in user_ids:
            if user_id in self.active_connections:
                await self.send_personal_message(message, user_id)

    def get_all_connection_ids(self) -> Set[str]:
        """Returns a set of all active connection IDs."""
        return set(self.active_connections.keys())

manager = ConnectionManager()
