# IE Rafael Soto Fuentes · Pruebas QSQS tercera fase

Aplicativo web estático para que estudiantes de 3.º, 5.º, 7.º y 9.º practiquen las áreas de Lenguaje, Matemáticas y Socioemocionales.

## Publicar en GitHub Pages

1. Crea un repositorio para este proyecto en GitHub y sube todos los archivos de esta carpeta.
2. En **Settings → Pages**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/ (root)`.
3. Abre la URL de Pages que proporciona GitHub.

No necesita servidor ni instalación: usa HTML, CSS y JavaScript. Para probarlo localmente, sirve esta carpeta con cualquier servidor estático; abrir `index.html` con `file://` no permite cargar el JSON en todos los navegadores.

## Preguntas y material fuente

El archivo `data/questions.json` se generó desde la base SQLite suministrada en el espacio de trabajo. Las imágenes citadas por los enunciados están en `assets/images/`.

El material recibido no identifica respuestas correctas: el campo de puntaje de las 1.796 opciones es `0`. Se añadió `data/answer-key.json` con una clave de práctica elaborada al resolver los enunciados y revisar los textos e imágenes de los cuadernillos. Cada respuesta correcta de Lenguaje y Matemáticas suma un punto y muestra una explicación; la clave es independiente y no oficial. En Matemáticas de 5.º, pregunta 15, y de 7.º, preguntas 2 y 5, se aceptan las alternativas válidas debido a ambigüedad. En Lenguaje de 3.º hay una pregunta que no se califica porque falta el afiche al que se refiere. Socioemocionales se guarda para reflexionar y no suma puntos, porque son respuestas personales sin una única opción correcta.

Si se actualiza la base de datos, regenera preguntas y recursos con el PHP incluido:

```powershell
php scripts/export_questions.php "ruta\a\sqlite-superate.db" .
```

Los datos de avance y puntaje se guardan únicamente en `localStorage` del navegador del estudiante; no se envían a una base central.
