# 📖 Grupos de Salmo

App para repartir a la comunidad en los grupos de cada Salmo de forma que **todos acabéis coincidiendo con todos** y nadie repita con los mismos mientras queden personas con las que aún no ha coincidido.

Funciona en **iPhone, iPad, Android, PC y Mac**, también sin internet una vez abierta.

## Abrirla e instalarla

Dirección: **https://josemateosp.github.io/josemateosp/** (cuando GitHub Pages esté activado, ver abajo).

- **iPhone / iPad**: ábrela en **Safari** → botón **Compartir** → **Añadir a pantalla de inicio**. Ábrela siempre desde ese icono (así iOS no borra los datos).
- **Android**: ábrela en **Chrome** → menú ⋮ → **Instalar aplicación** (o “Añadir a pantalla de inicio”).
- **PC / Mac**: ábrela en Chrome o Edge → icono de instalar en la barra de direcciones (o úsala como página normal).

La primera vez la lista está vacía: carga tu copia de seguridad o añade los participantes.

## Cómo usarla

1. En **Nueva ronda**: elige el número de grupos y la fecha, desmarca a quien no venga ese mes y pulsa **Generar grupos**.
2. Si quieres, mueve a alguien de grupo con su desplegable. Pulsa **Generar otra vez** para ver otra propuesta.
3. Pulsa **Guardar esta ronda**. Solo las rondas guardadas cuentan en el historial.
4. **📄 Generar PDF** (tras guardar, o desde el Historial): pide el título del tema, la celebración y el encabezado de cada grupo, y muestra la hoja lista para guardar como PDF o imprimir.
5. **Copiar para WhatsApp** te deja el reparto listo para pegarlo en el chat.

## Agregar o quitar participantes

Pulsa **👥 Agregar/Quitar participantes** en Nueva ronda. Quien ya ha participado en algún Salmo pasa a “Dados de baja” y conserva su historial (puedes volver a agregarlo); si nunca participó, se borra sin más.

## Dónde se guardan los datos

En cada aparato por separado; no se sincronizan ni se suben a internet (la página es pública, pero los nombres y el historial solo están en tu aparato). Descarga una copia en **Copia de seguridad** después de cada Salmo: sirve para recuperar el historial o pasarlo a otro aparato (con **Cargar copia**).

## Cómo decide los grupos

- Los matrimonios (nombres con “y” o “e”) van siempre juntos.
- Juntar a dos que nunca han coincidido no cuesta nada; si ya coincidieron una vez cuesta 1, dos veces cuesta 30, tres veces 900… Así, antes de repetir por segunda vez con alguien, el programa agota a todos los que te faltan.
- Si coincidisteis hace poco, cuesta un poco más que si fue hace tiempo.
- Intenta además que los grupos tengan un número parecido de personas.
- Prueba miles de repartos y se queda con el de menor coste.

## Activar la web (GitHub Pages)

En GitHub: repositorio → **Settings** → **Pages** → en “Build and deployment”, Source: **Deploy from a branch**, elige la rama con la app y la carpeta **/ (root)** → **Save**. En un par de minutos estará en la dirección de arriba.

## Archivos

- `index.html`: la app entera.
- `manifest.webmanifest`, `sw.js`, `icons/`: lo que permite instalarla y usarla sin conexión.
