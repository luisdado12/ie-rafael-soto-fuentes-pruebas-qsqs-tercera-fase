# IE Rafael Soto Fuentes · Pruebas QSQS tercera fase

Aplicativo web estático para que estudiantes de 3.º, 5.º, 7.º y 9.º practiquen las áreas de Lenguaje, Matemáticas y Socioemocionales.

## Publicar en GitHub Pages

1. Crea un repositorio para este proyecto en GitHub y sube todos los archivos de esta carpeta.
2. En **Settings → Pages**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/ (root)`.
3. Abre la URL de Pages que proporciona GitHub.

No necesita servidor ni instalación: usa HTML, CSS y JavaScript. Para probarlo localmente, sirve esta carpeta con cualquier servidor estático; abrir `index.html` con `file://` no permite cargar el JSON en todos los navegadores.

## Preguntas y material fuente

El archivo `data/questions.json` se generó desde la base SQLite suministrada en el espacio de trabajo. Las imágenes citadas por los enunciados están en `assets/images/`.

El material recibido no identifica respuestas correctas: el campo de puntaje de las 1.796 opciones es `0`. Por eso la aplicación guarda respuestas y progreso en el navegador, pero no calcula una nota ni revela claves no verificadas. Las preguntas socioemocionales se presentan como reflexión.

Si se actualiza la base de datos, regenera preguntas y recursos con el PHP incluido:

```powershell
php scripts/export_questions.php "ruta\a\sqlite-superate.db" .
```

Los datos de avance se guardan únicamente en `localStorage` del navegador del estudiante; no se envían a una base central.
