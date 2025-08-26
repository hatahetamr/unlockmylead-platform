# 🚀 FINAL Deployment UAT Playbook

**Project:** UnlockMyLead Platform  
**Environment:** UAT/Staging  
**Duration:** 45 minutes  
**Version:** v1.0.0

---

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] All feature branches merged to `main`
- [ ] CI/CD pipeline passing (green build)
- [ ] Database migrations reviewed and tested
- [ ] Environment variables configured
- [ ] Staging environment accessible
- [ ] QA team notified of deployment window

### 🔧 Technical Requirements
- [ ] Docker containers built and tagged
- [ ] Database backup completed
- [ ] SSL certificates valid
- [ ] Load balancer configured
- [ ] Monitoring dashboards accessible

---

## 🎯 Deployment Steps

### Phase 1: Pre-Deployment (10 minutes)

#### Step 1.1: Environment Preparation
```bash
# Navigate to project root
cd /path/to/unlockmylead-platform

# Pull latest changes
git checkout main
git pull origin main

# Verify current tag
git tag --list | tail -5
```

#### Step 1.2: Database Backup
```bash
# Create backup
pg_dump $UAT_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -la backup_*.sql
```

#### Step 1.3: Service Health Check
```bash
# Check current services
docker ps
kubectl get pods -n staging

# Verify endpoints
curl -f https://staging.unlockmylead.com/health
```

### Phase 2: Deployment (20 minutes)

#### Step 2.1: Deploy Backend Services
```bash
# Deploy microservices
kubectl apply -f k8s/staging/

# Wait for rollout
kubectl rollout status deployment/api-service -n staging
kubectl rollout status deployment/crm-service -n staging
```

#### Step 2.2: Database Migrations
```bash
# Run migrations
npm run migrate:staging

# Verify migration status
npm run migrate:status
```

#### Step 2.3: Deploy Frontend
```bash
# Build and deploy frontend
npm run build:staging
npm run deploy:staging

# Verify deployment
curl -f https://staging.unlockmylead.com
```

### Phase 3: Post-Deployment Verification (15 minutes)

#### Step 3.1: Service Health Verification
- [ ] **API Health Check**
  ```bash
  curl -f https://staging-api.unlockmylead.com/health
  ```
  Expected: `{"status": "healthy", "timestamp": "..."}` ✅

- [ ] **Database Connectivity**
  ```bash
  npm run db:test-connection
  ```
  Expected: `Database connection successful` ✅

- [ ] **Frontend Loading**
  - Navigate to: https://staging.unlockmylead.com
  - Expected: Login page loads within 3 seconds ✅

#### Step 3.2: Core Functionality Testing

- [ ] **Authentication Flow**
  - Login with test credentials: `qa@unlockmylead.com`
  - Expected: Successful login, dashboard loads ✅

- [ ] **CRM Integration**
  - Test lead creation
  - Verify HubSpot sync
  - Expected: Lead appears in both systems within 30 seconds ✅

- [ ] **API Endpoints**
  ```bash
  # Test critical endpoints
  curl -H "Authorization: Bearer $TEST_TOKEN" \
       https://staging-api.unlockmylead.com/api/leads
  ```
  Expected: JSON response with leads array ✅

#### Step 3.3: Performance Verification

- [ ] **Response Times**
  - API response < 500ms ✅
  - Page load time < 3 seconds ✅
  - Database queries < 100ms ✅

- [ ] **Resource Usage**
  - CPU usage < 70% ✅
  - Memory usage < 80% ✅
  - Disk space > 20% free ✅

---

## 🔍 7-Step Validation Checklist

### ✅ Step 1: System Health
- [ ] All services running (API, CRM, Frontend)
- [ ] Database connections established
- [ ] No critical errors in logs
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 2: Authentication & Security
- [ ] Login/logout functionality working
- [ ] JWT tokens generating correctly
- [ ] SSL certificates valid
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 3: Core Business Logic
- [ ] Lead creation and management
- [ ] CRM synchronization (HubSpot, Salesforce)
- [ ] Email automation triggers
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 4: Integrations
- [ ] Third-party API connections
- [ ] Webhook endpoints responding
- [ ] Data flow between services
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 5: User Interface
- [ ] All pages loading correctly
- [ ] Forms submitting successfully
- [ ] Real-time updates working
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 6: Performance & Monitoring
- [ ] Response times within SLA
- [ ] Error rates < 1%
- [ ] Monitoring alerts configured
- **Sign-off:** _______________ **Date:** _______________

### ✅ Step 7: Data Integrity
- [ ] Database consistency checks
- [ ] Backup and restore tested
- [ ] Data migration verification
- **Sign-off:** _______________ **Date:** _______________

---

## 🚨 Rollback Procedure

**Maximum Downtime:** 5 minutes

### Quick Rollback (< 2 minutes)
```bash
# Rollback to previous version
kubectl rollout undo deployment/api-service -n staging
kubectl rollout undo deployment/crm-service -n staging

# Verify rollback
kubectl rollout status deployment/api-service -n staging
```

### Database Rollback (if needed)
```bash
# Restore from backup
psql $UAT_DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Verify data integrity
npm run db:verify
```

### Emergency Contacts
- **DevOps Lead:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Product Owner:** [Contact Info]

---

## 📊 UAT Results Summary

**Deployment Date:** _______________  
**Deployed By:** _______________  
**QA Lead:** _______________  

### Test Results
| Test Category | Status | Notes |
|---------------|--------|-------|
| System Health | ⏳ Pending | |
| Authentication | ⏳ Pending | |
| Core Features | ⏳ Pending | |
| Integrations | ⏳ Pending | |
| UI/UX | ⏳ Pending | |
| Performance | ⏳ Pending | |
| Data Integrity | ⏳ Pending | |

### Overall UAT Status
- [ ] ✅ **PASSED** - Ready for Production
- [ ] ⚠️ **PASSED WITH NOTES** - Minor issues documented
- [ ] ❌ **FAILED** - Critical issues found, rollback required

### Next Steps
- [ ] Update Release_v1.0.0.md with UAT results
- [ ] Schedule production deployment
- [ ] Notify stakeholders of UAT completion

---

**UAT Completion Signature:**  
**QA Lead:** _______________ **Date:** _______________  
**DevOps:** _______________ **Date:** _______________  
**Product Owner:** _______________ **Date:** _______________
