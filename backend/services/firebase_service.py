"""
Firebase Authentication Service
Handles Firebase token verification and user authentication
"""

import firebase_admin
from firebase_admin import credentials, auth
from config.settings import settings
import os
import json
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime


class FirebaseService:
    """Firebase Authentication Service"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialize()

    def _initialize(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                self.app = firebase_admin._apps[0]
                print("[Firebase] Already initialized")
            else:
                # Try to load credentials from file
                creds_path = settings.firebase_credentials_path
                resolved_creds_path = None

                if creds_path:
                    raw_path = Path(creds_path)
                    backend_dir = Path(__file__).resolve().parents[1]
                    project_root = backend_dir.parent

                    candidate_paths = [
                        raw_path,
                        backend_dir / raw_path,
                        project_root / raw_path,
                    ]

                    for candidate in candidate_paths:
                        if candidate.exists():
                            resolved_creds_path = candidate
                            break

                if resolved_creds_path:
                    cred = credentials.Certificate(str(resolved_creds_path))
                else:
                    # Try to load from JSON string in environment
                    creds_json = settings.firebase_credentials_json
                    if creds_json:
                        try:
                            creds_dict = json.loads(creds_json)
                            cred = credentials.Certificate(creds_dict)
                        except json.JSONDecodeError as e:
                            print(f"[Firebase] Failed to parse FIREBASE_CREDENTIALS_JSON: {e}")
                            self._initialized = True
                            return
                    else:
                        print("[Firebase] No credentials found. Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON in backend/.env")
                        self._initialized = True
                        return

                self.app = firebase_admin.initialize_app(cred)
                print("[Firebase] Initialized successfully")

            self._initialized = True
        except Exception as e:
            print(f"[Firebase] Initialization error: {e}")
            self._initialized = True

    def verify_token(self, id_token: str) -> Optional[Dict]:
        """
        Verify Firebase ID token and return decoded user data

        Args:
            id_token: Firebase ID token from client

        Returns:
            Dict with uid, email, name, email_verified; None if verification fails
        """
        try:
            # Allow 30 seconds clock skew tolerance for systems with slightly out-of-sync clocks
            decoded_token = auth.verify_id_token(id_token, clock_skew_seconds=30)
            return {
                'uid': decoded_token.get('uid'),
                'email': decoded_token.get('email'),
                'name': decoded_token.get('name'),
                'email_verified': decoded_token.get('email_verified', False),
                'picture': decoded_token.get('picture'),
            }
        except Exception as e:
            print(f"[Firebase] Token verification failed: {e}")
            return None

    def get_user_by_uid(self, uid: str) -> Optional[Dict]:
        """Get Firebase user by UID"""
        try:
            user = auth.get_user(uid)
            return {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'photo_url': user.photo_url,
                'email_verified': user.email_verified,
            }
        except Exception as e:
            print(f"[Firebase] Error getting user: {e}")
            return None
