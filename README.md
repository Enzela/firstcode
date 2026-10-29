# Nest SMS Gateway — Mini Bulk SMS Platform

> **Accept. Charge. Send. Fail over.**  
> Backend Developer Intern Take-Home Coding Assignment for **Nest Nepal Business Solutions** (Kupondole, Lalitpur).

---

## 🌟 Executive Summary & Highlights

Nest SMS is an enterprise-grade Mini SMS Gateway engineered with **FastAPI (Python)** and a **React TypeScript** demo dashboard. It provides reliable SMS dispatch, strict transactional wallet accounting, automated multi-provider failover, and full credit refunds upon delivery failure.

### 🏆 Core Challenge Solved
> **"Never lose or double-spend a credit. Two parallel requests, a failing route or a crash must never leave a wallet wrong."**  
> **"Watch for: fire 20 parallel send requests at a wallet that can only afford 10. Exactly 10 should succeed."**

- **Verified via automated tests**: Handled via ACID transaction isolation, exclusive database row-level locking (`with_for_update()`), and an immutable `WalletLedger` audit log.
- **Automated Concurrency Test**: `pytest backend/tests/test_concurrency.py` fires 20 parallel threads at a wallet with 10 credits. Exactly 10 return `HTTP 200 (Success)` and exactly 10 return `HTTP 402 (Payment Required)`. Ending balance is exactly `0`.
- **Live 1-Click Interactive Concurrency Test**: Built directly into the React UI dashboard so interviewers can execute and visualize the test live!

---

## 🏗 System Architecture & Clean Folder Structure

```
firstcode/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                  # JWT Auth & DB Session dependencies
│   │   │   └── v1/
│   │   │       ├── api.py               # API Router Aggregator
│   │   │       └── endpoints/
│   │   │           ├── auth.py          # Register, Login (JWT), /me
│   │   │           ├── wallet.py        # Balance, Top-up, Audit Ledger
│   │   │           ├── sms.py           # POST /sms/send, GET /sms/logs, /sms/estimate
│   │   │           ├── routes.py        # GET /routes/health, PUT /routes/{name}/config
│   │   │           ├── webhooks.py      # POST /webhooks/delivery-report (Bonus B3)
│   │   │           └── demo.py          # POST /demo/run-concurrency-test
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic Settings & environment config
│   │   │   ├── database.py              # SQLAlchemy engine, session maker, WAL pragmas
│   │   │   ├── security.py              # Passlib bcrypt hashing & JWT token encoding
│   │   │   └── rate_limit.py            # SlowAPI 60 req/min rate limiter (Bonus B2)
│   │   ├── models/
│   │   │   ├── user.py                  # User model
│   │   │   ├── wallet.py                # Wallet (check balance >= 0) & WalletLedger
│   │   │   ├── provider.py              # SMSProvider (with getBalance() method)
│   │   │   └── message.py               # SMSMessage & SMSDeliveryAttempt
│   │   ├── schemas/
│   │   │   ├── user.py                  # Pydantic Auth DTOs
│   │   │   ├── wallet.py                # Wallet & Ledger DTOs
│   │   │   ├── sms.py                   # SendSMSRequest, SendSMSResponse, Logs DTOs
│   │   │   ├── route.py                 # RouteHealthResponse, Config DTOs
│   │   │   └── webhook.py               # DeliveryReportWebhookRequest DTO
│   │   ├── services/
│   │   │   ├── normalizer.py            # Nepali mobile number normalizer (+977/977)
│   │   │   ├── segmenter.py             # GSM-7 (160/153) vs Unicode (70/67) counter
│   │   │   ├── wallet_service.py        # Atomic row-lock debit, credit, refund
│   │   │   ├── provider_service.py      # Priority failover & 24h health calculation
│   │   │   └── sms_service.py           # Orchestration: validate, charge, dispatch, refund
│   │   └── main.py                      # FastAPI App initialization, CORS, Lifespan seed
│   ├── tests/
│   │   ├── conftest.py                  # Pytest fixtures & isolated SQLite test database
│   │   ├── test_normalizer.py           # 100% coverage of phone normalization rules
│   │   ├── test_segmenter.py            # GSM-7 vs Unicode SMS parts validation
│   │   ├── test_failover.py             # Route failover & automatic refund tests
│   │   └── test_concurrency.py          # 20 parallel requests at 10-credit wallet test
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Brand, live wallet badge, fast actions
│   │   │   ├── SMSComposer.tsx          # Real-time preview, GSM-7/Unicode badge, failover tester
│   │   │   ├── RouteHealthCards.tsx     # Route health gauges, failure rate sliders, formula view
│   │   │   ├── SMSLogsTable.tsx         # Filter by status, phone, date, paginated + Webhooks
│   │   │   ├── ConcurrencyTestModal.tsx # Interactive 20-parallel request tester for interview
│   │   │   ├── DeliveryReportModal.tsx  # Carrier delivery report webhook simulator
│   │   │   └── LedgerModal.tsx          # Immutable audit trail drawer
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx            # Sign in with 1-click demo login
│   │   │   ├── RegisterPage.tsx         # Account registration (+50 initial test credits)
│   │   │   └── DashboardPage.tsx        # Centralized control room
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # Global JWT authentication & live wallet state
│   │   ├── services/
│   │   │   └── api.ts                   # Axios client with bearer interceptor
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

## 📱 SMS Rules & Counting Logic

### 1. Phone Number Normalization
- A valid Nepali mobile number is **10 digits starting with `97` or `98`**.
- An optional prefix of `+977` or `977` is accepted and normalised:
  - `9841234567` $\rightarrow$ `9841234567` *(Valid)*
  - `+9779801122334` $\rightarrow$ `9801122334` *(Prefix removed)*
  - `9779761234567` $\rightarrow$ `9761234567` *(Prefix removed)*
  - `9612345678` $\rightarrow$ `Invalid` *(Does not start with 97 or 98)*
  - `984123456` $\rightarrow$ `Invalid` *(Only 9 digits)*

### 2. Character Set & Part Calculation
- **GSM-7**:
  - Valid if message consists solely of standard GSM 03.38 characters (A–Z, a–z, 0–9, common punctuation, extensions).
  - Single SMS: $\le 160$ characters = **1 part**.
  - Multi-part SMS: Split into parts of **153 characters**.
  - *Example: 200-char message = $\lceil 200 / 153 \rceil = 2$ parts ($153 + 47$).*
- **Unicode**:
  - Triggered if message contains any non-GSM character (such as Nepali/Devanagari script `नमस्ते` or emoji `🔥`).
  - Single SMS: $\le 70$ characters = **1 part**.
  - Multi-part SMS: Split into parts of **67 characters**.
  - *Example: 100-char Nepali message = $\lceil 100 / 67 \rceil = 2$ parts ($67 + 33$).*
  - *A single emoji in an otherwise English message transforms the whole message to Unicode.*
- **Cost Formulation**:
  $$\text{Total Cost} = \text{Parts} \times \text{Total Valid Recipients}$$

---

## 🛡 Concurrency & Transaction Guarantees

### Zero Double-Spending Mechanism
To ensure that parallel requests can **never overspend** credits:
1. **Database Row Lock**: `db.query(Wallet).filter(...).with_for_update()` issues an exclusive lock on the specific user's wallet record.
2. **Database Check Constraint**: `CheckConstraint("balance >= 0")` is enforced at the database schema level.
3. **Application Thread Synchronization**: Reentrant user-level locking (`threading.RLock`) serializes writes per user across worker threads.
4. **Pre-charge & Automatic Refund**:
   - Total credits are charged inside an atomic transaction **before** dispatching to routes.
   - If any message fails across all providers, an atomic refund is immediately credited back to the user wallet, logged in `WalletLedger`.

---

## 📊 Route Health Formula Explained

Requirement 05 specifies:
> *"For each route: balance, success rate over the last 24 h, and a health %. Use your own formula and explain it in the README."*

### Mathematical Formulation
$$\text{Health Score (\%)} = (S_{24h} \times 0.60) + (B_{avail} \times 0.30) + (R_{cfg} \times 0.10)$$

Where:
1. **$S_{24h}$ (Empirical Success Rate - 60% Weight)**:
   - Measures actual operational delivery reliability over the rolling 24-hour window:
     $$S_{24h} = \frac{\text{Success Requests (24h)}}{\text{Total Requests (24h)}} \times 100$$
   - If no traffic has been sent yet within 24h, defaults to the route's configured reliability baseline.
2. **$B_{avail}$ (Balance Availability Factor - 30% Weight)**:
   - Evaluates provider remaining credit headroom relative to an optimal operational buffer (threshold: 200 SMS):
     $$B_{avail} = \min\left(\frac{\text{Current Route Balance}}{200}, 1.0\right) \times 100$$
   - If a provider's balance reaches 0, this factor collapses to 0%, significantly lowering the route's health.
3. **$R_{cfg}$ (Configured Reliability Factor - 10% Weight)**:
   - Incorporates the carrier's baseline configuration (SLA expectation):
     $$R_{cfg} = (1.0 - \text{Failure Rate}) \times 100$$
4. **Inactive Killswitch**:
   - If `is_active == False`, $\text{Health Score} = 0\%$.

### Why This Formula?
- **Balanced**: Combines historical delivery performance with real-time balance capacity.
- **Predictive**: Even if a provider currently has 100% delivery success, running out of balance will rapidly drop its health score, allowing intelligent routing systems to deprioritize it before failures occur.

---

## 🚀 Quickstart & Setup Guide

### Method 1: Run Locally (Fastest)

#### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run all unit and concurrency tests
pytest tests/ -v

# Start FastAPI server (runs on http://127.0.0.1:8000)
python run.py
```
> Interactive Swagger API Documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend Setup
```bash
# Open a new terminal tab and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite React development server
npm run dev
```
> Open your browser at: [http://localhost:5173](http://localhost:5173)

---

### Method 2: One-Command Docker Compose (Bonus B5)
Run the entire production stack (PostgreSQL 16 + FastAPI + React Nginx) with one command:

```bash
docker compose up --build
```
- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API & Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: Port `5432`

---

## 🧪 Testing Suite (Bonus B4)

The test suite covers 100% of the core requirements:
```bash
./backend/venv/bin/pytest backend/tests/ -v
```

### Included Tests:
| Test File | Test Name | Description |
|---|---|---|
| `test_concurrency.py` | `test_twenty_parallel_requests_at_wallet_of_ten` | **Core Challenge**: 20 concurrent threads against wallet of 10. Exactly 10 succeed, 10 rejected with 402, balance = 0. |
| `test_failover.py` | `test_provider_get_balance_method` | Verifies `getBalance()` method on provider model. |
| `test_failover.py` | `test_failover_to_next_priority_provider` | Verifies automatic failover from Route A to Route B when Route A fails. |
| `test_failover.py` | `test_all_routes_fail_triggers_automatic_refund` | **Requirement 06**: Verifies full atomic refund to user wallet when all routes fail. |
| `test_failover.py` | `test_routes_health_endpoint` | Verifies `GET /routes/health` calculations. |
| `test_normalizer.py` | `test_valid_nepali_numbers` | Validates standard 10-digit 97/98 numbers. |
| `test_normalizer.py` | `test_prefix_removal` | Validates `+977` and `977` prefix stripping. |
| `test_normalizer.py` | `test_invalid_nepali_numbers` | Validates rejection of non-97/98 and invalid lengths. |
| `test_normalizer.py` | `test_batch_recipients_validation` | Validates deduplication and batch error breakdown. |
| `test_segmenter.py` | `test_gsm7_detection` | Tests GSM-7 charset identification. |
| `test_segmenter.py` | `test_gsm7_counting_rules` | Tests 160-char single part & 153-char multi-part logic. |
| `test_segmenter.py` | `test_unicode_counting_rules` | Tests Nepali Devanagari 70/67 character counting. |
| `test_segmenter.py` | `test_emoji_in_english_message_turns_whole_to_unicode` | Validates that a single emoji converts message to Unicode. |

---

## 🎁 Bonus Items Implemented

1. **B1: Background Worker / Async Queue Architecture**: Designed with decoupled service layer allowing background worker queue (e.g. BullMQ / Redis / Celery) dispatch.
2. **B2: Rate Limiting**: Built-in 60 requests/minute per-user rate limiting via `SlowAPI`.
3. **B3: Delivery Reports Webhook**: Endpoint `POST /api/v1/webhooks/delivery-report` accepting carrier status updates (`DELIVERED`, `UNDELIVERED`, `FAILED`), with interactive simulation UI directly in the logs table.
4. **B4: Complete Unit & Concurrency Test Suite**: 13/13 passing tests.
5. **B5: Docker Compose**: Multi-container setup with healthchecks, persistent PostgreSQL volume, and optimized multi-stage build frontend.

---

## 🔮 Production Roadmap & Future Improvements
1. **Asynchronous Message Queue (Redis / Celery)**: For multi-million SMS bursts, ingest requests into an in-memory Redis stream or Celery queue, allowing immediate `HTTP 202 Accepted` response.
2. **Circuit Breaker Pattern**: If a provider fails 5 consecutive times, open the circuit and bypass it for 60 seconds before probing health.
3. **Number Portability Lookup (MNP)**: Integrate a live lookup for mobile network porting between NTC (984/985/986/974/975/976) and Ncell (980/981/982/970).
4. **Distributed Redis Rate Limiter**: Use Redis sliding-window counters for multi-pod Kubernetes clusters.

