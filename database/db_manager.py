"""
NINJA Database Manager
======================
PostgreSQL database connection and operations for Azure
With fallback to in-memory database when PostgreSQL is not available
"""
import os
from typing import Dict, List, Optional, Any
from contextlib import contextmanager
from datetime import datetime
import uuid
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Try to import psycopg2, fallback to memory db if not available
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, Json
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("⚠️  psycopg2 not available, using memory database")


class DatabaseManager:
    """PostgreSQL database manager for NINJA system"""
    
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL') or self._build_connection_string()
    
    def _build_connection_string(self) -> str:
        """Build connection string from environment variables"""
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '5432')
        database = os.getenv('DB_NAME', 'ninja_db')
        user = os.getenv('DB_USER', 'postgres')
        password = os.getenv('DB_PASSWORD', '')
        
        # Build connection string with optional password
        if password:
            return f"postgresql://{user}:{password}@{host}:{port}/{database}"
        else:
            return f"postgresql://{user}@{host}:{port}/{database}"
    
    @contextmanager
    def get_connection(self):
        """Get database connection with context manager"""
        conn = psycopg2.connect(self.connection_string)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    @contextmanager
    def get_cursor(self, dict_cursor=True):
        """Get database cursor"""
        with self.get_connection() as conn:
            cursor_factory = RealDictCursor if dict_cursor else None
            cursor = conn.cursor(cursor_factory=cursor_factory)
            try:
                yield cursor
            finally:
                cursor.close()
    
    # ═══════════════════════════════════════════════════════════
    # USER MANAGEMENT
    # ═══════════════════════════════════════════════════════════
    
    def get_or_create_user(self, email: str, name: str = None, google_id: str = None, 
                          avatar_url: str = None) -> Dict:
        """Get existing user or create new one"""
        with self.get_cursor() as cursor:
            # Try to get existing user
            cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
            
            if user:
                # Update last login
                cursor.execute(
                    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                return dict(user)
            
            # Create new user
            cursor.execute(
                """
                INSERT INTO users (email, name, google_id, avatar_url, role)
                VALUES (%s, %s, %s, %s, 'user')
                RETURNING *
                """,
                (email, name, google_id, avatar_url)
            )
            new_user = cursor.fetchone()
            
            # Create default settings
            cursor.execute(
                """
                INSERT INTO user_settings (user_id)
                VALUES (%s)
                """,
                (new_user['id'],)
            )
            
            return dict(new_user)
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            return dict(user) if user else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            return dict(user) if user else None
    
    def update_user_role(self, user_id: str, role: str) -> bool:
        """Update user role (admin only)"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "UPDATE users SET role = %s WHERE id = %s",
                (role, user_id)
            )
            return cursor.rowcount > 0
    
    def list_all_users(self, role: str = None) -> List[Dict]:
        """List all users (admin only)"""
        with self.get_cursor() as cursor:
            if role:
                cursor.execute(
                    "SELECT * FROM users WHERE role = %s ORDER BY created_at DESC",
                    (role,)
                )
            else:
                cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_user_activity_summary(self, user_id: str = None) -> List[Dict]:
        """Get user activity summary"""
        with self.get_cursor() as cursor:
            if user_id:
                cursor.execute(
                    "SELECT * FROM user_activity_summary WHERE id = %s",
                    (user_id,)
                )
            else:
                cursor.execute("SELECT * FROM user_activity_summary")
            
            return [dict(row) for row in cursor.fetchall()]
    
    # ═══════════════════════════════════════════════════════════
    # CHAT SESSIONS
    # ═══════════════════════════════════════════════════════════
    
    def create_chat_session(self, user_id: str, title: str = "New Chat") -> Dict:
        """Create new chat session"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO chat_sessions (user_id, title)
                VALUES (%s, %s)
                RETURNING *
                """,
                (user_id, title)
            )
            return dict(cursor.fetchone())
    
    def get_chat_session(self, session_id: str, user_id: str) -> Optional[Dict]:
        """Get chat session by ID (user-specific)"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM chat_sessions WHERE id = %s AND user_id = %s",
                (session_id, user_id)
            )
            session = cursor.fetchone()
            return dict(session) if session else None
    
    def list_chat_sessions(self, user_id: str, limit: int = 50) -> List[Dict]:
        """List user's chat sessions"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM chat_sessions 
                WHERE user_id = %s 
                ORDER BY updated_at DESC 
                LIMIT %s
                """,
                (user_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    def delete_chat_session(self, session_id: str, user_id: str) -> bool:
        """Delete chat session"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "DELETE FROM chat_sessions WHERE id = %s AND user_id = %s",
                (session_id, user_id)
            )
            return cursor.rowcount > 0
    
    # ═══════════════════════════════════════════════════════════
    # CHAT MESSAGES
    # ═══════════════════════════════════════════════════════════
    
    def add_message(self, session_id: str, role: str, content: str, 
                   model: str = None, metadata: Dict = None) -> Dict:
        """Add message to chat session"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO chat_messages (session_id, role, content, model, metadata)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (session_id, role, content, model, Json(metadata or {}))
            )
            return dict(cursor.fetchone())
    
    def get_session_messages(self, session_id: str, limit: int = 100) -> List[Dict]:
        """Get messages for a session"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM chat_messages 
                WHERE session_id = %s 
                ORDER BY created_at ASC 
                LIMIT %s
                """,
                (session_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    # ═══════════════════════════════════════════════════════════
    # PRESENTATIONS
    # ═══════════════════════════════════════════════════════════
    
    def create_presentation(self, user_id: str, title: str, topic: str,
                          slides: List[Dict], **kwargs) -> Dict:
        """Create new presentation"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO presentations 
                (user_id, session_id, title, topic, slide_count, style, aspect_ratio, slides, file_path, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    user_id,
                    kwargs.get('session_id'),
                    title,
                    topic,
                    len(slides),
                    kwargs.get('style', 'professional'),
                    kwargs.get('aspect_ratio', '16:9'),
                    Json(slides),
                    kwargs.get('file_path'),
                    Json(kwargs.get('metadata', {}))
                )
            )
            return dict(cursor.fetchone())
    
    def list_presentations(self, user_id: str, limit: int = 50) -> List[Dict]:
        """List user's presentations"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM presentations 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT %s
                """,
                (user_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    def get_presentation(self, presentation_id: str, user_id: str) -> Optional[Dict]:
        """Get presentation by ID"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM presentations WHERE id = %s AND user_id = %s",
                (presentation_id, user_id)
            )
            pres = cursor.fetchone()
            return dict(pres) if pres else None
    
    # ═══════════════════════════════════════════════════════════
    # USER SETTINGS
    # ═══════════════════════════════════════════════════════════
    
    def get_user_settings(self, user_id: str) -> Dict:
        """Get user settings"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM user_settings WHERE user_id = %s",
                (user_id,)
            )
            settings = cursor.fetchone()
            return dict(settings) if settings else {}
    
    def update_user_settings(self, user_id: str, **settings) -> Dict:
        """Update user settings"""
        with self.get_cursor() as cursor:
            # Build UPDATE query dynamically
            set_clause = ", ".join([f"{key} = %s" for key in settings.keys()])
            values = list(settings.values()) + [user_id]
            
            cursor.execute(
                f"""
                UPDATE user_settings 
                SET {set_clause}
                WHERE user_id = %s
                RETURNING *
                """,
                values
            )
            return dict(cursor.fetchone())
    
    # ═══════════════════════════════════════════════════════════
    # AUDIT LOGGING
    # ═══════════════════════════════════════════════════════════
    
    def log_audit(self, user_id: str, action: str, entity_type: str = None,
                 entity_id: str = None, details: Dict = None, 
                 ip_address: str = None, user_agent: str = None):
        """Log audit event"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, action, entity_type, entity_id, Json(details or {}), 
                 ip_address, user_agent)
            )
    
    def get_audit_logs(self, user_id: str = None, limit: int = 100) -> List[Dict]:
        """Get audit logs (admin feature)"""
        with self.get_cursor() as cursor:
            if user_id:
                cursor.execute(
                    """
                    SELECT * FROM audit_logs 
                    WHERE user_id = %s 
                    ORDER BY created_at DESC 
                    LIMIT %s
                    """,
                    (user_id, limit)
                )
            else:
                cursor.execute(
                    """
                    SELECT * FROM audit_logs 
                    ORDER BY created_at DESC 
                    LIMIT %s
                    """,
                    (limit,)
                )
            
            return [dict(row) for row in cursor.fetchall()]
    
    # ═══════════════════════════════════════════════════════════
    # SUBSCRIPTION PLANS
    # ═══════════════════════════════════════════════════════════
    
    def get_all_plans(self) -> List[Dict]:
        """Get all subscription plans"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly"
            )
            return [dict(row) for row in cursor.fetchall()]
    
    def get_plan_by_name(self, plan_name: str) -> Optional[Dict]:
        """Get subscription plan by name"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM subscription_plans WHERE name = %s",
                (plan_name,)
            )
            plan = cursor.fetchone()
            return dict(plan) if plan else None
    
    def get_plan_by_id(self, plan_id: str) -> Optional[Dict]:
        """Get subscription plan by ID"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM subscription_plans WHERE id = %s",
                (plan_id,)
            )
            plan = cursor.fetchone()
            return dict(plan) if plan else None
    
    # ═══════════════════════════════════════════════════════════
    # USER SUBSCRIPTIONS
    # ═══════════════════════════════════════════════════════════
    
    def get_user_subscription(self, user_id: str) -> Optional[Dict]:
        """Get user's active subscription with plan details"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT us.*, p.name as plan_name, p.display_name, p.limits, p.features
                FROM user_subscriptions us
                JOIN subscription_plans p ON us.plan_id = p.id
                WHERE us.user_id = %s AND us.status = 'active'
                """,
                (user_id,)
            )
            sub = cursor.fetchone()
            return dict(sub) if sub else None
    
    def assign_subscription(self, user_id: str, plan_name: str, 
                          billing_cycle: str = 'monthly',
                          expires_at: datetime = None) -> Dict:
        """Assign or update user subscription"""
        with self.get_cursor() as cursor:
            # Get plan ID
            plan = self.get_plan_by_name(plan_name)
            if not plan:
                raise ValueError(f"Plan '{plan_name}' not found")
            
            # Check if user already has subscription
            cursor.execute(
                "SELECT id FROM user_subscriptions WHERE user_id = %s",
                (user_id,)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Update existing subscription
                cursor.execute(
                    """
                    UPDATE user_subscriptions
                    SET plan_id = %s, status = 'active', billing_cycle = %s, 
                        expires_at = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    RETURNING *
                    """,
                    (plan['id'], billing_cycle, expires_at, user_id)
                )
            else:
                # Create new subscription
                cursor.execute(
                    """
                    INSERT INTO user_subscriptions 
                    (user_id, plan_id, status, billing_cycle, expires_at)
                    VALUES (%s, %s, 'active', %s, %s)
                    RETURNING *
                    """,
                    (user_id, plan['id'], billing_cycle, expires_at)
                )
            
            return dict(cursor.fetchone())
    
    def cancel_subscription(self, user_id: str) -> bool:
        """Cancel user subscription"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                UPDATE user_subscriptions
                SET status = 'cancelled', auto_renew = false
                WHERE user_id = %s
                """,
                (user_id,)
            )
            return cursor.rowcount > 0
    
    # ═══════════════════════════════════════════════════════════
    # USAGE TRACKING
    # ═══════════════════════════════════════════════════════════
    
    def track_usage(self, user_id: str, resource_type: str, 
                   resource_count: int = 1, model: str = None,
                   session_id: str = None, metadata: Dict = None):
        """Track resource usage"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO usage_tracking 
                (user_id, resource_type, resource_count, model, session_id, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, resource_type, resource_count, model, session_id, 
                 Json(metadata or {}))
            )
    
    def get_user_usage(self, user_id: str, resource_type: str = None,
                      start_date: datetime = None) -> List[Dict]:
        """Get user usage statistics"""
        with self.get_cursor() as cursor:
            query = """
                SELECT resource_type, COUNT(*) as count, 
                       SUM(resource_count) as total,
                       DATE_TRUNC('day', created_at) as date
                FROM usage_tracking
                WHERE user_id = %s
            """
            params = [user_id]
            
            if resource_type:
                query += " AND resource_type = %s"
                params.append(resource_type)
            
            if start_date:
                query += " AND created_at >= %s"
                params.append(start_date)
            
            query += " GROUP BY resource_type, DATE_TRUNC('day', created_at)"
            query += " ORDER BY date DESC"
            
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def get_monthly_usage(self, user_id: str, year: int, month: int) -> Dict:
        """Get monthly usage summary for a user"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT resource_type, SUM(resource_count) as total
                FROM usage_tracking
                WHERE user_id = %s 
                  AND EXTRACT(YEAR FROM created_at) = %s
                  AND EXTRACT(MONTH FROM created_at) = %s
                GROUP BY resource_type
                """,
                (user_id, year, month)
            )
            
            usage = {row['resource_type']: row['total'] 
                    for row in cursor.fetchall()}
            return usage
    
    def check_usage_limit(self, user_id: str, resource_type: str) -> Dict:
        """Check if user has exceeded usage limit"""
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            # No subscription - use free tier limits
            return {
                'allowed': False,
                'limit': 0,
                'used': 0,
                'remaining': 0
            }
        
        limits = subscription.get('limits', {})
        
        # Check if unlimited (Pro plan)
        if limits.get('unlimited', False):
            return {
                'allowed': True,
                'unlimited': True
            }
        
        # Get usage for current month
        now = datetime.now()
        monthly_usage = self.get_monthly_usage(user_id, now.year, now.month)
        
        # Map resource types to limit keys
        limit_map = {
            'message': 'messages_per_month',
            'token': 'tokens_per_message',
            'research': 'messages_per_month',
            'presentation': 'sessions',
            'image': 'sessions'
        }
        
        limit_key = limit_map.get(resource_type, 'messages_per_month')
        limit_value = limits.get(limit_key, 0)
        used = monthly_usage.get(resource_type, 0)
        
        # -1 means unlimited
        if limit_value == -1:
            return {
                'allowed': True,
                'unlimited': True
            }
        
        return {
            'allowed': used < limit_value,
            'limit': limit_value,
            'used': used,
            'remaining': max(0, limit_value - used)
        }
    
    # ═══════════════════════════════════════════════════════════
    # EMAIL WHITELIST (Admin)
    # ═══════════════════════════════════════════════════════════
    
    def add_to_whitelist(self, email: str, plan_name: str = None,
                        added_by: str = None, notes: str = None) -> Dict:
        """Add email to whitelist"""
        with self.get_cursor() as cursor:
            plan_id = None
            if plan_name:
                plan = self.get_plan_by_name(plan_name)
                plan_id = plan['id'] if plan else None
            
            cursor.execute(
                """
                INSERT INTO email_whitelist (email, plan_id, added_by, notes)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE 
                SET plan_id = EXCLUDED.plan_id, is_active = true,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
                """,
                (email, plan_id, added_by, notes)
            )
            return dict(cursor.fetchone())
    
    def remove_from_whitelist(self, email: str) -> bool:
        """Remove email from whitelist"""
        with self.get_cursor() as cursor:
            cursor.execute(
                "UPDATE email_whitelist SET is_active = false WHERE email = %s",
                (email,)
            )
            return cursor.rowcount > 0
    
    def check_whitelist(self, email: str) -> Optional[Dict]:
        """Check if email is whitelisted"""
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT w.*, p.name as plan_name, p.display_name
                FROM email_whitelist w
                LEFT JOIN subscription_plans p ON w.plan_id = p.id
                WHERE w.email = %s AND w.is_active = true
                """,
                (email,)
            )
            result = cursor.fetchone()
            return dict(result) if result else None
    
    def list_whitelist(self, is_active: bool = None) -> List[Dict]:
        """List all whitelisted emails"""
        with self.get_cursor() as cursor:
            if is_active is not None:
                cursor.execute(
                    """
                    SELECT w.*, p.name as plan_name, u.email as added_by_email
                    FROM email_whitelist w
                    LEFT JOIN subscription_plans p ON w.plan_id = p.id
                    LEFT JOIN users u ON w.added_by = u.id
                    WHERE w.is_active = %s
                    ORDER BY w.created_at DESC
                    """,
                    (is_active,)
                )
            else:
                cursor.execute(
                    """
                    SELECT w.*, p.name as plan_name, u.email as added_by_email
                    FROM email_whitelist w
                    LEFT JOIN subscription_plans p ON w.plan_id = p.id
                    LEFT JOIN users u ON w.added_by = u.id
                    ORDER BY w.created_at DESC
                    """
                )
            
            return [dict(row) for row in cursor.fetchall()]
    
    # ═══════════════════════════════════════════════════════════
    # ADMIN STATISTICS
    # ═══════════════════════════════════════════════════════════
    
    def get_system_stats(self) -> Dict:
        """Get system-wide statistics (admin only)"""
        with self.get_cursor() as cursor:
            stats = {}
            
            # Total users
            cursor.execute("SELECT COUNT(*) as count FROM users")
            stats['total_users'] = cursor.fetchone()['count']
            
            # Active users (logged in last 30 days)
            cursor.execute(
                """
                SELECT COUNT(*) as count FROM users 
                WHERE last_login_at >= NOW() - INTERVAL '30 days'
                """
            )
            stats['active_users'] = cursor.fetchone()['count']
            
            # Users by plan
            cursor.execute(
                """
                SELECT p.name, COUNT(us.user_id) as count
                FROM subscription_plans p
                LEFT JOIN user_subscriptions us ON p.id = us.plan_id AND us.status = 'active'
                GROUP BY p.name
                """
            )
            stats['users_by_plan'] = {row['name']: row['count'] 
                                     for row in cursor.fetchall()}
            
            # Total sessions
            cursor.execute("SELECT COUNT(*) as count FROM chat_sessions")
            stats['total_sessions'] = cursor.fetchone()['count']
            
            # Total messages
            cursor.execute("SELECT COUNT(*) as count FROM chat_messages")
            stats['total_messages'] = cursor.fetchone()['count']
            
            # Total presentations
            cursor.execute("SELECT COUNT(*) as count FROM presentations")
            stats['total_presentations'] = cursor.fetchone()['count']
            
            # Usage this month
            cursor.execute(
                """
                SELECT resource_type, SUM(resource_count) as total
                FROM usage_tracking
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY resource_type
                """
            )
            stats['monthly_usage'] = {row['resource_type']: row['total'] 
                                     for row in cursor.fetchall()}
            
            return stats


# Singleton instance
_db_manager = None
_use_memory_db = False

def get_db():
    """Get database manager singleton - uses memory DB as fallback"""
    global _db_manager, _use_memory_db
    
    if _db_manager is not None:
        return _db_manager
    
    # Try PostgreSQL first
    if POSTGRES_AVAILABLE and not _use_memory_db:
        try:
            _db_manager = DatabaseManager()
            # Test connection
            with _db_manager.get_cursor() as cursor:
                cursor.execute("SELECT 1")
            print("✅ PostgreSQL database connected")
            return _db_manager
        except Exception as e:
            print(f"⚠️  PostgreSQL connection failed: {e}")
            print("📂 Falling back to memory database")
            _use_memory_db = True
    
    # Fallback to memory database
    from database.memory_db import get_memory_db
    _db_manager = get_memory_db()
    return _db_manager

