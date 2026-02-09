class RoomLightsGraphCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._translateX = 0;
    this._translateY = 0;
    this._nodePositions = new Map();
    this._isDragging = false;
  }

  setConfig(config) {
    this._config = config;
    this._initializeNodePositions();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.innerHTML) {
      this.render();
    }
    this.updateDeviceStates();
  }

  _initializeNodePositions() {
    const rooms = this._config.rooms || [];
    const centerX = 300, centerY = 280, radius = 180;
    rooms.forEach((room, index) => {
      const angle = (index * (2 * Math.PI) / rooms.length) - Math.PI / 2;
      const rX = centerX + radius * Math.cos(angle);
      const rY = centerY + radius * Math.sin(angle);
      const rKey = `room_${index}`;
      this._nodePositions.set(rKey, { x: rX, y: rY });

      const devs = [...(room.lights || []), ...(room.switches || [])];
      devs.forEach((id, dIdx) => {
        const dAngle = angle - 0.5 + (dIdx * 0.4);
        const dX = rX + 90 * Math.cos(dAngle);
        const dY = rY + 90 * Math.sin(dAngle);
        this._nodePositions.set(`device_${id}`, { x: dX, y: dY });
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <ha-card style="overflow: hidden; background: var(--card-background-color); border-radius: 16px;">
        <style>
          .container { width: 100%; height: 600px; position: relative; overflow: hidden; touch-action: none; background: var(--card-background-color); }
          svg { width: 100%; height: 100%; cursor: grab; }
          .node { cursor: pointer; }
          
          /* Animazione Respirazione per Nodi Accesi */
          @keyframes breathe {
            0%, 100% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.08);
              opacity: 0.85;
            }
          }
          
          @keyframes breathe-glow {
            0%, 100% { 
              filter: drop-shadow(0 0 8px currentColor);
            }
            50% { 
              filter: drop-shadow(0 0 20px currentColor);
            }
          }
          
          /* Animazione veloce per luci luminose */
          @keyframes breathe-fast {
            0%, 100% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.12);
              opacity: 0.8;
            }
          }
          
          /* Animazione lenta per luci dim */
          @keyframes breathe-slow {
            0%, 100% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.05);
              opacity: 0.9;
            }
          }
          
          /* Pulse rapido per feedback immediato */
          @keyframes quick-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          
          .device-circle.pulse-feedback {
            animation: quick-pulse 0.3s ease-out;
          }
          
          .device-circle.breathing {
            animation: breathe 2.5s ease-in-out infinite;
          }
          
          .device-circle.breathing-fast {
            animation: breathe-fast 1.5s ease-in-out infinite;
          }
          
          .device-circle.breathing-slow {
            animation: breathe-slow 4s ease-in-out infinite;
          }
          
          .device-circle.breathing-glow {
            animation: breathe-glow 2.5s ease-in-out infinite;
          }
          .line { stroke: var(--primary-color); stroke-width: 2.5; opacity: 0.3; pointer-events: none; }
          .light-on { fill: #FDD835 !important; filter: drop-shadow(0 0 12px #FDD835); }
          .light-off { fill: #424242 !important; stroke: #616161; }
          .label { font-size: 13px; fill: var(--primary-text-color); font-weight: 600; pointer-events: none; }
          .ctrl-row .label { fill: none; color: var(--primary-text-color); display: block; margin-bottom: 8px; font-size: 14px; }
          .room-circle { fill: #03A9F4; stroke: #0288D1; stroke-width: 3; }
          
          .room-circle.room-breathing {
            animation: breathe-slow 3s ease-in-out infinite;
          }
          
          .room-circle.room-active {
            filter: drop-shadow(0 0 15px rgba(3, 169, 244, 0.8));
          }
          .reset-btn { 
            position: absolute; 
            top: 15px; 
            right: 15px; 
            background: linear-gradient(135deg, #0288D1 0%, #03A9F4 100%); 
            color: white; 
            border: none; 
            padding: 10px 18px; 
            border-radius: 8px; 
            cursor: pointer; 
            z-index: 10; 
            font-weight: bold; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          }
          
          .reset-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 12px rgba(0,0,0,0.4);
          }
          
          .reset-btn:active {
            transform: scale(0.95);
          }
          
          @keyframes reset-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
          }
          
          .reset-btn.resetting {
            animation: reset-pulse 0.6s ease-out;
          }
          
          /* Popup Controllo */
          .popup { 
            position: absolute; 
            background: var(--paper-card-background-color, #fff); 
            border-radius: 12px; 
            padding: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
            z-index: 1000; 
            min-width: 200px; 
            max-width: 280px;
            color: var(--primary-text-color); 
            border: 1px solid var(--divider-color);
          }
          .popup-header { 
            font-weight: bold; 
            margin-bottom: 15px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid var(--primary-color); 
            padding: 12px 8px 10px 8px;
            font-size: 15px;
            cursor: move;
            user-select: none;
            background: linear-gradient(135deg, var(--primary-color) 0%, rgba(3, 169, 244, 0.8) 100%);
            color: white;
            margin: -20px -20px 15px -20px;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .popup-header:active {
            cursor: grabbing;
          }
          .popup-header span:first-child {
            flex: 1;
            word-break: break-word;
            padding-right: 8px;
          }
          .popup-header span:last-child {
            font-size: 22px;
            padding: 2px 8px;
            margin-left: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            transition: all 0.2s;
          }
          .popup-header span:last-child:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.1);
          }
          .ctrl-row { margin: 15px 0; }
          .btn-toggle { 
            width: 100%; 
            padding: 14px; 
            border-radius: 8px; 
            border: none; 
            background: var(--primary-color); 
            color: white; 
            cursor: pointer; 
            font-weight: bold; 
            font-size: 15px;
            touch-action: manipulation;
          }
          input[type=range] { 
            width: 100%; 
            height: 12px; 
            cursor: pointer; 
            accent-color: var(--primary-color);
            touch-action: manipulation;
          }
          input[type=color] { 
            width: 100%; 
            height: 45px; 
            border: 2px solid var(--divider-color); 
            border-radius: 8px; 
            cursor: pointer;
            touch-action: manipulation;
          }
        </style>
        
        <button class="reset-btn" id="reset">RESET</button>
        <div class="container" id="container">
          <svg id="svg" viewBox="0 0 600 600">
            <g id="main-g">
              <g id="lines-layer"></g>
              <g id="nodes-layer"></g>
              <circle cx="300" cy="280" r="55" fill="var(--primary-color)" opacity="0.9" />
              <text x="300" y="285" text-anchor="middle" class="label" style="fill:white; font-size: 16px;">CASA</text>
            </g>
          </svg>
        </div>
      </ha-card>
    `;

    this._setupEvents();
    this.renderGraph();
  }

  _getSVGCoords(e) {
    const svg = this.shadowRoot.getElementById('svg');
    const pt = svg.createSVGPoint();
    const client = e.touches ? e.touches[0] : e;
    pt.x = client.clientX;
    pt.y = client.clientY;
    return pt.matrixTransform(this.shadowRoot.getElementById('main-g').getScreenCTM().inverse());
  }

  _setupEvents() {
    const svg = this.shadowRoot.getElementById('svg');
    const resetBtn = this.shadowRoot.getElementById('reset');
    
    resetBtn.onclick = () => {
      // Aggiungi animazione al pulsante
      resetBtn.classList.add('resetting');
      setTimeout(() => resetBtn.classList.remove('resetting'), 600);
      
      this._translateX = 0; 
      this._translateY = 0;
      this._initializeNodePositions();
      this.renderGraph();
      this._apply();
    };

    const start = (e) => {
      const coords = this._getSVGCoords(e);
      const node = e.composedPath().find(el => el.classList && el.classList.contains('node'));
      if (node) {
        this._isDragging = true;
        this._dragKey = node.getAttribute('data-key');
        this._dragStartTime = Date.now();
        const pos = this._nodePositions.get(this._dragKey);
        this._offset = { x: coords.x - pos.x, y: coords.y - pos.y };
        this._hasMoved = false;
      } else {
        this._isPanning = true;
        const c = e.touches ? e.touches[0] : e;
        this._startPan = { x: c.clientX - this._translateX, y: c.clientY - this._translateY };
      }
    };

    const move = (e) => {
      if (!this._isPanning && !this._isDragging) return;
      if (e.cancelable) e.preventDefault();

      if (this._isPanning) {
        const c = e.touches ? e.touches[0] : e;
        this._translateX = c.clientX - this._startPan.x;
        this._translateY = c.clientY - this._startPan.y;
        this._apply();
      } else {
        this._hasMoved = true;
        const coords = this._getSVGCoords(e);
        const newPos = { x: coords.x - this._offset.x, y: coords.y - this._offset.y };
        this._nodePositions.set(this._dragKey, newPos);
        
        const g = this.shadowRoot.querySelector(`g[data-key="${this._dragKey}"]`);
        if (g) {
          g.querySelector('circle').setAttribute('cx', newPos.x);
          g.querySelector('circle').setAttribute('cy', newPos.y);
          g.querySelectorAll('text').forEach((t, i) => { 
            t.setAttribute('x', newPos.x); 
            t.setAttribute('y', newPos.y + (i === 0 ? 8 : 50)); 
          });
          this.updateLines();
        }
      }
    };

    const end = () => {
      if (this._isDragging && this._dragKey.startsWith('device_')) {
        if (Date.now() - this._dragStartTime < 250 && !this._hasMoved) {
          this._showPopup(this._dragKey.replace('device_', ''), this._nodePositions.get(this._dragKey));
        }
      }
      this._isPanning = false; this._isDragging = false;
    };

    svg.addEventListener('mousedown', start);
    svg.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  }

  _showPopup(entityId, pos) {
    const existing = this.shadowRoot.querySelector('.popup');
    if (existing) existing.remove();

    const entity = this._hass.states[entityId];
    if (!entity) return;

    const popup = document.createElement('div');
    popup.className = 'popup';
    const rect = this.shadowRoot.getElementById('container').getBoundingClientRect();
    
    // Posiziona al centro dello schermo per default
    const popupWidth = 280;
    const popupHeight = 300;
    
    let popupLeft = (rect.width - popupWidth) / 2;
    let popupTop = (rect.height - popupHeight) / 2;
    
    // Assicura margini minimi
    popupLeft = Math.max(10, Math.min(popupLeft, rect.width - popupWidth - 10));
    popupTop = Math.max(10, Math.min(popupTop, rect.height - popupHeight - 10));
    
    popup.style.left = `${popupLeft}px`;
    popup.style.top = `${popupTop}px`;
    popup.style.position = 'absolute';

    const brightness = entity.attributes.brightness ? Math.round((entity.attributes.brightness / 255) * 100) : 0;
    
    // Calcola colore RGB corrente
    let currentRgbHex = '#ffffff';
    if (entity.attributes.rgb_color) {
      const [r, g, b] = entity.attributes.rgb_color;
      currentRgbHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Controlla se supporta brightness
    const supportsBrightness = entity.attributes.brightness !== undefined || 
                               entity.attributes.supported_color_modes?.some(m => 
                                 m.includes('brightness') || m.includes('hs') || m.includes('rgb') || m.includes('xy')
                               );

    popup.innerHTML = `
      <div class="popup-header" id="popup-header" style="cursor: move;">
        <span>📱 ${entity.attributes.friendly_name || entityId}</span>
        <span style="cursor:pointer" id="close-pop">✕</span>
      </div>
      <button class="btn-toggle" id="p-tgl">${entity.state === 'on' ? 'SPEGNI' : 'ACCENDI'}</button>
      ${supportsBrightness ? `
        <div class="ctrl-row">
          <label class="label">Luminosità: <span id="val-b">${brightness}</span>%</label>
          <input type="range" id="p-br" min="1" max="100" value="${brightness}">
        </div>` : ''}
      ${entity.attributes.rgb_color || entity.attributes.supported_color_modes?.some(m => m.includes('rgb') || m.includes('hs')) ? `
        <div class="ctrl-row">
          <label class="label">Colore RGB</label>
          <input type="color" id="p-rgb" value="${currentRgbHex}">
        </div>` : ''}
    `;

    this.shadowRoot.getElementById('container').appendChild(popup);
    
    // RENDI IL POPUP TRASCINABILE
    this._makePopupDraggable(popup);

    // Eventi Corretti
    popup.querySelector('#close-pop').onclick = () => popup.remove();
    popup.querySelector('#p-tgl').onclick = () => {
      this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      
      // Aggiorna immediatamente il visual del nodo
      setTimeout(() => {
        this.updateDeviceStates();
      }, 100);
      
      popup.remove();
    };

    const brSlider = popup.querySelector('#p-br');
    if (brSlider) {
      brSlider.oninput = (e) => {
        const val = e.target.value;
        this.shadowRoot.getElementById('val-b').innerText = val;
        
        // Aggiorna visivamente l'opacità del nodo per feedback immediato
        const circle = this.shadowRoot.querySelector(`g[data-key="device_${entityId}"] .device-circle`);
        if (circle) {
          const opacity = Math.max(0.3, val / 100); // minimo 30% opacità
          circle.style.opacity = opacity;
          
          // Pulse rapido per feedback
          circle.classList.remove('pulse-feedback');
          void circle.offsetWidth; // Trigger reflow
          circle.classList.add('pulse-feedback');
        }
      };
      
      brSlider.onchange = (e) => {
        this._hass.callService('light', 'turn_on', { entity_id: entityId, brightness_pct: parseInt(e.target.value) });
        
        // Aggiorna lo stato dopo un attimo
        setTimeout(() => {
          this.updateDeviceStates();
        }, 200);
      };
    }

    const rgbPicker = popup.querySelector('#p-rgb');
    if (rgbPicker) {
      rgbPicker.oninput = (e) => {
        // Aggiorna immediatamente il colore del nodo per feedback visivo
        const hex = e.target.value;
        const circle = this.shadowRoot.querySelector(`g[data-key="device_${entityId}"] .device-circle`);
        if (circle) {
          circle.setAttribute('fill', hex);
          circle.setAttribute('stroke', this._darkenColor(hex, 20));
          circle.style.filter = `drop-shadow(0 0 15px ${hex})`;
          circle.style.color = hex;
          
          // Pulse rapido per feedback
          circle.classList.remove('pulse-feedback');
          void circle.offsetWidth; // Trigger reflow
          circle.classList.add('pulse-feedback');
        }
      };
      
      rgbPicker.onchange = (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
        this._hass.callService('light', 'turn_on', { entity_id: entityId, rgb_color: [r, g, b] });
      };
    }
  }

  _apply() {
    this.shadowRoot.getElementById('main-g').setAttribute('transform', `translate(${this._translateX}, ${this._translateY})`);
  }

  renderGraph() {
    const nG = this.shadowRoot.getElementById('nodes-layer'), lG = this.shadowRoot.getElementById('lines-layer');
    nG.innerHTML = ''; lG.innerHTML = '';
    this._config.rooms.forEach((room, i) => {
      const rKey = `room_${i}`, rPos = this._nodePositions.get(rKey);
      this._drawL(lG, 300, 280, rPos.x, rPos.y, rKey, 'center');
      nG.appendChild(this._drawN(rPos.x, rPos.y, room.name, rKey, true));
      const devs = [...(room.lights || []), ...(room.switches || [])];
      devs.forEach(id => {
        const dKey = `device_${id}`, dPos = this._nodePositions.get(dKey);
        this._drawL(lG, rPos.x, rPos.y, dPos.x, dPos.y, dKey, rKey);
        nG.appendChild(this._drawN(dPos.x, dPos.y, id, dKey, false));
      });
    });
  }

  _drawL(g, x1, y1, x2, y2, to, from) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.classList.add('line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('data-from', from); l.setAttribute('data-to', to);
    g.appendChild(l);
  }

  _drawN(x, y, label, key, isRoom) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('node'); g.setAttribute('data-key', key);
    if (isRoom) {
      g.innerHTML = `<circle class="room-circle" cx="${x}" cy="${y}" r="45"/><text x="${x}" y="${y+6}" text-anchor="middle" class="label" style="fill:white; font-size:14px">${label}</text>`;
    } else {
      const entity = this._hass.states[label];
      const icon = label.includes('light') ? '💡' : '🔌';
      g.innerHTML = `<circle class="device-circle" cx="${x}" cy="${y}" r="32" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y+10}" text-anchor="middle" style="font-size:28px">${icon}</text><text x="${x}" y="${y+52}" text-anchor="middle" class="label">${entity?.attributes.friendly_name || label.split('.')[1]}</text>`;
    }
    return g;
  }

  updateLines() {
    this.shadowRoot.querySelectorAll('.line').forEach(l => {
      const f = l.getAttribute('data-from'), t = l.getAttribute('data-to');
      const p1 = f === 'center' ? {x:300, y:280} : this._nodePositions.get(f);
      const p2 = this._nodePositions.get(t);
      if (p1 && p2) { l.setAttribute('x1', p1.x); l.setAttribute('y1', p1.y); l.setAttribute('x2', p2.x); l.setAttribute('y2', p2.y); }
    });
  }

  updateDeviceStates() {
    this.shadowRoot.querySelectorAll('.node').forEach(g => {
      const key = g.getAttribute('data-key');
      if (key?.startsWith('device_')) {
        const entityId = key.replace('device_', '');
        const state = this._hass.states[entityId];
        const circle = g.querySelector('.device-circle');
        
        if (state && circle) {
          const isOn = state.state === 'on';
          const isLight = entityId.startsWith('light.');
          
          // Rimuovi tutte le classi di animazione precedenti
          circle.classList.remove('light-on', 'breathing', 'breathing-fast', 'breathing-slow', 'breathing-glow');
          
          if (isOn) {
            // Se la luce è accesa
            if (isLight && state.attributes.rgb_color) {
              // Luce RGB: usa il colore RGB
              const [r, g, b] = state.attributes.rgb_color;
              const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              circle.setAttribute('fill', hexColor);
              circle.setAttribute('stroke', this._darkenColor(hexColor, 20));
              circle.style.color = hexColor; // Per il glow
              
              // Aggiungi animazione respirazione con glow
              circle.classList.add('breathing-glow');
              
            } else {
              // Luce normale: giallo standard
              circle.classList.add('light-on');
              circle.removeAttribute('fill');
              circle.removeAttribute('stroke');
              circle.style.filter = '';
            }
            
            // Determina velocità respirazione in base alla luminosità
            if (state.attributes.brightness !== undefined) {
              const brightness = state.attributes.brightness; // 0-255
              
              if (brightness > 200) {
                // Alta luminosità = respirazione veloce
                circle.classList.add('breathing-fast');
              } else if (brightness > 100) {
                // Media luminosità = respirazione normale
                circle.classList.add('breathing');
              } else {
                // Bassa luminosità = respirazione lenta
                circle.classList.add('breathing-slow');
              }
            } else {
              // Nessuna info brightness = respirazione normale
              circle.classList.add('breathing');
            }
            
          } else {
            // Spento = nessuna animazione, statico grigio
            circle.setAttribute('fill', '#424242');
            circle.setAttribute('stroke', '#616161');
            circle.style.filter = '';
            // Nessuna classe breathing = fermo
          }
        }
      }
    });
    
    // Aggiorna anche le stanze - falle respirare se hanno luci accese
    this._updateRoomStates();
  }
  
  _updateRoomStates() {
    const rooms = this._config.rooms || [];
    rooms.forEach((room, index) => {
      const roomNode = this.shadowRoot.querySelector(`g[data-node-key="room_${index}"]`);
      if (!roomNode) return;
      
      const roomCircle = roomNode.querySelector('.room-circle');
      if (!roomCircle) return;
      
      // Conta quante luci sono accese in questa stanza
      const devices = [...(room.lights || []), ...(room.switches || [])];
      const activeLights = devices.filter(deviceId => {
        const state = this._hass.states[deviceId];
        return state && state.state === 'on';
      });
      
      // Rimuovi classi precedenti
      roomCircle.classList.remove('room-breathing', 'room-active');
      
      // Se almeno una luce è accesa, fai respirare la stanza
      if (activeLights.length > 0) {
        roomCircle.classList.add('room-breathing', 'room-active');
      }
    });
  }
  
  // Funzione helper per scurire un colore (per il bordo)
  _darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * (percent / 100)));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * (percent / 100)));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  
  // Rendi il popup trascinabile
  _makePopupDraggable(popup) {
    const header = popup.querySelector('#popup-header');
    if (!header) return;
    
    let isDraggingPopup = false;
    let popupStartX = 0;
    let popupStartY = 0;
    let popupOffsetX = 0;
    let popupOffsetY = 0;
    
    const rect = this.shadowRoot.getElementById('container').getBoundingClientRect();
    
    const startDrag = (e) => {
      // Non iniziare drag se clicchi sulla X
      if (e.target.id === 'close-pop') return;
      
      isDraggingPopup = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const popupRect = popup.getBoundingClientRect();
      popupOffsetX = clientX - popupRect.left;
      popupOffsetY = clientY - popupRect.top;
      
      header.style.cursor = 'grabbing';
      e.preventDefault();
    };
    
    const drag = (e) => {
      if (!isDraggingPopup) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const containerRect = this.shadowRoot.getElementById('container').getBoundingClientRect();
      
      let newLeft = clientX - containerRect.left - popupOffsetX;
      let newTop = clientY - containerRect.top - popupOffsetY;
      
      // Limita dentro i bordi
      const popupRect = popup.getBoundingClientRect();
      const maxLeft = containerRect.width - popupRect.width - 10;
      const maxTop = containerRect.height - popupRect.height - 10;
      
      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));
      
      popup.style.left = `${newLeft}px`;
      popup.style.top = `${newTop}px`;
      
      e.preventDefault();
    };
    
    const endDrag = () => {
      isDraggingPopup = false;
      header.style.cursor = 'move';
    };
    
    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }
}
customElements.define('room-lights-graph-card', RoomLightsGraphCard);

