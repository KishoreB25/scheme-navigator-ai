"""
MongoDB Database Service for PolicyGPT Bharat
Handles connection, user profiles, and chat history persistence
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime
from typing import Dict, List, Optional
import json

from config.settings import settings


class MongoDBService:
    """MongoDB service for data persistence"""

    def __init__(self):
        self._client = None
        self._db = None
        self._initialized = False
        self._initialize()

    def _initialize(self):
        """Initialize MongoDB connection"""
        if self._initialized:
            return

        try:
            self._client = MongoClient(
                settings.mongodb_url,
                serverSelectionTimeoutMS=settings.mongodb_timeout,
                connectTimeoutMS=settings.mongodb_timeout,
            )
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[settings.mongodb_db_name]
            self._create_indexes()
            self._initialized = True
            print(f"[DB] MongoDB connected: {settings.mongodb_url}")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"[DB] MongoDB connection failed: {e}")
            print("[DB] Continuing with in-memory storage (data won't persist)")
            self._initialized = False

    def _create_indexes(self):
        """Create necessary indexes for performance"""
        if self._db is None:
            return

        try:
            # User profiles collection
            self._db.users.create_index("user_id", unique=True)
            self._db.users.create_index("created_at", expireAfterSeconds=7776000)  # 90 days TTL

            # Chat history collection
            self._db.chat_history.create_index([("user_id", ASCENDING), ("session_id", ASCENDING)])
            self._db.chat_history.create_index("created_at", expireAfterSeconds=2592000)  # 30 days TTL
            self._db.chat_history.create_index("user_id")
            self._db.chat_history.create_index([("created_at", DESCENDING)])

            # Missed schemes tracking
            self._db.missed_schemes.create_index([("user_id", ASCENDING), ("scheme_id", ASCENDING)])

            print("[DB] Indexes created successfully")
        except Exception as e:
            print(f"[DB] Error creating indexes: {e}")

    @property
    def is_available(self) -> bool:
        """Check if MongoDB is available"""
        return self._initialized and self._db is not None

    # ============= USER PROFILE OPERATIONS =============

    def save_user_profile(self, user_id: str, profile: Dict) -> Dict:
        """Save user profile to MongoDB"""
        if not self.is_available:
            print("[DB] MongoDB not available, storing in memory only")
            return {"user_id": user_id, "profile": profile, "saved": False}

        try:
            profile_doc = {
                "user_id": user_id,
                **profile,
                "created_at": profile.get("created_at", datetime.utcnow()),
                "updated_at": datetime.utcnow(),
            }

            # Log the profile being saved
            print(f"[DB] Saving user profile: {user_id}")
            print(f"[DB] Profile fields: {list(profile_doc.keys())}")
            print(f"[DB] Username: {profile_doc.get('username', 'NOT SET')}")

            result = self._db.users.update_one(
                {"user_id": user_id},
                {"$set": profile_doc},
                upsert=True
            )

            print(f"[DB] Profile saved successfully. Matched: {result.matched_count}, Modified: {result.modified_count}, Upserted ID: {result.upserted_id}")

            return {
                "user_id": user_id,
                "profile": profile,
                "saved": True,
                "upserted": result.upserted_id is not None
            }
        except Exception as e:
            print(f"[DB] Error saving profile: {e}")
            return {"user_id": user_id, "profile": profile, "saved": False}

    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Retrieve user profile from MongoDB"""
        if not self.is_available:
            return None

        try:
            profile = self._db.users.find_one({"user_id": user_id})
            if profile:
                profile.pop("_id", None)  # Remove MongoDB internal ID
            return profile
        except Exception as e:
            print(f"[DB] Error getting profile: {e}")
            return None

    # ============= CHAT HISTORY OPERATIONS =============

    def save_chat_message(
        self,
        user_id: str,
        session_id: str,
        message: Dict
    ) -> Dict:
        """Save individual chat message"""
        if not self.is_available:
            print("[DB] MongoDB not available, chat history not saved")
            return {"saved": False}

        try:
            chat_doc = {
                "user_id": user_id,
                "session_id": session_id,
                **message,
                "created_at": datetime.utcnow(),
            }

            result = self._db.chat_history.insert_one(chat_doc)

            return {
                "message_id": str(result.inserted_id),
                "saved": True
            }
        except Exception as e:
            print(f"[DB] Error saving chat message: {e}")
            return {"saved": False}

    def get_chat_history(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Retrieve chat history for user or session"""
        if not self.is_available:
            return []

        try:
            query = {"user_id": user_id}
            if session_id:
                query["session_id"] = session_id

            messages = list(
                self._db.chat_history
                .find(query)
                .sort("created_at", ASCENDING)
                .limit(limit)
            )

            # Remove MongoDB internal IDs
            for msg in messages:
                msg.pop("_id", None)

            return messages
        except Exception as e:
            print(f"[DB] Error retrieving chat history: {e}")
            return []

    def save_full_session(
        self,
        user_id: str,
        session_id: str,
        messages: List[Dict],
        metadata: Dict = None
    ) -> Dict:
        """Save complete chat session"""
        if not self.is_available:
            return {"saved": False}

        try:
            session_doc = {
                "user_id": user_id,
                "session_id": session_id,
                "messages": messages,
                "message_count": len(messages),
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }

            result = self._db.chat_sessions.update_one(
                {"session_id": session_id},
                {"$set": session_doc},
                upsert=True
            )

            return {
                "session_id": session_id,
                "saved": True,
                "message_count": len(messages)
            }
        except Exception as e:
            print(f"[DB] Error saving session: {e}")
            return {"saved": False}

    # ============= MISSED SCHEMES TRACKING =============

    def save_missed_scheme_detection(
        self,
        user_id: str,
        profile: Dict,
        missed_schemes: List[Dict]
    ) -> Dict:
        """Track missed benefits detection for user"""
        if not self.is_available:
            return {"saved": False}

        try:
            detection_doc = {
                "user_id": user_id,
                "profile": profile,
                "missed_schemes_count": len(missed_schemes),
                "scheme_ids": [s.get("id", s.get("scheme_id")) for s in missed_schemes],
                "created_at": datetime.utcnow(),
            }

            result = self._db.missed_schemes.insert_one(detection_doc)

            return {
                "detection_id": str(result.inserted_id),
                "saved": True,
                "scheme_count": len(missed_schemes)
            }
        except Exception as e:
            print(f"[DB] Error saving missed scheme detection: {e}")
            return {"saved": False}

    def get_user_missed_benefits_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get user's missed benefits detection history"""
        if not self.is_available:
            return []

        try:
            history = list(
                self._db.missed_schemes
                .find({"user_id": user_id})
                .sort("created_at", DESCENDING)
                .limit(limit)
            )

            for item in history:
                item.pop("_id", None)

            return history
        except Exception as e:
            print(f"[DB] Error retrieving missed benefits history: {e}")
            return []

    # ============= UTILITY OPERATIONS =============

    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        if not self.is_available:
            return {"status": "MongoDB not available"}

        try:
            stats = {
                "users_count": self._db.users.count_documents({}),
                "chat_messages_count": self._db.chat_history.count_documents({}),
                "sessions_count": self._db.chat_sessions.count_documents({}),
                "missed_detections_count": self._db.missed_schemes.count_documents({}),
                "status": "Connected"
            }
            return stats
        except Exception as e:
            print(f"[DB] Error getting stats: {e}")
            return {"status": "Error", "error": str(e)}

    def delete_old_data(self, days: int = 30) -> Dict:
        """Delete chat history older than specified days (manual cleanup if TTL not working)"""
        if not self.is_available:
            return {"deleted": 0}

        try:
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            result = self._db.chat_history.delete_many({
                "created_at": {"$lt": cutoff_date}
            })

            return {"deleted": result.deleted_count}
        except Exception as e:
            print(f"[DB] Error deleting old data: {e}")
            return {"deleted": 0}

    def close_connection(self):
        """Close MongoDB connection"""
        if self._client is not None:
            self._client.close()
            print("[DB] MongoDB connection closed")


# Global instance
db_service = MongoDBService()
