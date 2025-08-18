from passlib.context import CryptContext

# Use bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Hasher:
    @staticmethod
    def verify_password(plain_password, hashed_password):
        """Verifies a plain password against a hashed one."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password):
        """Hashes a plain password."""
        return pwd_context.hash(password)