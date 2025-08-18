from sqlalchemy.orm import declarative_base

# Create a Base class for all ORM models to inherit from.
# This allows SQLAlchemy to discover all the models.
Base = declarative_base()