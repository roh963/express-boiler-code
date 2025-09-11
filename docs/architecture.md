# Architecture & Request Lifecycle

```
Request
  ↓
Router
  ↓
Controller
  ↓
Service
  ↓
DB (not implemented in this boilerplate)
  ↓
Response
```

- **Router**: Maps endpoints to controllers
- **Controller**: Handles HTTP logic, calls services
- **Service**: Business logic, data access
- **DB**: (Add your DB integration here)
