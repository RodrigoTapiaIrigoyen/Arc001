# Análisis de Imágenes de Armas - ARC Raiders Wiki

## 1. UBICACIÓN DE LAS IMÁGENES

### Patrón HTML en la página

Las imágenes están dentro de tablas HTML en la sección de "Weapon Types". Cada arma tiene su imagen en un elemento `<img>` dentro de una celda `<td>`.

Ejemplo HTML:

```html
<span typeof="mw:File">
  <a href="/wiki/Kettle" title="Kettle">
    <img
      src="/w/images/thumb/c/c1/Kettle-Level1.png/180px-Kettle-Level1.png.webp"
      decoding="async"
      loading="lazy"
      width="180"
      height="90"
      class="mw-file-element"
      srcset="
        /w/images/thumb/c/c1/Kettle-Level1.png/270px-Kettle-Level1.png.webp 1.5x,
        /w/images/thumb/c/c1/Kettle-Level1.png/360px-Kettle-Level1.png.webp 2x
      "
      data-file-width="1024"
      data-file-height="512"
    />
  </a>
</span>
```

## 2. PATRÓN URL PARA ACCEDER A IMÁGENES

### Estructura del Sistema MediaWiki

El wiki usa MediaWiki, que almacena imágenes en la carpeta `/w/images/`.

### Tres formas de acceder a las imágenes:

#### A) IMAGEN ORIGINAL COMPLETA (Recomendado para programación)

**Ruta Base:** `/w/images/[CARPETA]/[ARCHIVO]`

Patrón: `https://arcraiders.wiki/w/images/[CARPETA_HASH]/[CARPETA_HASH][NOMBRE_ARCHIVO]`

**Ejemplos:**

- Kettle: `https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png`
- Bobcat: `https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png`
- Torrente: `https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png`

**Detalles del patrón:**

- Las imágenes se organizan en carpetas de 2 caracteres hexadecimales (hash del nombre)
- Primer carácter = primer dígito del hash
- Segundo carácter = primeros dos dígitos del hash
- El nombre del archivo generalmente es: `[NombreArma]-Level1.png` o `[NombreArma].png`

#### B) IMAGEN EN MINIATURA (Thumbnail) - Múltiples Resoluciones

**Ruta Base:** `/w/images/thumb/[CARPETA]/[ARCHIVO]/[ANCHO]px-[ARCHIVO].webp`

Resoluciones disponibles encontradas en el wiki:

- 180px (resolución por defecto mostrada en tablas)
- 270px (1.5x)
- 360px (2x)

**Ejemplos:**

- Kettle 180px: `https://arcraiders.wiki/w/images/thumb/c/c1/Kettle-Level1.png/180px-Kettle-Level1.png.webp`
- Kettle 360px: `https://arcraiders.wiki/w/images/thumb/c/c1/Kettle-Level1.png/360px-Kettle-Level1.png.webp`

**Nota:** Las miniaturas se sirven en formato WebP (formato moderno comprimido)

## 3. LISTA COMPLETA DE ARMAS Y SUS URLs

### Assault Rifles

| Arma     | URL Original                                              |
| -------- | --------------------------------------------------------- |
| Kettle   | https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png   |
| Rattler  | https://arcraiders.wiki/w/images/b/be/Rattler-Level1.png  |
| Arpeggio | https://arcraiders.wiki/w/images/6/6c/Arpeggio-Level1.png |
| Tempest  | https://arcraiders.wiki/w/images/c/c9/Tempest-Level1.png  |
| Bettina  | https://arcraiders.wiki/w/images/a/ac/Bettina.png         |

### Battle Rifles

| Arma     | URL Original                                              |
| -------- | --------------------------------------------------------- |
| Ferro    | https://arcraiders.wiki/w/images/b/b0/Ferro-Level1.png    |
| Renegade | https://arcraiders.wiki/w/images/b/b5/Renegade-Level1.png |
| Aphelion | https://arcraiders.wiki/w/images/8/88/Aphelion.png        |

### Submachine Guns

| Arma     | URL Original                                              |
| -------- | --------------------------------------------------------- |
| Stitcher | https://arcraiders.wiki/w/images/3/3a/Stitcher-Level1.png |
| Bobcat   | https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png   |

### Shotguns

| Arma    | URL Original                                             |
| ------- | -------------------------------------------------------- |
| Il Toro | https://arcraiders.wiki/w/images/5/50/Il_Toro-Level1.png |
| Vulcano | https://arcraiders.wiki/w/images/d/da/Vulcano-Level1.png |

### Pistols

| Arma     | URL Original                                              |
| -------- | --------------------------------------------------------- |
| Hairpin  | https://arcraiders.wiki/w/images/6/65/Hairpin-Level1.png  |
| Burletta | https://arcraiders.wiki/w/images/d/d4/Burletta-Level1.png |
| Venator  | https://arcraiders.wiki/w/images/b/b4/Venator-Level1.png  |

### Hand Cannons

| Arma  | URL Original                                           |
| ----- | ------------------------------------------------------ |
| Anvil | https://arcraiders.wiki/w/images/0/00/Anvil-Level1.png |

### Light Machine Guns

| Arma     | URL Original                                              |
| -------- | --------------------------------------------------------- |
| Torrente | https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png |

### Sniper Rifles

| Arma    | URL Original                                            |
| ------- | ------------------------------------------------------- |
| Osprey  | https://arcraiders.wiki/w/images/a/ae/Osprey-Level1.png |
| Jupiter | https://arcraiders.wiki/w/images/6/68/Jupiter.png       |

### Special

| Arma        | URL Original                                                 |
| ----------- | ------------------------------------------------------------ |
| Hullcracker | https://arcraiders.wiki/w/images/b/ba/Hullcracker-Level1.png |
| Equalizer   | https://arcraiders.wiki/w/images/9/96/Equalizer.png          |

## 4. INFORMACIÓN TÉCNICA DE LAS IMÁGENES

### Dimensiones Originales

- **Resolución 1024x512:** Armas normales (Kettle, Rattler, Arpeggio, Tempest, Ferro, Renegade, Osprey, Stitcher, Bobcat, Il Toro, Vulcano, Hairpin, Burletta, Anvil, Hullcracker)
- **Resolución 512x256:** Algunas armas (Torrente, Venator)
- **Formatos originales:** PNG

### Tamaños de Miniaturas Disponibles

- 180px × 90px (formato en tablas)
- 270px × 135px (1.5x, para pantallas de alta densidad)
- 360px × 180px (2x, para pantallas ultra-alta densidad)

### Formato de Distribución

- **Original:** PNG
- **Miniaturas:** WebP (formato moderno, más pequeño)

## 5. UBICACIÓN DEL SERVIDOR

✅ **Las imágenes están en el servidor propio del wiki**, NO en Wikipedia Commons.

- Dominio: `arcraiders.wiki`
- Ruta base: `/w/images/`
- Tipo de servidor: MediaWiki estándar con Nginx

## 6. CÓMO ACCEDER PROGRAMÁTICAMENTE

### Opción A: Acceder a la imagen original (PNG de alta resolución)

```
https://arcraiders.wiki/w/images/[CARPETA_HASH_1]/[CARPETA_HASH_2][NOMBRE_ARCHIVO]
```

### Opción B: Acceder a miniaturas (WebP optimizadas)

```
https://arcraiders.wiki/w/images/thumb/[CARPETA_HASH_1]/[CARPETA_HASH_2][NOMBRE_ARCHIVO]/[ANCHO]px-[NOMBRE_ARCHIVO].webp
```

### Ejemplo de código JavaScript para extraer URLs

```javascript
// Extraer todos los URLs de imágenes de la página
const imageUrls = Array.from(
  document.querySelectorAll("img.mw-file-element")
).map((img) => {
  // Convertir URL de miniatura a URL original
  const thumbUrl = img.src;
  // Patrón: /w/images/thumb/c/c1/Kettle-Level1.png/180px-Kettle-Level1.png.webp
  // Salida: /w/images/c/c1/Kettle-Level1.png
  const original = thumbUrl
    .replace(/\/thumb\//, "/")
    .replace(/\/\d+px-.*\.webp$/, ".png");
  return `https://arcraiders.wiki${original}`;
});

console.log(imageUrls);
```

### Ejemplo de código Python para descargar imágenes

```python
import requests
import os

weapons = [
    ("Kettle", "c/c1", "Kettle-Level1.png"),
    ("Bobcat", "3/36", "Bobcat-Level1.png"),
    ("Torrente", "1/1e", "Torrente-Level1.png"),
    # ... más armas
]

base_url = "https://arcraiders.wiki/w/images"

for weapon_name, hash_path, filename in weapons:
    url = f"{base_url}/{hash_path}/{filename}"
    response = requests.get(url)

    if response.status_code == 200:
        os.makedirs("weapons", exist_ok=True)
        with open(f"weapons/{weapon_name}.png", "wb") as f:
            f.write(response.content)
        print(f"✓ Descargado: {weapon_name}")
    else:
        print(f"✗ Error descargando {weapon_name}: {response.status_code}")
```

## 7. NOTAS IMPORTANTES

1. **No hay API RESTful:** El wiki no proporciona una API específica para imágenes de armas. Debes extraer las URLs del HTML.

2. **Los nombres pueden variar:** Algunos armas usan `-Level1` en el nombre (ej: Kettle-Level1.png), otros no (ej: Bettina.png).

3. **Caracteres especiales en nombres:** Algunos nombres usan guión bajo (ej: Il_Toro-Level1.png).

4. **Las miniaturas son formato WebP:** Si necesitas PNG sin procesar, accede al original sin la ruta `/thumb/`.

5. **Estructura hash de carpetas:** El primer carácter del hash es la carpeta principal, los dos primeros caracteres forman la subcarpeta.

6. **URLs completas vs relativas:** Las URLs en el HTML son relativas (`/w/images/...`), así que necesitas agregar `https://arcraiders.wiki` al inicio.

## 8. RESUMEN RÁPIDO PARA ACCESO PROGRAMÁTICO

### Para acceder a cualquier arma:

1. Extrae la URL de miniatura del HTML: `/w/images/thumb/c/c1/Kettle-Level1.png/180px-Kettle-Level1.png.webp`
2. Conviértela a URL original:
   - Reemplaza `/thumb/` por `/`
   - Reemplaza `/180px-...webp` por `.png`
   - Resultado: `/w/images/c/c1/Kettle-Level1.png`
3. Agrega el dominio: `https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png`

### Estructura MediaWiki garantizada:

```
/w/images/[1er_char_hash]/[1er_char_hash][2do_char_hash]/[NOMBRE_ARCHIVO_CON_EXTENSION]
```

Donde el hash es un identificador único generado por MediaWiki basado en el nombre del archivo.
