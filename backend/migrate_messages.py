import os
from pymongo import MongoClient
from dotenv import load_dotenv

# IMPORTANT: Run this script from the `backend` directory
# so it can find the .env file.
# Example: python ../migrate_messages.py

def migrate_data():
    """
    Finds all messages with the old 'status' field and migrates them
    to the new 'read_by' array format.
    """
    load_dotenv(dotenv_path='./.env') # Assumes .env is in the current dir
    
    mongo_url = os.getenv("MONGO_DATABASE_URL")
    db_name = os.getenv("MONGO_DB_NAME")

    if not mongo_url or not db_name:
        print("Error: MONGO_DATABASE_URL and MONGO_DB_NAME must be set in .env file.")
        return

    print("Connecting to MongoDB...")
    client = MongoClient(mongo_url)
    db = client[db_name]
    messages_collection = db["messages"]
    print("Connection successful.")

    # Find all documents that still use the old 'status' field
    old_messages_cursor = messages_collection.find({"status": {"$exists": True}})
    
    update_count = 0
    for message in old_messages_cursor:
        read_by_list = []
        
        # Sender has always read the message
        if message.get("sender") and message["sender"].get("id"):
            read_by_list.append(message["sender"]["id"])

        # For private messages, determine who else has read it based on status
        if message["type"] == "private":
            if message["status"] in ["received", "read"]:
                if message.get("receiver") and message["receiver"].get("id"):
                    # Add receiver ID if not already present
                    if message["receiver"]["id"] not in read_by_list:
                        read_by_list.append(message["receiver"]["id"])

        # For group messages, we can only assume the sender read it
        # The new logic will handle read receipts going forward

        # Perform the update in the database
        messages_collection.update_one(
            {"_id": message["_id"]},
            {
                "$set": {"read_by": read_by_list},
                "$unset": {"status": ""} # Remove the old 'status' field
            }
        )
        update_count += 1
        if update_count % 100 == 0:
            print(f"Updated {update_count} messages...")

    print(f"\nMigration complete. Total messages updated: {update_count}")
    client.close()
    print("MongoDB connection closed.")


if __name__ == "__main__":
    migrate_data()
