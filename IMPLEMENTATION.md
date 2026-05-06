# 구현 계획

**스택**: Next.js (App Router) + React + TypeScript
**데이터 저장**: 로컬 JSON 파일 (초기 단계, 추후 DB로 교체 가능하도록 추상화)

---

## 1. 아키텍처 개요

### 1.1 전체 구조

```
[브라우저 React UI]
       ↓ fetch
[Next.js Route Handlers (app/api/*)]
       ↓
[Repository Layer (인터페이스)]
       ↓
[JSON File Store (구현체)]
       ↓
data/*.json
```

### 1.2 핵심 설계 원칙

- **Repository 패턴**: 데이터 접근을 인터페이스로 추상화하여 JSON → DB 전환을 쉽게.
- **서버에서만 파일 I/O**: JSON 읽기/쓰기는 Route Handler 또는 Server Action에서만. 클라이언트는 fetch로만 접근.
- **동시성 처리**: 파일 쓰기 시 락을 사용하거나 큐로 직렬화 (경쟁 조건 방지).
- **타입 일원화**: 거래/카테고리 등의 타입을 `types/` 에 정의하여 서버·클라이언트 공유.

---

## 2. 디렉토리 구조

```
budgetbook/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # 대시보드 (/)
│   ├── transactions/
│   │   ├── page.tsx              # 거래 목록 및 입력
│   │   └── [id]/page.tsx         # 거래 상세/수정
│   ├── categories/page.tsx       # 카테고리 관리
│   ├── reports/page.tsx          # 월별 리포트
│   ├── login/page.tsx            # 로그인
│   ├── signup/page.tsx           # 회원가입
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── signup/route.ts
│       │   └── logout/route.ts
│       ├── transactions/
│       │   ├── route.ts          # GET(list), POST(create)
│       │   └── [id]/route.ts     # GET, PUT, DELETE
│       ├── categories/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── reports/
│           └── monthly/route.ts
├── components/
│   ├── ui/                       # 버튼, 인풋 등 공용
│   ├── transaction/
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionList.tsx
│   │   └── QuickAddBar.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── CategoryPieChart.tsx
│   │   └── DailyTrendChart.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts              # Repository 팩토리
│   │   ├── types.ts              # Repository 인터페이스
│   │   ├── json-store.ts         # JSON 파일 읽기/쓰기 유틸 (락 포함)
│   │   ├── user-repo.ts
│   │   ├── transaction-repo.ts
│   │   └── category-repo.ts
│   ├── auth/
│   │   ├── session.ts            # 세션 쿠키 처리
│   │   └── password.ts           # 해싱 (bcrypt)
│   ├── validation/               # zod 스키마
│   └── utils/
│       └── date.ts
├── types/
│   ├── transaction.ts
│   ├── category.ts
│   └── user.ts
├── data/                         # JSON 저장소 (gitignore)
│   ├── users.json
│   ├── transactions.json
│   └── categories.json
├── public/
├── tests/
├── .env.local
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 3. 데이터 모델

### 3.1 타입 정의

```ts
// types/user.ts
export interface User {
  id: string;               // uuid
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;        // ISO 8601
}

// types/category.ts
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isDefault: boolean;
}

// types/transaction.ts
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;           // 원화, 정수
  categoryId: string;
  date: string;             // YYYY-MM-DD
  memo?: string;
  paymentMethod?: string;   // '현금' | '카드' | '계좌이체' 등
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 JSON 파일 스키마

각 JSON 파일은 배열이 아닌 **객체 기반 인덱스** 구조로 저장하여 ID 조회 성능을 확보.

```json
// data/transactions.json
{
  "version": 1,
  "records": {
    "tx_01H...": { "id": "tx_01H...", "userId": "u_01H...", ... },
    "tx_02H...": { ... }
  }
}
```

---

## 4. 데이터 접근 계층 (Repository)

### 4.1 JSON Store 유틸

```ts
// lib/db/json-store.ts (개념)
async function readJson<T>(path: string): Promise<T> { ... }
async function writeJson<T>(path: string, data: T): Promise<void> { ... }

// 파일 락: proper-lockfile 또는 직렬화 큐 사용
async function withLock<T>(path: string, fn: () => Promise<T>): Promise<T> { ... }
```

- **읽기**: 매번 파일 읽기 + 메모리 캐시 (invalidation은 쓰기 시).
- **쓰기**: 락 획득 → 읽기 → 수정 → 원자적 쓰기 (`tmp` 파일 → `rename`).
- **백업**: 쓰기 전 `.bak` 파일 유지.

### 4.2 Repository 인터페이스

```ts
export interface TransactionRepository {
  list(userId: string, filter?: TransactionFilter): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
  update(id: string, data: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
```

JSON 구현체는 `JsonTransactionRepository`. 추후 `PrismaTransactionRepository` 등으로 교체 가능.

---

## 5. 인증

### 5.1 방식

- 세션 기반: HttpOnly 쿠키에 서명된 세션 ID 저장.
- 간단하게: `iron-session` 사용 (Next.js 친화적, JSON 저장과 궁합 좋음).
- 비밀번호: `bcrypt` (saltRounds 10).

### 5.2 흐름

1. `/signup`: 이메일 중복 확인 → 해시 생성 → `users.json` 추가 → 세션 쿠키 발급.
2. `/login`: 해시 비교 → 세션 쿠키 발급.
3. 보호된 라우트: `middleware.ts`에서 세션 검증, 미로그인 시 `/login` 리다이렉트.
4. API 보호: Route Handler 진입 시 세션 확인 후 `userId` 추출.

---

## 6. API 설계 (Route Handlers)

REST 스타일. 모든 응답은 JSON, 에러는 `{ error: { code, message } }` 포맷.

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/transactions?month=YYYY-MM&category=...` | 거래 목록 |
| POST | `/api/transactions` | 거래 생성 |
| GET | `/api/transactions/:id` | 거래 단건 |
| PUT | `/api/transactions/:id` | 거래 수정 |
| DELETE | `/api/transactions/:id` | 거래 삭제 |
| GET | `/api/categories` | 카테고리 목록 |
| POST | `/api/categories` | 카테고리 생성 |
| PUT | `/api/categories/:id` | 카테고리 수정 |
| DELETE | `/api/categories/:id` | 카테고리 삭제 |
| GET | `/api/reports/monthly?month=YYYY-MM` | 월별 집계 |

**입력 검증**: 모든 요청 body는 `zod` 스키마로 파싱 후 처리.

---

## 7. 프론트엔드

### 7.1 상태 관리 및 데이터 페칭

- **서버 상태**: `@tanstack/react-query` — 캐싱, 낙관적 업데이트, 재검증.
- **클라이언트 상태**: React 내장 `useState` / `useReducer`. 전역 필요 시 `zustand` 고려.
- **폼**: `react-hook-form` + `zod` (서버와 동일 스키마 재사용).

### 7.2 스타일링

- **Tailwind CSS**: 빠른 프로토타이핑, 유지보수 용이.
- **컴포넌트**: `shadcn/ui`로 기본 UI 키트 구성 (버튼, 인풋, 다이얼로그).
- **차트**: `recharts` (React 친화적, 학습 곡선 낮음).

### 7.3 주요 페이지 구성

- **대시보드 (`/`)**: 이번 달 요약 카드, 카테고리 파이차트, 일별 트렌드, 최근 거래 5건.
- **거래 목록 (`/transactions`)**: 월 단위 필터, 퀵 입력 바, 무한 스크롤 또는 페이지네이션.
- **카테고리 관리 (`/categories`)**: 수입/지출 탭, 드래그 정렬.
- **리포트 (`/reports`)**: 월 선택, 전월 비교, 카테고리별 상세.
- **설정 (`/settings`)**: 프로필, 비밀번호 변경, 데이터 내보내기.

---

## 8. 구현 단계

### Step 1: 프로젝트 셋업 (0.5일)
- `create-next-app` (TS, App Router, Tailwind)
- ESLint, Prettier 설정
- `tsconfig` paths (`@/*`)
- 필수 패키지 설치: `zod`, `bcrypt`, `iron-session`, `uuid`, `proper-lockfile`, `@tanstack/react-query`, `react-hook-form`, `recharts`

### Step 2: 데이터 계층 (1-2일)
- `data/` 디렉토리 및 초기 JSON 파일 생성 스크립트
- `json-store.ts` (읽기/쓰기/락)
- Repository 인터페이스 및 JSON 구현체
- 단위 테스트 (Vitest)

### Step 3: 인증 (1일)
- `iron-session` 설정
- 회원가입/로그인/로그아웃 API
- `middleware.ts`로 라우트 보호
- 로그인/회원가입 페이지

### Step 4: 카테고리 (0.5일)
- CRUD API
- 최초 로그인 시 기본 카테고리 자동 생성
- 관리 페이지

### Step 5: 거래 CRUD (2일)
- CRUD API (필터링 포함)
- 거래 입력 폼 컴포넌트
- 거래 목록 페이지
- 수정/삭제 플로우

### Step 6: 대시보드 (1-2일)
- 월별 집계 API (`/api/reports/monthly`)
- 요약 카드 컴포넌트
- 차트 컴포넌트 (파이, 라인)

### Step 7: 리포트 페이지 (1일)
- 월 선택 UI
- 전월 대비 증감
- 카테고리별 상세

### Step 8: 마감 (1일)
- 반응형 점검
- 에러 바운더리 및 빈 상태 UI
- 다크 모드 (선택)
- 수동 QA

**총 예상: 8-10일 (1인 기준, 집중 작업 시)**

---

## 9. 주의사항 및 결정 필요

### 9.1 JSON 저장의 한계 (미리 인지할 것)
- 동시 쓰기 시 경쟁 조건 → 파일 락 필수.
- 데이터 증가 시 성능 저하 → 수천 건 수준까지는 괜찮지만 그 이상은 DB 전환 필요.
- 트랜잭션 없음 → 여러 파일에 걸친 변경은 원자성 보장 어려움.
- 백업/복구는 파일 복사로만 가능.

### 9.2 결정 필요 항목
- **Node 런타임**: App Router의 Route Handler에서 파일 I/O를 쓰려면 `export const runtime = 'nodejs'` 명시 필요.
- **배포 환경**: Vercel은 파일 시스템이 **읽기 전용**. 로컬 개발용으로만 JSON을 쓰거나, 배포 시에는 볼륨을 지원하는 환경(Railway, Fly.io, VPS) 필요.
- **단일 사용자 vs 다중 사용자**: 처음엔 혼자만 쓴다면 인증을 생략하고 환경 변수 기반 단일 유저로 시작할 수도 있음.
- **백업 전략**: 주기적으로 `data/` 스냅샷을 저장할지.

### 9.3 JSON → DB 마이그레이션 대비
- Repository 인터페이스 준수 → 구현체 교체만으로 전환.
- 향후 Prisma + SQLite 가장 부담 없음. 같은 파일 기반이지만 인덱스/트랜잭션 확보.
- 마이그레이션 스크립트: `data/*.json` → DB insert.

---

## 10. 초기 패키지 목록 (참고)

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "zod": "^3",
    "bcrypt": "^5",
    "iron-session": "^8",
    "uuid": "^10",
    "proper-lockfile": "^4",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "recharts": "^2",
    "date-fns": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/bcrypt": "^5",
    "@types/uuid": "^10",
    "tailwindcss": "^3",
    "eslint": "^9",
    "eslint-config-next": "^15",
    "prettier": "^3",
    "vitest": "^2"
  }
}
```
