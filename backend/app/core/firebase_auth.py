import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

def init_firebase():
    """Initializes the Firebase Admin SDK."""
    if firebase_admin._apps: # Check if already initialized
        print("Firebase Admin SDK already initialized.")
        return

    cred_path_env = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    # Path relative to the backend directory, assuming the key is in 'backend/'
    default_cred_path_relative_to_backend = "tailoresume-firebase-adminsdk-fbsvc-3d6b16b04c.json"
    # Construct absolute path from the perspective of this file (app/core/firebase_auth.py)
    # backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    # default_cred_path_abs = os.path.join(backend_dir, default_cred_path_relative_to_backend)
    
    # Simpler path construction assuming the service key is in the `backend` directory
    # and this script is in `backend/app/core`
    # So, ../../ goes from app/core -> app -> backend
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    service_key_path = os.path.join(current_file_dir, "..", "..", "tailoresume-firebase-adminsdk-fbsvc-3d6b16b04c.json")

    cred = None
    initialized_by = None

    if cred_path_env:
        try:
            print(f"Attempting to initialize Firebase Admin SDK using GOOGLE_APPLICATION_CREDENTIALS: {cred_path_env}")
            cred = credentials.Certificate(cred_path_env)
            initialized_by = "GOOGLE_APPLICATION_CREDENTIALS"
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK from GOOGLE_APPLICATION_CREDENTIALS ({cred_path_env}): {e}")
            print("Falling back to default path.")
    
    if not cred: # If env var failed or not set, try default path
        try:
            print(f"Attempting to initialize Firebase Admin SDK using default path: {service_key_path}")
            if os.path.exists(service_key_path):
                cred = credentials.Certificate(service_key_path)
                initialized_by = f"default path ({service_key_path})"
            else:
                print(f"Warning: Service account key not found at default path: {service_key_path}.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK from default path ({service_key_path}): {e}")

    if cred:
        try:
            firebase_admin.initialize_app(cred)
            print(f"Firebase Admin SDK initialized successfully using {initialized_by}.")
        except Exception as e:
            print(f"Critical error during firebase_admin.initialize_app(): {e}")
    else:
        print("CRITICAL: Firebase Admin SDK could not be initialized. Credentials not loaded.")


oauth2_scheme_firebase = HTTPBearer()

async def verify_firebase_token(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme_firebase)):
    """
    Verify Firebase ID token.
    This function can be used as a dependency in FastAPI path operations
    to protect routes that require Firebase authentication.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated"
        )
    try:
        # Verify the ID token while checking if the token is revoked by
        # passing check_revoked=True.
        decoded_token = auth.verify_id_token(token.credentials, check_revoked=True)
        # The token is valid and not revoked.
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        name = decoded_token.get('name')
        # You can return the decoded token or specific user info
        return {"uid": uid, "email": email, "name": name, "token": decoded_token}
    except auth.RevokedIdTokenError:
        # Token has been revoked. Inform the user to reauthenticate.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID token has been revoked. Please reauthenticate.",
            headers={"WWW-Authenticate": "Bearer error=\'invalid_token\'"},
        )
    except auth.UserDisabledError:
        # Token belongs to a disabled user account.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled.",
            headers={"WWW-Authenticate": "Bearer error=\'invalid_token\'"},
        )
    except auth.InvalidIdTokenError:
        # Token is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token.",
            headers={"WWW-Authenticate": "Bearer error=\'invalid_token\'"},
        )
    except Exception as e:
        # Other Firebase Admin SDK errors
        print(f"An unexpected error occurred during Firebase token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify Firebase token.",
            headers={"WWW-Authenticate": "Bearer error=\'internal_error\'"},
        )

