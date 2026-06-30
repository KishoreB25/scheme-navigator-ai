"""
MongoDB Database Service for PolicyGPT Bharat
Handles connection, user profiles, and chat history persistence
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure
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
        except (ConnectionFailure, ServerSelectionTimeoutError, OperationFailure) as e:
            print(f"[DB] MongoDB connection failed: {e}")
            print("[DB] Continuing with in-memory storage (data won't persist)")
            self._initialized = False

    def _create_indexes(self):
        """Create necessary indexes for performance"""
        if self._db is None:
            return

        try:
            # Drop old TTL index with conflicting options if it exists
            try:
                self._db.users.drop_index("createdAt_1")
                print("[DB] Dropped old createdAt index")
            except:
                pass  # Index doesn't exist, that's fine

            try:
                self._db.chat_history.drop_index("createdAt_1")
                print("[DB] Dropped old chat_history createdAt index")
            except:
                pass  # Index doesn't exist, that's fine

            # User profiles collection - use firebaseUid as unique key
            self._db.users.create_index("firebaseUid", unique=True)
            # TTL index for guest users only - 90 days
            self._db.users.create_index("createdAt", expireAfterSeconds=7776000, partialFilterExpression={"isGuest": True})

            # Chat history collection
            self._db.chat_history.create_index([("firebaseUid", ASCENDING), ("session_id", ASCENDING)])
            self._db.chat_history.create_index("createdAt", expireAfterSeconds=2592000)  # 30 days TTL
            self._db.chat_history.create_index("firebaseUid")
            self._db.chat_history.create_index([("createdAt", DESCENDING)])

            # Missed schemes tracking - use firebaseUid for consistency
            self._db.missed_schemes.create_index([("firebaseUid", ASCENDING), ("scheme_id", ASCENDING)])

            # Alert subscriptions collection
            self._db.alert_subscriptions.create_index("phone", unique=True)
            self._db.alert_subscriptions.create_index("user_id")

            # Scheduled alerts collection
            self._db.scheduled_alerts.create_index([("user_id", ASCENDING), ("scheme_id", ASCENDING)])
            self._db.scheduled_alerts.create_index("created_at")

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
                "firebaseUid": user_id,
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
                .find({"firebaseUid": user_id})
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

    # ============= FIREBASE AUTHENTICATION =============

    def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[Dict]:
        """Get user by Firebase UID"""
        if not self.is_available:
            return None

        try:
            user = self._db.users.find_one({"firebaseUid": firebase_uid})
            if user:
                user.pop("_id", None)
            return user
        except Exception as e:
            print(f"[DB] Error getting user by Firebase UID: {e}")
            return None

    def create_user(self, firebase_uid: str, user_data: Dict, is_guest: bool = False) -> Dict:
        """Create new user in MongoDB
        
        Args:
            firebase_uid: Firebase UID (can be 'guest_' prefix for guests)
            user_data: User data including email, name, picture
            is_guest: Whether this is a guest user (no Firebase account yet)
        """
        if not self.is_available:
            print("[DB] MongoDB not available, user not created")
            return {"created": False}

        try:
            user_doc = {
                "firebaseUid": firebase_uid,
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "picture": user_data.get("picture"),
                "isGuest": is_guest,
                "profileCompleted": False,
                "profile": None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }

            result = self._db.users.insert_one(user_doc)
            print(f"[DB] User created: {firebase_uid}, isGuest: {is_guest}")

            return {
                "user_id": str(result.inserted_id),
                "firebase_uid": firebase_uid,
                "created": True,
                "is_guest": is_guest
            }
        except Exception as e:
            print(f"[DB] Error creating user: {e}")
            return {"created": False}

    def update_user_profile(self, firebase_uid: str, profile_data: Dict) -> Dict:
        """Update user profile and mark as completed
        
        Stores eligibility criteria in profile object.
        Top-level name field is updated separately if edited.
        """
        if not self.is_available:
            print("[DB] MongoDB not available, profile not updated")
            return {"updated": False}

        try:
            print(f"[DB] Updating profile for: {firebase_uid}")
            print(f"[DB] Received profile_data: {profile_data}")
            
            # Prepare profile data (eligibility criteria only)
            # Remove 'name' from profile_data as it should be at top level
            profile_filtered = {k: v for k, v in profile_data.items() if k != 'name' and v != ''}
            
            print(f"[DB] After filtering: {profile_filtered}")
            
            # Update includes top-level name if provided
            update_doc = {
                "profile": profile_filtered,
                "profileCompleted": True,
                "updatedAt": datetime.utcnow(),
            }
            
            # If name is in the profile_data, update top-level name field too
            if 'name' in profile_data and profile_data['name']:
                update_doc['name'] = profile_data['name']

            print(f"[DB] Update doc: {update_doc}")
            
            result = self._db.users.update_one(
                {"firebaseUid": firebase_uid},
                {"$set": update_doc},
                upsert=False
            )

            if result.matched_count == 0:
                print(f"[DB] User not found: {firebase_uid}")
                return {"updated": False, "error": "User not found"}

            print(f"[DB] User profile updated: {firebase_uid}, matched: {result.matched_count}, modified: {result.modified_count}")
            return {
                "updated": True,
                "matched": result.matched_count,
                "modified": result.modified_count
            }
        except Exception as e:
            print(f"[DB] Error updating user profile: {e}")
            return {"updated": False, "error": str(e)}

    def close_connection(self):
        """Close MongoDB connection"""
        if self._client is not None:
            self._client.close()
            print("[DB] MongoDB connection closed")

    # ============= GUEST USER HANDLING =============

    def merge_guest_to_authenticated(self, guest_firebase_uid: str, auth_firebase_uid: str) -> Dict:
        """Merge guest user data to authenticated user account
        
        When a guest user logs in with Google:
        1. Retrieve guest profile data
        2. Delete guest account
        3. Update authenticated account with guest's profile data
        """
        if not self.is_available:
            return {"merged": False}

        try:
            # Get guest user data
            guest_user = self._db.users.find_one({"firebaseUid": guest_firebase_uid})
            if not guest_user:
                print(f"[DB] Guest user not found: {guest_firebase_uid}")
                return {"merged": False, "error": "Guest user not found"}

            # Get authenticated user
            auth_user = self._db.users.find_one({"firebaseUid": auth_firebase_uid})
            if not auth_user:
                print(f"[DB] Authenticated user not found: {auth_firebase_uid}")
                return {"merged": False, "error": "Authenticated user not found"}

            # Merge guest profile into authenticated user (if guest has profile completed)
            if guest_user.get("profileCompleted") and guest_user.get("profile"):
                merge_doc = {
                    "profile": guest_user["profile"],
                    "profileCompleted": True,
                    "updatedAt": datetime.utcnow(),
                }
                
                # Update authenticated user with guest profile
                result = self._db.users.update_one(
                    {"firebaseUid": auth_firebase_uid},
                    {"$set": merge_doc}
                )
                
                # Only proceed if update succeeded
                if result.matched_count == 0:
                    print(f"[DB] Failed to merge: authenticated user not found: {auth_firebase_uid}")
                    return {"merged": False, "error": "Authenticated user update failed"}
            
            # Migrate any guest data (e.g., chat history, alerts) to authenticated user
            # Update all documents in other collections that reference guest_firebase_uid
            self._db.chat_history.update_many(
                {"firebaseUid": guest_firebase_uid},
                {"$set": {"firebaseUid": auth_firebase_uid}}
            )
            
            # Delete guest account
            self._db.users.delete_one({"firebaseUid": guest_firebase_uid})
            print(f"[DB] Guest merged: {guest_firebase_uid} → {auth_firebase_uid}")

            return {
                "merged": True,
                "guest_had_profile": guest_user.get("profileCompleted", False)
            }
        except Exception as e:
            print(f"[DB] Error merging guest user: {e}")
            return {"merged": False, "error": str(e)}

    # ============= ALERT OPERATIONS =============

    def save_alert_subscription(self, phone: str, subscription: Dict) -> Dict:
        """Save/update alert subscription for a phone number"""
        if not self.is_available:
            return {"saved": False}

        try:
            sub_doc = {
                "phone": phone,
                **subscription,
                "updated_at": datetime.utcnow(),
            }
            if "created_at" not in sub_doc:
                sub_doc["created_at"] = datetime.utcnow()

            result = self._db.alert_subscriptions.update_one(
                {"phone": phone},
                {"$set": sub_doc},
                upsert=True
            )
            return {"saved": True, "upserted": result.upserted_id is not None}
        except Exception as e:
            print(f"[DB] Error saving alert subscription: {e}")
            return {"saved": False}

    def save_scheduled_alert(self, user_id: str, alert: Dict) -> Dict:
        """Save a scheduled alert document"""
        if not self.is_available:
            return {"saved": False}

        try:
            alert_doc = {
                "user_id": user_id,
                **alert,
                "saved_at": datetime.utcnow(),
            }
            result = self._db.scheduled_alerts.insert_one(alert_doc)
            return {"saved": True, "alert_id": str(result.inserted_id)}
        except Exception as e:
            print(f"[DB] Error saving scheduled alert: {e}")
            return {"saved": False}


# Global instance
db_service = MongoDBService()
