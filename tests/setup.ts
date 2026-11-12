// Los tests no cargan .env.local: damos secretos de prueba fuertes para que
// lib/auth pueda validar la configuración al importarse.
process.env.JWT_SECRET ??= 'test-jwt-secret-0123456789abcdef0123456789'

import '@testing-library/jest-dom'
