# 🗄️ Azure PostgreSQL Database Setup Guide

## 📋 Overview

ระบบใช้ **Azure Database for PostgreSQL Flexible Server** เพื่อเก็บข้อมูล:
- ✅ User management (Admin/User roles)
- ✅ Chat sessions & messages
- ✅ Presentations
- ✅ Research blogs
- ✅ Audit logs

---

## 🚀 Step 1: Create Azure PostgreSQL Database

### Option A: Azure Portal (GUI)

1. Go to [Azure Portal](https://portal.azure.com)
2. Create Resource → **Azure Database for PostgreSQL Flexible Server**
3. Configuration:
   - **Server name**: `ninja-postgres`
   - **Location**: `Southeast Asia` (or your region)
   - **Version**: PostgreSQL 15
   - **Compute + Storage**: `Burstable, B1ms` (1 vCore, 2GB RAM) ~$12/month
   - **Admin username**: `ninja_admin`
   - **Admin password**: (create strong password)

4. **Networking**:
   - ✅ Allow public access from: `0.0.0.0 - 255.255.255.255` (for development)
   - ✅ Add current client IP address
   - Later: Restrict to your app's IP only

5. Click **Review + Create**

### Option B: Azure CLI (Command Line)

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="ai-presentation-rg"
LOCATION="swedencentral"
SERVER_NAME="ninja-postgres"
ADMIN_USER="ninja_admin"
ADMIN_PASSWORD="YourStrongPassword123!"
DB_NAME="ninja_db"

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password $ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME \
  --database-name $DB_NAME

echo "✅ PostgreSQL server created!"
echo "Connection string:"
echo "postgresql://$ADMIN_USER:$ADMIN_PASSWORD@$SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"
```

---

## 🔧 Step 2: Initialize Database Schema

```bash
# Install PostgreSQL client (if not installed)
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Ubuntu

# Connect to Azure PostgreSQL
psql "postgresql://ninja_admin:YourPassword@ninja-postgres.postgres.database.azure.com:5432/ninja_db?sslmode=require"

# Run schema file
\i database/schema.sql

# Or from command line:
psql "postgresql://..." < database/schema.sql
```

---

## 🔐 Step 3: Environment Variables

### Backend (.env)

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://ninja_admin:YourPassword@ninja-postgres.postgres.database.azure.com:5432/ninja_db?sslmode=require

# Or separate variables:
DB_HOST=ninja-postgres.postgres.database.azure.com
DB_PORT=5432
DB_NAME=ninja_db
DB_USER=ninja_admin
DB_PASSWORD=YourStrongPassword123!
DB_SSL_MODE=require
```

### Azure App Service Configuration

```bash
# Set environment variables in Azure App Service
az webapp config appsettings set \
  --resource-group ai-presentation-rg \
  --name ai-pres-api \
  --settings \
    DATABASE_URL="postgresql://ninja_admin:YourPassword@ninja-postgres.postgres.database.azure.com:5432/ninja_db?sslmode=require"
```

---

## 📦 Step 4: Install Python Dependencies

Add to `requirements.txt`:

```txt
# Database
psycopg2-binary>=2.9.9
```

Then install:

```bash
pip install psycopg2-binary
```

---

## 🧪 Step 5: Test Connection

```bash
cd /Users/t333838/Downloads/demov.2-main
python database/test_connection.py
```

---

## 👤 Step 6: Create Admin User

```python
from database.db_manager import get_db

db = get_db()

# Create admin user
admin = db.get_or_create_user(
    email="your-admin-email@gmail.com",
    name="Admin User"
)

# Set as admin
db.update_user_role(admin['id'], 'admin')

print(f"✅ Admin user created: {admin['email']}")
```

---

## 🔒 Security Best Practices

### 1. **SSL/TLS Connection** (Required for Azure)
```python
# Always use sslmode=require in connection string
DATABASE_URL = "postgresql://...?sslmode=require"
```

### 2. **Firewall Rules**
```bash
# Restrict to specific IPs after development
az postgres flexible-server firewall-rule create \
  --resource-group ai-presentation-rg \
  --name ninja-postgres \
  --rule-name app-service-ip \
  --start-ip-address YOUR_APP_IP \
  --end-ip-address YOUR_APP_IP
```

### 3. **Connection Pooling**
```bash
# Enable in Azure Portal:
# Settings → Server parameters → connection_max = 100
```

### 4. **Backup Configuration**
```bash
# Azure automatic backups (enabled by default)
# Retention: 7 days (Burstable tier)
# Can restore to any point in time
```

---

## 📊 Database Monitoring

### Check Database Size
```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'ninja_db';
```

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

---

## 🔄 Migration Path

### From localStorage to PostgreSQL

```python
# Script to migrate existing localStorage data
# Run this once after database setup

from database.db_manager import get_db
import json

db = get_db()

# Example: Migrate chat sessions
old_sessions = json.load(open('chat_sessions_backup.json'))

for session_data in old_sessions:
    # Create user
    user = db.get_or_create_user(session_data['user_email'])
    
    # Create session
    session = db.create_chat_session(
        user_id=user['id'],
        title=session_data['title']
    )
    
    # Add messages
    for msg in session_data['messages']:
        db.add_message(
            session_id=session['id'],
            role=msg['role'],
            content=msg['content']
        )

print("✅ Migration complete!")
```

---

## 💰 Cost Estimation

### Burstable Tier (Development/Small Scale)
- **B1ms** (1 vCore, 2GB RAM): ~$12/month
- **Storage**: 32GB included (~$0.115/GB for additional)
- **Backup**: 7 days included

### General Purpose (Production)
- **D2s_v3** (2 vCore, 8GB RAM): ~$150/month
- **Storage**: 128GB (~$15/month)
- **Backup**: 7-35 days

### Total Estimated Cost (Development):
- Database: $12/month
- Storage: Free (32GB included)
- **Total: ~$12-15/month**

---

## 🆘 Troubleshooting

### Cannot Connect
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group ai-presentation-rg \
  --name ninja-postgres

# Add your current IP
az postgres flexible-server firewall-rule create \
  --resource-group ai-presentation-rg \
  --name ninja-postgres \
  --rule-name my-ip \
  --start-ip-address $(curl -s ifconfig.me) \
  --end-ip-address $(curl -s ifconfig.me)
```

### SSL Certificate Error
```bash
# Download Azure root certificate
wget https://dl.cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem

# Use in connection string
DATABASE_URL="postgresql://...?sslmode=require&sslrootcert=/path/to/DigiCertGlobalRootCA.crt.pem"
```

### Performance Issues
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_name ON table_name(column_name);
```

---

## 📚 Useful Commands

```bash
# Backup database
pg_dump "postgresql://..." > backup.sql

# Restore database
psql "postgresql://..." < backup.sql

# Connect via Azure CLI
az postgres flexible-server connect \
  --name ninja-postgres \
  --admin-user ninja_admin \
  --database-name ninja_db

# Check server status
az postgres flexible-server show \
  --resource-group ai-presentation-rg \
  --name ninja-postgres
```

---

## ✅ Setup Checklist

- [ ] Create Azure PostgreSQL Flexible Server
- [ ] Configure firewall rules
- [ ] Create database `ninja_db`
- [ ] Run `schema.sql` to initialize tables
- [ ] Add `DATABASE_URL` to backend .env
- [ ] Install `psycopg2-binary`
- [ ] Test connection with `test_connection.py`
- [ ] Create first admin user
- [ ] Update backend API to use database
- [ ] Migrate existing data (if any)
- [ ] Configure backups
- [ ] Set up monitoring

---

## 🎯 Next Steps

1. ✅ Complete database setup
2. ✅ Update backend API to use PostgreSQL
3. ✅ Add admin dashboard
4. ✅ Implement user management UI
5. ✅ Add audit log viewer
6. ✅ Set up automated backups
