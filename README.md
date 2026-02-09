# 🏠 Room Lights Graph Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub release](https://img.shields.io/github/release/ago19800/room-lights-graph-card.svg)](https://github.com/ago19800/room-lights-graph-card/releases)
[![License](https://img.shields.io/github/license/ago19800/room-lights-graph-card.svg)](LICENSE)

[🇮🇹 Italiano](#italiano) | [🇬🇧 English](#english)

---
## ☕ Supporta il Progetto

**Se questa card ti è utile, offrimi un caffè!**

[![PayPal](https://img.shields.io/badge/PayPal-Dona%20Ora-00457C?logo=paypal&style=for-the-badge)](https://paypal.me/ago19800)

**[paypal.me/ago19800](https://paypal.me/ago19800)**

*Ogni donazione mi aiuta a continuare a sviluppare e migliorare questa card!* 🙏

</div>

<a name="italiano"></a>
## 🇮🇹 Italiano

### Una card interattiva per Home Assistant che visualizza le tue luci organizzate per stanza in un grafico dinamico e animato



### ✨ Funzionalità

#### 🎨 Visualizzazione Intelligente
- **Grafo Interattivo**: Organizza le luci per stanza con nodi collegati
- **Colori RGB Reali**: Le luci RGB mostrano il loro colore effettivo sull'icona
- **Animazione Respirazione**: I nodi "respirano" quando le luci sono accese
  - 🚀 Veloce per luci ad alta luminosità
  - 💫 Normale per luminosità media  
  - 🌙 Lenta per luci dim/soffuse
- **Effetto Glow**: Alone luminoso colorato per luci RGB

#### 🎮 Controlli Completi
- **Drag & Drop**: Trascina nodi e stanze per riorganizzare il layout
- **Zoom & Pan**: Zoom con rotellina mouse, trascinamento canvas
- **Popup Trascinabile**: Controlli sempre visibili e posizionabili
- **Dimmer**: Slider luminosità con feedback visivo immediato
- **RGB Picker**: Selettore colore con anteprima in tempo reale

#### 💫 Effetti WOW
- **Pulse Feedback**: Animazione rapida quando cambi luminosità o colore
- **Stanze Intelligenti**: Le stanze respirano se hanno luci accese
- **Reset Animato**: Pulsante reset con animazione rotazione
- **Performance Ottimizzate**: 60 FPS costanti, animazioni GPU-accelerate

#### 📱 Mobile-Friendly
- Touch ottimizzato per smartphone e tablet
- Popup responsive e sempre visibile
- Gesture intuitive (pinch-to-zoom, swipe)

---

### 📦 Installazione

#### Metodo 1: HACS (Consigliato)

1. Apri **HACS** in Home Assistant
2. Clicca sui **3 puntini** in alto a destra
3. Seleziona **Repository personalizzati**
4. Aggiungi questo URL: `https://github.com/ago19800/room-lights-graph-card`
5. Categoria: **Lovelace**
6. Clicca **Aggiungi**
7. Trova "Room Lights Graph Card" e clicca **Installa**
8. Riavvia Home Assistant

#### Metodo 2: Manuale

1. Scarica `room-lights-graph-card.js`
2. Copia il file in `config/www/community/room-lights-graph-card/room-lights-graph-card.js`
3. Aggiungi la risorsa in Home Assistant:
   - Vai in **Impostazioni** → **Dashboard** → **Risorse**
   - Clicca **+ Aggiungi risorsa**
   - URL: `/local/room-lights-graph-card/room-lights-graph-card.js`
   - Tipo: **Modulo JavaScript**
4. Ricarica il browser (`CTRL + F5`)

---

### ⚙️ Configurazione

#### Configurazione Base

```yaml
type: custom:room-lights-graph-card
title: Le Mie Luci
rooms:
  - name: Camera da Letto
    lights:
      - light.camera_letto
    switches:
      - switch.luce_notturna
      
  - name: Soggiorno
    lights:
      - light.soggiorno_principale
      - light.lampada_angolo
    
  - name: Cucina
    lights:
      - light.cucina_centrale
    switches:
      - switch.cucina_pensili
```

#### Configurazione Completa

```yaml
type: custom:room-lights-graph-card
title: Controllo Luci Casa
rooms:
  - name: Camera
    lights:
      - light.camera_letto          # Luce dimmerabile
      - light.camera_comodino        # Luce RGB
    switches:
      - switch.camera_notturna       # Interruttore on/off
  
  - name: Soggiorno
    lights:
      - light.soggiorno_lampadario
      - light.soggiorno_led_tv
    switches:
      - switch.soggiorno_piantana
  
  - name: Cucina
    lights:
      - light.cucina_soffitto
      - light.cucina_isola
    switches:
      - switch.cucina_sottopensile
```

#### Opzioni Configurazione

| Opzione | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `type` | string | **obbligatorio** | `custom:room-lights-graph-card` |
| `title` | string | `"Controllo Luci per Stanza"` | Titolo della card |
| `rooms` | list | **obbligatorio** | Lista delle stanze |
| `rooms.name` | string | **obbligatorio** | Nome della stanza |
| `rooms.lights` | list | opzionale | Lista di entità `light.*` |
| `rooms.switches` | list | opzionale | Lista di entità `switch.*` |

---

### 🎮 Utilizzo

#### Controlli Base
- **Click su dispositivo**: Apre popup controlli
- **Trascina nodo**: Riposiziona dispositivo o stanza
- **Trascina sfondo**: Muove l'intera vista (pan)
- **Rotellina mouse**: Zoom in/out
- **Pulsante Reset**: Riporta alla vista iniziale

#### Popup Controlli
- **Trascina header blu**: Sposta il popup dove vuoi
- **Accendi/Spegni**: Toggle immediato
- **Slider luminosità**: Regola intensità (luci dimmerabili)
- **Color picker**: Cambia colore RGB (luci RGB)

#### Indicatori Visivi
- 🟡 **Cerchio giallo pulsante**: Luce normale accesa
- 🔴🔵🟢 **Cerchio colorato pulsante**: Luce RGB accesa (colore reale)
- ⚫ **Cerchio grigio fermo**: Luce spenta
- 💫 **Respirazione veloce**: Alta luminosità
- 🌙 **Respirazione lenta**: Bassa luminosità

---

### 🎨 Funzionalità Avanzate

#### Animazione Respirazione Intelligente
I nodi pulsano in base allo stato:
- **Velocità**: Dipende dalla luminosità (veloce=luminoso, lenta=dim)
- **Glow**: Le luci RGB hanno alone colorato pulsante
- **Stanze**: Respirano se hanno luci accese

#### Colori RGB Reali
Le luci RGB mostrano il colore esatto sull'icona:
- Cambio colore in tempo reale
- Glow colorato dinamico
- Bordo scurito automatico

#### Feedback Immediato
Ogni azione ha risposta visiva:
- **Pulse** quando cambi luminosità
- **Pulse** quando cambi colore
- Aggiornamento istantaneo del nodo

---

### 🛠️ Compatibilità

#### Home Assistant
- Versione minima: **2023.1.0**
- Testato fino a: **2026.2.0**

#### Luci Supportate
- ✅ Luci on/off semplici
- ✅ Luci dimmerabili (brightness)
- ✅ Luci RGB/RGBW
- ✅ Luci HSV/XY
- ✅ Interruttori switch

#### Browser
- ✅ Chrome/Edge (consigliato)
- ✅ Firefox
- ✅ Safari
- ✅ App Home Assistant (iOS/Android)

---

### 🐛 Risoluzione Problemi

#### La card non appare
1. Verifica che il file sia in `config/www/community/room-lights-graph-card/room-lights-graph-card.js`
2. Controlla di aver aggiunto la risorsa in Dashboard → Risorse
3. Ricarica il browser con `CTRL + F5`

#### I nodi non si muovono
- Clicca e **tieni premuto** sul nodo
- Trascina mentre tieni premuto
- Rilascia per posizionare

#### Il dimmer non funziona
- Verifica che la luce supporti `brightness`
- Controlla in Strumenti Sviluppatori → Stati → `light.xxx`
- Deve avere `brightness` negli attributi

#### Il colore RGB non si aggiorna
- La luce deve avere `rgb_color` negli attributi
- Prova a riavviare l'integrazione della luce
- Controlla i log di Home Assistant

---

### 📄 Licenza

MIT License - Vedi [LICENSE](LICENSE)

---

### 🙏 Crediti

Creato con ❤️ per la community Home Assistant

Se ti piace questo progetto:
- ⭐ Metti una stella su GitHub
- 🐛 Segnala bug o richiedi funzionalità nelle [Issues](https://github.com/ago19800/room-lights-graph-card/issues)
- 💬 Condividi con la community!

---

<a name="english"></a>
## 🇬🇧 English

### An interactive card for Home Assistant that displays your lights organized by room in a dynamic, animated graph



### ✨ Features

#### 🎨 Smart Visualization
- **Interactive Graph**: Organize lights by room with connected nodes
- **Real RGB Colors**: RGB lights display their actual color on the icon
- **Breathing Animation**: Nodes "breathe" when lights are on
  - 🚀 Fast for high brightness
  - 💫 Normal for medium brightness
  - 🌙 Slow for dim lights
- **Glow Effect**: Colored halo for RGB lights

#### 🎮 Complete Controls
- **Drag & Drop**: Drag nodes and rooms to reorganize layout
- **Zoom & Pan**: Zoom with mouse wheel, drag canvas
- **Draggable Popup**: Always visible and positionable controls
- **Dimmer**: Brightness slider with immediate visual feedback
- **RGB Picker**: Color picker with real-time preview

#### 💫 WOW Effects
- **Pulse Feedback**: Quick animation when changing brightness or color
- **Smart Rooms**: Rooms breathe when they have lights on
- **Animated Reset**: Reset button with rotation animation
- **Optimized Performance**: Constant 60 FPS, GPU-accelerated animations

#### 📱 Mobile-Friendly
- Touch optimized for smartphones and tablets
- Responsive popup, always visible
- Intuitive gestures (pinch-to-zoom, swipe)

---

### 📦 Installation

#### Method 1: HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Click the **3 dots** in the top right
3. Select **Custom repositories**
4. Add this URL: `https://github.com/ago19800/room-lights-graph-card`
5. Category: **Lovelace**
6. Click **Add**
7. Find "Room Lights Graph Card" and click **Install**
8. Restart Home Assistant

#### Method 2: Manual

1. Download `room-lights-graph-card.js`
2. Copy the file to `config/www/community/room-lights-graph-card/room-lights-graph-card.js`
3. Add the resource in Home Assistant:
   - Go to **Settings** → **Dashboards** → **Resources**
   - Click **+ Add Resource**
   - URL: `/local/room-lights-graph-card/room-lights-graph-card.js`
   - Type: **JavaScript Module**
4. Reload browser (`CTRL + F5`)

---

### ⚙️ Configuration

#### Basic Configuration

```yaml
type: custom:room-lights-graph-card
title: My Lights
rooms:
  - name: Bedroom
    lights:
      - light.bedroom_main
    switches:
      - switch.night_light
      
  - name: Living Room
    lights:
      - light.living_room_main
      - light.corner_lamp
    
  - name: Kitchen
    lights:
      - light.kitchen_ceiling
    switches:
      - switch.under_cabinet
```

#### Full Configuration

```yaml
type: custom:room-lights-graph-card
title: House Lights Control
rooms:
  - name: Bedroom
    lights:
      - light.bedroom_main           # Dimmable light
      - light.bedside_lamp           # RGB light
    switches:
      - switch.night_light           # On/off switch
  
  - name: Living Room
    lights:
      - light.living_room_chandelier
      - light.tv_led_strip
    switches:
      - switch.floor_lamp
  
  - name: Kitchen
    lights:
      - light.kitchen_ceiling
      - light.kitchen_island
    switches:
      - switch.under_cabinet
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | **required** | `custom:room-lights-graph-card` |
| `title` | string | `"Room Lights Control"` | Card title |
| `rooms` | list | **required** | List of rooms |
| `rooms.name` | string | **required** | Room name |
| `rooms.lights` | list | optional | List of `light.*` entities |
| `rooms.switches` | list | optional | List of `switch.*` entities |

---

### 🎮 Usage

#### Basic Controls
- **Click on device**: Opens control popup
- **Drag node**: Repositions device or room
- **Drag background**: Moves entire view (pan)
- **Mouse wheel**: Zoom in/out
- **Reset button**: Returns to initial view

#### Control Popup
- **Drag blue header**: Move popup wherever you want
- **On/Off**: Immediate toggle
- **Brightness slider**: Adjust intensity (dimmable lights)
- **Color picker**: Change RGB color (RGB lights)

#### Visual Indicators
- 🟡 **Yellow pulsing circle**: Normal light on
- 🔴🔵🟢 **Colored pulsing circle**: RGB light on (real color)
- ⚫ **Gray still circle**: Light off
- 💫 **Fast breathing**: High brightness
- 🌙 **Slow breathing**: Low brightness

---

### 🎨 Advanced Features

#### Smart Breathing Animation
Nodes pulse based on state:
- **Speed**: Depends on brightness (fast=bright, slow=dim)
- **Glow**: RGB lights have colored pulsing halo
- **Rooms**: Breathe when they have lights on

#### Real RGB Colors
RGB lights show exact color on icon:
- Real-time color change
- Dynamic colored glow
- Automatically darkened border

#### Immediate Feedback
Every action has visual response:
- **Pulse** when changing brightness
- **Pulse** when changing color
- Instant node update

---

### 🛠️ Compatibility

#### Home Assistant
- Minimum version: **2023.1.0**
- Tested up to: **2026.2.0**

#### Supported Lights
- ✅ Simple on/off lights
- ✅ Dimmable lights (brightness)
- ✅ RGB/RGBW lights
- ✅ HSV/XY lights
- ✅ Switch switches

#### Browsers
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Home Assistant App (iOS/Android)

---

### 🐛 Troubleshooting

#### Card doesn't appear
1. Verify file is in `config/www/community/room-lights-graph-card/room-lights-graph-card.js`
2. Check you added the resource in Dashboards → Resources
3. Reload browser with `CTRL + F5`

#### Nodes don't move
- Click and **hold** on the node
- Drag while holding
- Release to position

#### Dimmer doesn't work
- Verify light supports `brightness`
- Check in Developer Tools → States → `light.xxx`
- Must have `brightness` in attributes

#### RGB color doesn't update
- Light must have `rgb_color` in attributes
- Try restarting the light integration
- Check Home Assistant logs

---

### 📄 License

MIT License - See [LICENSE](LICENSE)

---

### 🙏 Credits

Created with ❤️ for the Home Assistant community

If you like this project:
- ⭐ Star it on GitHub
- 🐛 Report bugs or request features in [Issues](https://github.com/ago19800/room-lights-graph-card/issues)
- 💬 Share with the community!

---

### 📸 Screenshots

*Add your screenshots here*

---

### 🗺️ Roadmap

- [ ] Save layout positions persistently
- [ ] Scene presets
- [ ] Party mode with rainbow effect
- [ ] Customizable animation speeds
- [ ] Theme support
- [ ] Multi-language UI

---



---

### 💝 Support

If you find this project useful, consider:
- ⭐ Starring the repository
## ☕ Supporta il Progetto

**Se questo addon ti è utile, offrimi un caffè!**

[![PayPal](https://img.shields.io/badge/PayPal-Dona%20Ora-00457C?logo=paypal&style=for-the-badge)](https://paypal.me/ago19800)

**[paypal.me/ago19800](https://paypal.me/ago19800)**

*Ogni donazione mi aiuta a continuare a sviluppare e migliorare questo card!* 🙏

</div>

---

**Version:** v1.0.0 
**Last Updated:** February 2026
