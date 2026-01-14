"""
NINJA In-Memory Database Manager
================================
Fallback database when PostgreSQL is not available
Uses in-memory storage with JSON file persistence
"""
import os
import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Storage file
STORAGE_FILE = Path(__file__).parent.parent / "user_data" / "_memory_db.json"


class MemoryDatabaseManager:
    """In-memory database manager with JSON persistence"""
    
    def __init__(self):
        self.data = {
            "users": {},
            "subscriptions": {},
            "plans": self._default_plans(),
            "whitelist": {},
            "usage": {},
            "sessions": {},
            "messages": {},
            "presentations": {},
            "research_blogs": {},
            "audit_logs": []
        }
        self._load_from_file()
        print("✅ Memory Database Manager initialized")
    
    def _default_plans(self) -> Dict:
        """Default subscription plans"""
        return {
            "Go": {
                "id": "go",
                "name": "Go",
                "display_name": "Go Plan",
                "price_monthly": 0,
                "price_yearly": 0,
                "features": {
                    "max_messages": 50,
                    "max_tokens": 100000,
                    "max_research": 5,
                    "max_presentations": 3,
                    "max_images": 5,
                    "deep_research": False,
                    "advanced_models": False
                }
            },
            "Plus": {
                "id": "plus",
                "name": "Plus",
                "display_name": "Plus Plan",
                "price_monthly": 290,
                "price_yearly": 2900,
                "features": {
                    "max_messages": 500,
                    "max_tokens": 1000000,
                    "max_research": 50,
                    "max_presentations": 30,
                    "max_images": 50,
                    "deep_research": True,
                    "advanced_models": True
                }
            },
            "Pro": {
                "id": "pro",
                "name": "Pro",
                "display_name": "Pro Plan",
                "price_monthly": 990,
                "price_yearly": 9900,
                "features": {
                    "max_messages": -1,
                    "max_tokens": -1,
                    "max_research": -1,
                    "max_presentations": -1,
                    "max_images": -1,
                    "deep_research": True,
                    "advanced_models": True
                }
            }
        }
    
    def _load_from_file(self):
        """Load data from JSON file"""
        try:
            if STORAGE_FILE.exists():
                with open(STORAGE_FILE, 'r', encoding='utf-8') as f:
                    saved_data = json.load(f)
                    # Merge with defaults
                    for key in saved_data:
                        if key in self.data:
                            self.data[key] = saved_data[key]
                print(f"📂 Loaded data from {STORAGE_FILE}")
        except Exception as e:
            print(f"⚠️  Could not load data: {e}")
    
    def _save_to_file(self):
        """Save data to JSON file"""
        try:
            STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(STORAGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"⚠️  Could not save data: {e}")
    
    # ═══════════════════════════════════════════════════════════
    # USER MANAGEMENT
    # ═══════════════════════════════════════════════════════════
    
    def get_or_create_user(self, email: str, name: str = None, google_id: str = None,
                          avatar_url: str = None) -> Dict:
        """Get existing user or create new one"""
        if email in self.data["users"]:
            user = self.data["users"][email]
            user["last_login_at"] = datetime.now().isoformat()
            self._save_to_file()
            return user
        
        # Create new user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "role": "admin" if email in ["thanaponmeliodas@gmail.com", "admin@ninja.com"] else "user",
            "avatar_url": avatar_url,
            "google_id": google_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "last_login_at": datetime.now().isoformat(),
            "is_active": True
        }
        self.data["users"][email] = user
        
        # Auto-assign Plus plan for new users
        self.assign_subscription(user_id, "Plus", "monthly")
        
        self._save_to_file()
        return user
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return self.data["users"].get(email)
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        for user in self.data["users"].values():
            if user.get("id") == user_id:
                return user
        return None
    
    def update_user_role(self, user_id: str, role: str) -> Optional[Dict]:
        """Update user role"""
        for email, user in self.data["users"].items():
            if user.get("id") == user_id:
                user["role"] = role
                user["updated_at"] = datetime.now().isoformat()
                self._save_to_file()
                return user
        return None
    
    def list_users(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List all users"""
        users = list(self.data["users"].values())
        return users[offset:offset + limit]
    
    # ═══════════════════════════════════════════════════════════
    # SUBSCRIPTION MANAGEMENT
    # ═══════════════════════════════════════════════════════════
    
    def get_user_subscription(self, user_id: str) -> Optional[Dict]:
        """Get user's active subscription"""
        sub = self.data["subscriptions"].get(user_id)
        if sub:
            plan = self.data["plans"].get(sub.get("plan_name", "Plus"))
            return {**sub, "plan": plan}
        return None
    
    def assign_subscription(self, user_id: str, plan_name: str, billing_cycle: str = "monthly") -> Dict:
        """Assign subscription to user"""
        plan = self.data["plans"].get(plan_name, self.data["plans"]["Plus"])
        sub = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "plan_id": plan["id"],
            "plan_name": plan_name,
            "billing_cycle": billing_cycle,
            "status": "active",
            "started_at": datetime.now().isoformat(),
            "expires_at": None,
            "plan": plan
        }
        self.data["subscriptions"][user_id] = sub
        self._save_to_file()
        return sub
    
    def get_all_plans(self) -> List[Dict]:
        """Get all subscription plans"""
        return list(self.data["plans"].values())
    
    # ═══════════════════════════════════════════════════════════
    # WHITELIST MANAGEMENT
    # ═══════════════════════════════════════════════════════════
    
    def check_whitelist(self, email: str) -> Optional[Dict]:
        """Check if email is in whitelist"""
        return self.data["whitelist"].get(email)
    
    def add_to_whitelist(self, email: str, plan_name: str, added_by: str = None) -> Dict:
        """Add email to whitelist"""
        entry = {
            "email": email,
            "plan_name": plan_name,
            "added_by": added_by,
            "created_at": datetime.now().isoformat()
        }
        self.data["whitelist"][email] = entry
        self._save_to_file()
        return entry
    
    def remove_from_whitelist(self, email: str) -> bool:
        """Remove email from whitelist"""
        if email in self.data["whitelist"]:
            del self.data["whitelist"][email]
            self._save_to_file()
            return True
        return False
    
    def get_whitelist(self) -> List[Dict]:
        """Get all whitelist entries"""
        return list(self.data["whitelist"].values())
    
    # ═══════════════════════════════════════════════════════════
    # USAGE TRACKING
    # ═══════════════════════════════════════════════════════════
    
    def track_usage(self, user_id: str, resource_type: str, resource_count: int = 1,
                   session_id: str = None, metadata: Dict = None) -> Dict:
        """Track resource usage"""
        now = datetime.now()
        month_key = f"{user_id}_{now.year}_{now.month}"
        
        if month_key not in self.data["usage"]:
            self.data["usage"][month_key] = {
                "user_id": user_id,
                "year": now.year,
                "month": now.month,
                "message": 0,
                "token": 0,
                "research": 0,
                "presentation": 0,
                "image": 0
            }
        
        self.data["usage"][month_key][resource_type] = \
            self.data["usage"][month_key].get(resource_type, 0) + resource_count
        
        self._save_to_file()
        return self.data["usage"][month_key]
    
    def get_monthly_usage(self, user_id: str, year: int, month: int) -> Dict:
        """Get user's monthly usage"""
        month_key = f"{user_id}_{year}_{month}"
        return self.data["usage"].get(month_key, {
            "message": 0,
            "token": 0,
            "research": 0,
            "presentation": 0,
            "image": 0
        })
    
    def check_usage_limit(self, user_id: str, resource_type: str) -> Dict:
        """Check if user is within usage limits"""
        now = datetime.now()
        usage = self.get_monthly_usage(user_id, now.year, now.month)
        sub = self.get_user_subscription(user_id)
        
        if not sub or not sub.get("plan"):
            # Default to Plus limits
            plan = self.data["plans"]["Plus"]
        else:
            plan = sub["plan"]
        
        features = plan.get("features", {})
        limit_key = f"max_{resource_type}s" if resource_type != "token" else "max_tokens"
        limit = features.get(limit_key, -1)
        
        current = usage.get(resource_type, 0)
        
        return {
            "resource_type": resource_type,
            "current": current,
            "limit": limit,
            "remaining": limit - current if limit > 0 else -1,
            "is_unlimited": limit < 0,
            "within_limit": limit < 0 or current < limit
        }
    
    # ═══════════════════════════════════════════════════════════
    # ADMIN FUNCTIONS
    # ═══════════════════════════════════════════════════════════
    
    def get_admin_stats(self) -> Dict:
        """Get admin dashboard statistics"""
        return {
            "total_users": len(self.data["users"]),
            "active_users": len([u for u in self.data["users"].values() if u.get("is_active")]),
            "total_sessions": len(self.data["sessions"]),
            "total_messages": sum(len(msgs) for msgs in self.data["messages"].values()),
            "total_presentations": len(self.data["presentations"]),
            "users_by_plan": self._count_users_by_plan(),
            "monthly_usage": self._get_total_monthly_usage()
        }
    
    def _count_users_by_plan(self) -> Dict:
        """Count users by plan"""
        counts = {"Go": 0, "Plus": 0, "Pro": 0}
        for sub in self.data["subscriptions"].values():
            plan_name = sub.get("plan_name", "Plus")
            counts[plan_name] = counts.get(plan_name, 0) + 1
        return counts
    
    def _get_total_monthly_usage(self) -> Dict:
        """Get total usage this month"""
        now = datetime.now()
        totals = {"message": 0, "token": 0, "research": 0, "presentation": 0, "image": 0}
        
        for key, usage in self.data["usage"].items():
            if f"_{now.year}_{now.month}" in key:
                for resource_type in totals:
                    totals[resource_type] += usage.get(resource_type, 0)
        
        return totals
    
    def log_audit(self, admin_email: str, action: str, target_email: str = None,
                 details: Dict = None) -> Dict:
        """Log admin action"""
        log = {
            "id": str(uuid.uuid4()),
            "admin_email": admin_email,
            "action": action,
            "target_email": target_email,
            "details": details or {},
            "created_at": datetime.now().isoformat()
        }
        self.data["audit_logs"].append(log)
        # Keep only last 1000 logs
        self.data["audit_logs"] = self.data["audit_logs"][-1000:]
        self._save_to_file()
        return log
    
    def get_audit_logs(self, limit: int = 100) -> List[Dict]:
        """Get recent audit logs"""
        return self.data["audit_logs"][-limit:][::-1]


# Singleton instance
_memory_db = None

def get_memory_db() -> MemoryDatabaseManager:
    """Get memory database manager singleton"""
    global _memory_db
    if _memory_db is None:
        _memory_db = MemoryDatabaseManager()
    return _memory_db
