# Guía de Flujo de Trabajo en Git

## 1. Preparación del Proyecto (Solo la primera vez)

Para comenzar a trabajar en el proyecto, sigue estos pasos para configurar tu entorno local:

```bash
Clonar el repositorio:
git clone <url-del-repositorio>

Entrar a la carpeta:
cd <nombre-del-proyecto>

Cambiar a la rama de integración:
git switch dev

Instalar dependencias:
pnpm install
```
## 2. Estructura de Ramas

* **`main`**: Solo contiene código estable en producción. **No se permiten commits directos**.
* **`dev`**: Rama de integración. Aquí se unen todas las funcionalidades nuevas antes de pasar a producción.
* **`feature/nombre-de-la-tarea`**: Ramas temporales para desarrollar nuevas funciones.

## 3. Ciclo de Trabajo para Desarrolladores

### Paso 1: Sincronizar el entorno local
Antes de empezar cualquier tarea, asegúrate de tener lo último de la rama de integración:

```bash
git checkout dev
git pull origin dev
```

### Paso 2: Crear una rama de funcionalidad

Crea tu rama con un nombre descriptivo usando el prefijo feature/

```bash
git checkout -b feature/nombre-de-la-funcionalidad
```

### Paso 3: Desarrollo y commits

Trabaja en tu código y realiza commits frecuentes con mensajes claros:

```bash
git add .
git commit -m "Descripción breve de los cambios"
```

### Paso 4: Mantener la rama actualizada

Si otros compañeros han subido cambios a dev mientras trabajabas, integra esos cambios en tu rama para evitar conflictos futuros:

```bash
git fetch origin
git merge origin/dev
```

### Paso 5: Subir la funcionalidad y Merge a dev

Una vez que la funcionalidad esté terminada y probada localmente:

Subí tu rama al servidor:

```Bash
git push origin feature/nombre-de-la-funcionalidad
```
Realiza un Pull Request (PR) hacia la rama dev.

Tras la aprobación y el merge, podes borrar tu rama local.

`git branch -d <nombre-de-la-rama>`
