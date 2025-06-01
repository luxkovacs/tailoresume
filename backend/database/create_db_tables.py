from app.core.database import engine, Base
from app.models import models  # Ensure all models are imported

def main():
    print("Creating database tables...")
    # This will create all tables defined in models that inherit from Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    main()
