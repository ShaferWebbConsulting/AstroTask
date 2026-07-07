# AstroTask Secure Gateway (MVP Prototype)

AstroTask Secure Gateway is a simulated secure API gateway between a Government mission system and representative commercial satellite tasking interfaces. It demonstrates authenticated, policy-enforced, encrypted, and auditable satellite tasking workflows using simulated data only.

## What AstroTask does

- Authenticates users with JWT login and role-based access control (MissionOperator, ISRApprover, SecurityOfficer, Admin).
- Accepts satellite tasking requests with mission metadata (AOI, sensor type, priority, classification, justification, provider preference, and timing).
- Enforces policy decisions (`Approved`, `Rejected`, `FlaggedForReview`) before acceptance.
- Encrypts task payloads with AES-256-GCM before database storage.
- Uses a modular crypto abstraction with a `pqc.rs` placeholder for future Kyber/Dilithium integration.
- Adapts internal requests into mock provider-specific formats (Maxar, Planet, BlackSky, Umbra, ICEYE).
- Writes tamper-evident audit ledger entries with hash chaining and exposes an integrity verification endpoint.
- Provides simulation endpoint `/simulate/mission-scenario` with representative Navy mission conditions and latency metrics.
- Provides a React mission dashboard for task creation, status monitoring, and approve/deny/flag actions.

## System architecture (Phase I SBIR style)

- **Gateway Layer (Rust/Axum):** Central control point for auth, policy, provider adaptation, and auditing.
- **Security Protocols:** JWT auth, RBAC, encrypted task payload persistence (AES-256-GCM), and tamper-evident audit hash chaining.
- **Commercial Tasking Interface Integration:** Mock adapters for major commercial providers with internal-to-provider translation and simulated responses.
- **Modeling & Simulation:** Representative mission scenario endpoint with policy outcomes and performance metrics.
- **Data Layer:** PostgreSQL for encrypted task payload storage and audit ledger records.

## Phase II prototype path

- Integrate real mission identity provider (federated auth + hardware-backed key management).
- Replace placeholder PQC module with operational hybrid/post-quantum schemes.
- Add provider-specific reliability/retry orchestration and secure message queues.
- Add hardened deployment controls (zero trust networking, managed secrets, FIPS cryptographic modules).
- Expand simulation to operational digital twin workflows and mission rehearsal datasets.

## Project layout

- `backend/src/main.rs`
- `backend/src/auth.rs`
- `backend/src/models.rs`
- `backend/src/policy.rs`
- `backend/src/crypto.rs`
- `backend/src/pqc.rs`
- `backend/src/providers/`
- `backend/src/audit.rs`
- `backend/src/routes.rs`
- `frontend/src/`
- `docker-compose.yml`

## Run locally

### Option A: Docker Compose

```bash
docker compose up --build
```

- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui`
- Frontend dashboard: `http://localhost:5173`

### Option B: Run services directly

1. Start PostgreSQL (local instance) and create database `astrotask`.
2. Backend:
   ```bash
   cd backend
   export DATABASE_URL=postgresql://postgres@localhost:5432/astrotask
   export JWT_SECRET=demo-jwt-secret-change-me
   export ENCRYPTION_KEY_32=01234567890123456789012345678901
   cargo run
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Demo workflow

1. Open dashboard at `http://localhost:5173`.
2. Login with a mock user (password for all users: `demo-password`):
   - `mission_operator`
   - `isr_approver`
   - `security_officer`
   - `admin`
3. Submit tasking requests from the task form.
4. Observe policy outcomes (`Approved`, `Rejected`, `FlaggedForReview`).
5. Use ISRApprover/Admin/SecurityOfficer actions to approve/deny/flag tasks.
6. Verify tamper-evident audit status from dashboard or `GET /audit/verify`.
7. Run simulation endpoint `GET /simulate/mission-scenario` for representative mission metrics.

## Secure commercial satellite tasking value

This prototype demonstrates a controlled mediation layer where mission users can submit commercial satellite tasking requests while maintaining mission-grade controls: authenticated access, role-based policy governance, encrypted persistence, and cryptographically chained auditability. It is intentionally simulation-only and excludes classified data, production credentials, and live commercial API keys.
