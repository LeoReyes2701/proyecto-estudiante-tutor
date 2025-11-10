## Proyecto Sistema Automatizado Programa Estudiante-Tutor

---

## 📘 UCAB Tutorías Backend

Sistema backend modular para gestionar usuarios, tutorías y horarios en el programa Estudiante-Tutor de la UCAB.

---

### 📦 Estructura del proyecto

```plaintext
src/
├── controllers/         # Lógica HTTP (request/response)
├── middleware/          # Validaciones y autenticación
├── models/              # Estructuras de datos y lógica de negocio
│   └── data/            # Archivos JSON persistentes
├── repositories/        # Acceso a datos (lectura/escritura)
├── routes/              # Definición de rutas HTTP
├── app.js               # Configuración global de la app
└── server.js            # Inicialización del servidor
```

---

### 🚀 Inicio rápido

```bash
npm install
node src/server.js
```

Servidor por defecto en `http://localhost:3000/login`

---

### 🧩 Componentes principales

#### ✅ Controladores (`controllers/`)
- **tutoriaController.js**: maneja lógica de negocio para tutorías (crear, listar, eliminar).

#### 🔐 Middleware (`middleware/`)
- **authMiddleware.js**: protege rutas verificando sesión/token.
- **validation.js**: valida campos requeridos y formatos.

#### 🧠 Modelos (`models/`)
- **User.js**, **Tutoria.js**, **Schedule.js**: definen entidades del sistema.
- **DataStore.js**: abstracción para leer/escribir archivos JSON como base de datos.

#### 📁 Repositorios (`repositories/`)
- **UserRepository.js**: CRUD de usuarios.
- **TutoriaRepository.js**: CRUD de tutorías.
- **ScheduleRepository.js**: gestión de horarios.

#### 🌐 Rutas (`routes/`)
- **authRoutes.js**: `/login`, `/registro`, `/logout`
- **tutoriaRoutes.js**: `/tutorias`, `/tutorias/:id`
- **scheduleRoutes.js**: `/horarios`, `/disponibilidad`

---

### 📂 Datos persistentes (`models/data/`)
- **usuarios.json**: usuarios registrados.
- **tutorias.json**: tutorías activas.
- **schedules.json**: disponibilidad horaria.

---

### 🔄 Flujo típico de registro

1. **POST** `/auth/registro`  
   → Valida campos  
   → Crea usuario en `usuarios.json`  
   → Redirige a perfil o dashboard

2. **GET** `/tutorias`  
   → Lista todas las tutorías  
   → Filtra por tutor si se pasa `?ownerId=...`

3. **POST** `/tutorias`  
   → Crea nueva tutoría  
   → Asocia al usuario activo

---

### 🛡 Seguridad y validación

- Validación de campos en middleware (`validation.js`)
- Protección de rutas con `authMiddleware.js`
- Contraseñas deben tener mínimo 6 caracteres
- Roles permitidos: `estudiante`, `tutor`


