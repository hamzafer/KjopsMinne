# 09: Auth & Security

> Secure authentication with BankID and compliance with PSD2/SCA requirements.

## Status: Not Started

## One-liner

Norwegian-standard authentication using BankID with strong customer authentication for financial data access.

## User Stories

### Authentication
- **As a user**, I want to log in with BankID so I don't need another password.
- **As a user**, I want biometric login on mobile for quick access.
- **As a user**, I want to stay logged in on trusted devices.

### Security
- **As a user**, I want my financial data encrypted so it's protected.
- **As a user**, I want to see login history so I detect unauthorized access.
- **As a user**, I want to remotely log out other sessions.

### Consent Management
- **As a user**, I want to control which services access my data.
- **As a user**, I want to revoke access to connected services anytime.
- **As a user**, I want to understand what data each integration accesses.

### Compliance
- **As a user**, I want GDPR-compliant data handling.
- **As a user**, I want to export all my data.
- **As a user**, I want to delete my account and all data.

## Technical Approach

### Authentication Architecture
```
┌─────────────────────────────────────────────────────┐
│                 Authentication Flow                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  User → Login Page → BankID/Vipps → Callback        │
│                           ↓                          │
│                    Token Generation                  │
│                           ↓                          │
│              JWT (access) + Refresh Token            │
│                           ↓                          │
│                    Session Management                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### BankID Integration
```python
class BankIDAuth:
    """
    Norwegian BankID authentication.
    Provides: National identity verification, Strong authentication
    """

    async def initiate_login(self, redirect_uri: str) -> AuthSession:
        # Create BankID session
        pass

    async def handle_callback(self, code: str) -> AuthResult:
        # Exchange code for identity
        # Returns: national_id (fødselsnummer), name
        pass

    async def verify_identity(self, user_id: UUID) -> IdentityVerification:
        # Re-verify identity for sensitive operations
        pass
```

### Vipps Login
```python
class VippsLogin:
    """
    Vipps as alternative login method.
    Lower friction than BankID for returning users.
    """

    async def initiate_login(self, redirect_uri: str) -> AuthSession:
        pass

    async def handle_callback(self, code: str) -> AuthResult:
        # Returns: phone_number, name, email (optional)
        pass
```

### Data Model
```python
class User:
    id: UUID
    national_id_hash: str  # Hashed fødselsnummer
    name: str
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    last_login: datetime
    identity_verified: bool

class Session:
    id: UUID
    user_id: UUID
    device_fingerprint: str
    ip_address: str
    user_agent: str
    created_at: datetime
    expires_at: datetime
    revoked: bool

class Consent:
    id: UUID
    user_id: UUID
    service: str  # "bank_connection", "trumf_integration"
    scope: List[str]
    granted_at: datetime
    expires_at: Optional[datetime]
    revoked_at: Optional[datetime]

class AuditLog:
    id: UUID
    user_id: UUID
    action: str
    resource: str
    ip_address: str
    user_agent: str
    timestamp: datetime
    details: dict
```

### Token Strategy
```python
# Access token: Short-lived JWT (15 min)
# Refresh token: Long-lived, stored securely (30 days)
# SCA: Required for bank operations, valid 5 min

@dataclass
class TokenPair:
    access_token: str  # JWT with user claims
    refresh_token: str  # Opaque, stored in DB
    expires_in: int  # Seconds

class SCAToken:
    """Strong Customer Authentication for PSD2 operations."""
    token: str
    operation: str  # "bank_consent", "transaction_view"
    expires_at: datetime
```

### Encryption
```python
# Data at rest: AES-256-GCM
# Data in transit: TLS 1.3
# Secrets: AWS Secrets Manager / Vault
# PII: Field-level encryption

class EncryptedField:
    """SQLAlchemy type for encrypted fields."""

    def process_bind_param(self, value, dialect):
        return encrypt_aes_gcm(value, get_data_key())

    def process_result_value(self, value, dialect):
        return decrypt_aes_gcm(value, get_data_key())
```

## Norway-Specific Considerations

### BankID
- De facto standard for Norwegian digital identity
- Required for bank integrations (PSD2)
- Two types: Personal BankID, BankID on mobile
- Provider: BankID Norge AS (Vipps/BankID)

### Fødselsnummer (National ID)
- 11-digit personal identification number
- Never store in plaintext
- Hash with salt for user lookup
- Required for identity verification

### PSD2/SCA Requirements
- Strong Customer Authentication for account access
- 90-day consent renewal for AIS
- Multi-factor: Something you know + have/are
- Exemptions: Low-value transactions, recurring ops

### Data Localization
- Consider Norwegian data center for PII
- GDPR compliance required
- User rights: Access, portability, deletion

### Regulatory
- Finanstilsynet oversight for financial services
- AISP registration may be required
- Annual security audits

## Dependencies

- BankID provider contract
- Vipps Login agreement
- [03-bank-integration.md](./03-bank-integration.md) - PSD2 consent flow

## Success Metrics

| Metric | Target |
|--------|--------|
| Login success rate | > 98% |
| Average login time | < 30 seconds |
| Session security incidents | 0 |
| Consent renewal rate | > 90% |

## Implementation Checklist

- [ ] BankID integration setup
- [ ] Vipps Login integration
- [ ] JWT token system
- [ ] Refresh token rotation
- [ ] Session management
- [ ] Device fingerprinting
- [ ] SCA token flow
- [ ] Audit logging
- [ ] Field-level encryption
- [ ] GDPR data export
- [ ] Account deletion flow
- [ ] Consent management UI
- [ ] Security headers
- [ ] Rate limiting
- [ ] Brute force protection
