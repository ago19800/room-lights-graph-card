/* =========================================================
   room-lights-graph-card  v4.0
   - Luci, switch, sensori temperatura
   - Cerchi grandi, distanze ampie
   - Posizioni persistenti via localStorage
   ========================================================= */
class RoomLightsGraphCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass          = null;
    this._config        = null;
    this._rendered      = false;
    this._translateX    = 0;
    this._translateY    = 0;
    this._nodePositions = new Map();
    this._isDragging    = false;
    this._isPanning     = false;
  }

  /* ── LIFECYCLE ──────────────────────────────────────────── */

  setConfig(config) {
    if (!config.rooms) throw new Error('room-lights-graph-card: manca "rooms"');
    this._config = config;
    this._buildPositions();
    if (this._rendered) {
      this._renderGraph();
      if (this._hass) this._updateStates();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._firstRender();
    } else {
      this._updateStates();
    }
  }

  /* ── PRIMO RENDER ───────────────────────────────────────── */

  _firstRender() {
    this._rendered = true;
    this.shadowRoot.innerHTML = this._getTemplate();
    this._setupPanDrag();
    this._setupResetBtn();
    this._renderGraph();
    this._updateStates();
  }

  /* ── LOCALSTORAGE ───────────────────────────────────────── */

  // Chiave unica basata sulla configurazione delle stanze
  _storageKey() {
    const rooms  = this._config.rooms || [];
    const finger = rooms.map(r =>
      r.name + ':' +
      [...(r.lights||[]),...(r.switches||[]),...(r.temperature_sensors||[])].join(',')
    ).join('|');
    // Hash semplice deterministico
    let h = 0;
    for (let i = 0; i < finger.length; i++) h = (Math.imul(31, h) + finger.charCodeAt(i)) | 0;
    return `rlgc_pos_${(h >>> 0).toString(36)}`;
  }

  _savePositions() {
    try {
      const data = {
        tx: this._translateX,
        ty: this._translateY,
        nodes: Object.fromEntries(this._nodePositions)
      };
      localStorage.setItem(this._storageKey(), JSON.stringify(data));
    } catch (e) { /* localStorage non disponibile, ignora */ }
  }

  _loadPositions() {
    try {
      const raw = localStorage.getItem(this._storageKey());
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.nodes) return false;
      this._translateX = data.tx || 0;
      this._translateY = data.ty || 0;
      this._nodePositions = new Map(Object.entries(data.nodes));
      return true;
    } catch (e) { return false; }
  }

  _clearPositions() {
    try { localStorage.removeItem(this._storageKey()); } catch (e) {}
  }

  /* ── COSTRUZIONE POSIZIONI ──────────────────────────────── */

  _buildPositions() {
    // Prova a caricare dal localStorage — se OK usa quelle
    if (this._loadPositions()) {
      // Verifica che tutte le chiavi necessarie siano presenti
      if (this._allKeysPresent()) return;
    }
    // Altrimenti genera posizioni casuali
    this._generatePositions();
  }

  // Controlla che ogni device/room abbia una posizione salvata
  _allKeysPresent() {
    const rooms = this._config.rooms || [];
    for (let i = 0; i < rooms.length; i++) {
      if (!this._nodePositions.has(`room_${i}`)) return false;
      const room = rooms[i];
      for (const id of [...(room.lights||[]),...(room.switches||[])]) {
        if (!this._nodePositions.has('dev_' + id)) return false;
      }
      for (const id of (room.temperature_sensors||[])) {
        if (!this._nodePositions.has('tmp_' + id)) return false;
      }
    }
    return true;
  }

  _generatePositions() {
    this._nodePositions = new Map();
    this._translateX    = 0;
    this._translateY    = 0;

    const rooms  = this._config.rooms || [];
    // ViewBox 950×950, centro (475,460), raggio stanze 230
    const CX = 475, CY = 460, R_ROOM = 230;

    rooms.forEach((room, i) => {
      const angle = (i * 2 * Math.PI / rooms.length) - Math.PI / 2;
      this._nodePositions.set(`room_${i}`, {
        x: Math.round(CX + R_ROOM * Math.cos(angle)),
        y: Math.round(CY + R_ROOM * Math.sin(angle))
      });
    });

    rooms.forEach((room, i) => {
      const rPos    = this._nodePositions.get(`room_${i}`);
      const devices = [
        ...(room.lights             || []).map(id => ({ id, prefix: 'dev_' })),
        ...(room.switches           || []).map(id => ({ id, prefix: 'dev_' })),
        ...(room.temperature_sensors|| []).map(id => ({ id, prefix: 'tmp_' })),
      ];
      devices.forEach(d => {
        this._nodePositions.set(d.prefix + d.id,
          this._randomPos(rPos.x, rPos.y));
      });
    });
  }

  _randomPos(rx, ry) {
    // Distanze ampie: min 130px, max 210px dal centro stanza
    const MIN_R = 130, MAX_R = 210, MIN_DIST = 82;
    const W = 950, H = 950, PAD = 65;

    for (let t = 0; t < 300; t++) {
      const a = Math.random() * Math.PI * 2;
      const r = MIN_R + Math.random() * (MAX_R - MIN_R);
      const x = rx + r * Math.cos(a);
      const y = ry + r * Math.sin(a);

      if (x < PAD || x > W - PAD || y < PAD || y > H - PAD) continue;

      let ok = true;
      for (const p of this._nodePositions.values()) {
        if (Math.hypot(p.x - x, p.y - y) < MIN_DIST) { ok = false; break; }
      }
      if (ok) return { x, y };
    }
    const a = Math.random() * Math.PI * 2;
    return {
      x: Math.max(PAD, Math.min(W - PAD, rx + MIN_R * Math.cos(a))),
      y: Math.max(PAD, Math.min(H - PAD, ry + MIN_R * Math.sin(a)))
    };
  }

  /* ── TEMPLATE ───────────────────────────────────────────── */

  _getTemplate() {
    return `
    <ha-card style="overflow:hidden;background:var(--card-background-color);border-radius:16px;">
      <style>
        :host { display:block; }
        .container { width:100%;height:660px;position:relative;overflow:hidden;touch-action:none; }
        svg { width:100%;height:100%;cursor:grab; }

        /* ── animazioni luci ── */
        @keyframes b-fast { 0%,100%{transform:scale(1);opacity:1}  50%{transform:scale(1.12);opacity:.8} }
        @keyframes b-med  { 0%,100%{transform:scale(1);opacity:1}  50%{transform:scale(1.08);opacity:.85} }
        @keyframes b-slow { 0%,100%{transform:scale(1);opacity:1}  50%{transform:scale(1.05);opacity:.9} }
        @keyframes glow   { 0%,100%{filter:drop-shadow(0 0 10px currentColor)} 50%{filter:drop-shadow(0 0 24px currentColor)} }
        @keyframes qpulse { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }

        .dev-circle.b-fast { animation:b-fast 1.5s ease-in-out infinite; }
        .dev-circle.b-med  { animation:b-med  2.5s ease-in-out infinite; }
        .dev-circle.b-slow { animation:b-slow 4s   ease-in-out infinite; }
        .dev-circle.b-glow { animation:glow   2.5s ease-in-out infinite; }

        /* ── animazioni temperatura ── */
        @keyframes tp      { 0%,100%{transform:scale(1);opacity:.92} 50%{transform:scale(1.07);opacity:1} }
        @keyframes tp-hot  { 0%,100%{transform:scale(1);opacity:.88} 50%{transform:scale(1.13);opacity:1} }
        @keyframes tp-cold { 0%,100%{transform:scale(1);opacity:.95} 50%{transform:scale(1.04);opacity:1} }

        .tmp-circle           { animation:tp      3s   ease-in-out infinite; }
        .tmp-circle.tmp-hot   { animation:tp-hot  1.8s ease-in-out infinite; }
        .tmp-circle.tmp-cold  { animation:tp-cold 4.5s ease-in-out infinite; }

        /* ── animazioni stanza ── */
        @keyframes room-b { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .room-circle { fill:#03A9F4;stroke:#0288D1;stroke-width:3; }
        .room-circle.r-active { animation:room-b 3s ease-in-out infinite;filter:drop-shadow(0 0 18px rgba(3,169,244,.85)); }

        /* ── linee ── */
        .line     { stroke:var(--primary-color);stroke-width:2.5;opacity:.3;pointer-events:none; }
        .line-tmp { stroke:#78909C;stroke-width:2;stroke-dasharray:7,5;opacity:.45;pointer-events:none; }

        /* ── testo ── */
        .lbl { font-size:14px;fill:var(--primary-text-color);font-weight:600;pointer-events:none; }

        /* ── nodo cursore ── */
        .node { cursor:pointer; }

        /* ── pulsante reset ── */
        .reset-btn {
          position:absolute;top:12px;right:12px;z-index:10;
          background:linear-gradient(135deg,#0288D1,#03A9F4);
          color:#fff;border:none;padding:9px 16px;border-radius:8px;
          cursor:pointer;font-weight:700;font-size:13px;
          box-shadow:0 3px 8px rgba(0,0,0,.3);transition:all .3s;
        }
        .reset-btn:hover  { transform:translateY(-2px);box-shadow:0 5px 12px rgba(0,0,0,.4); }
        .reset-btn:active { transform:scale(.95); }
        @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        .reset-btn.spinning { animation:spin .5s ease-out; }

        /* ── popup ── */
        .popup {
          position:absolute;z-index:1000;
          background:var(--paper-card-background-color,#1e1e1e);
          border-radius:12px;padding:20px;min-width:210px;max-width:290px;
          box-shadow:0 10px 32px rgba(0,0,0,.6);
          color:var(--primary-text-color);border:1px solid var(--divider-color);
        }
        .pop-hdr {
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 10px;font-weight:700;font-size:15px;
          cursor:move;user-select:none;color:#fff;
          background:linear-gradient(135deg,var(--primary-color),rgba(3,169,244,.8));
          margin:-20px -20px 15px;border-radius:12px 12px 0 0;
        }
        .pop-hdr:active { cursor:grabbing; }
        .pop-hdr-title { flex:1;word-break:break-word;padding-right:8px; }
        .pop-hdr-close {
          font-size:20px;padding:2px 8px;background:rgba(255,255,255,.2);
          border-radius:4px;cursor:pointer;transition:.2s;
        }
        .pop-hdr-close:hover { background:rgba(255,255,255,.35);transform:scale(1.1); }
        .pop-row { margin:14px 0; }
        .pop-lbl { font-size:13px;display:block;margin-bottom:6px;font-weight:600; }
        .pop-btn {
          width:100%;padding:13px;border-radius:8px;border:none;
          background:var(--primary-color);color:#fff;
          cursor:pointer;font-weight:700;font-size:15px;
        }
        input[type=range] { width:100%;height:12px;cursor:pointer;accent-color:var(--primary-color); }
        input[type=color] { width:100%;height:44px;border:2px solid var(--divider-color);border-radius:8px;cursor:pointer; }

        /* ── popup temperatura ── */
        .tmp-display { text-align:center;padding:10px 4px 4px; }
        .tmp-big     { font-size:46px;font-weight:800;display:block;line-height:1;letter-spacing:-1px; }
        .tmp-label   { font-size:13px;opacity:.7;margin-top:6px;display:block;font-style:italic; }
        .tmp-bar {
          height:8px;border-radius:4px;margin:12px 4px 6px;
          background:linear-gradient(to right,#1E88E5,#29B6F6,#26C6DA,#66BB6A,#FFA726,#EF5350,#B71C1C);
          position:relative;
        }
        .tmp-dot {
          position:absolute;top:-5px;width:18px;height:18px;border-radius:50%;
          border:2.5px solid #fff;transform:translateX(-50%);box-shadow:0 1px 5px rgba(0,0,0,.4);
        }
        .tmp-row {
          display:flex;justify-content:space-between;align-items:center;
          padding:8px 4px;border-top:1px solid var(--divider-color);font-size:13px;
        }
        .tmp-row .r-lbl { opacity:.6; }
        .tmp-row .r-val { font-weight:700; }
      </style>

      <button class="reset-btn" id="reset-btn">&#8635; RESET</button>
      <div class="container" id="container">
        <svg id="svg" viewBox="0 0 950 950">
          <g id="main-g">
            <g id="lines-g"></g>
            <g id="nodes-g"></g>
            <circle cx="475" cy="460" r="62" fill="var(--primary-color)" opacity=".9"/>
            <text x="475" y="467" text-anchor="middle"
                  style="font-size:17px;font-weight:700;fill:#fff;pointer-events:none">CASA</text>
          </g>
        </svg>
      </div>
    </ha-card>`;
  }

  /* ── GRAFO ──────────────────────────────────────────────── */

  _renderGraph() {
    const nG = this.shadowRoot.getElementById('nodes-g');
    const lG = this.shadowRoot.getElementById('lines-g');
    if (!nG || !lG) return;
    nG.innerHTML = ''; lG.innerHTML = '';

    const CX = 475, CY = 460;

    (this._config.rooms || []).forEach((room, i) => {
      const rKey = `room_${i}`;
      const rPos = this._nodePositions.get(rKey);
      if (!rPos) return;

      this._addLine(lG, CX, CY, rPos.x, rPos.y, 'center', rKey, false);
      nG.appendChild(this._makeRoomNode(rPos, room.name, rKey));

      [...(room.lights||[]),...(room.switches||[])].forEach(id => {
        const key = 'dev_' + id;
        const pos = this._nodePositions.get(key);
        if (!pos) return;
        this._addLine(lG, rPos.x, rPos.y, pos.x, pos.y, rKey, key, false);
        nG.appendChild(this._makeDevNode(pos, id, key));
      });

      (room.temperature_sensors||[]).forEach(id => {
        const key = 'tmp_' + id;
        const pos = this._nodePositions.get(key);
        if (!pos) return;
        this._addLine(lG, rPos.x, rPos.y, pos.x, pos.y, rKey, key, true);
        nG.appendChild(this._makeTmpNode(pos, id, key));
      });
    });

    // Ripristina il pan salvato
    this._applyTransform();
  }

  _addLine(g, x1, y1, x2, y2, from, to, isTemp) {
    const l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('class', isTemp ? 'line-tmp' : 'line');
    l.setAttribute('x1',x1); l.setAttribute('y1',y1);
    l.setAttribute('x2',x2); l.setAttribute('y2',y2);
    l.setAttribute('data-from',from); l.setAttribute('data-to',to);
    g.appendChild(l);
  }

  /* ── NODI SVG ───────────────────────────────────────────── */

  // Stanza: cerchio grande r=58
  _makeRoomNode(pos, name, key) {
    const g = this._svgG(key,'room');
    const c = this._svgEl('circle');
    c.setAttribute('class','room-circle');
    c.setAttribute('cx',pos.x); c.setAttribute('cy',pos.y); c.setAttribute('r',58);
    g.appendChild(c);
    g.appendChild(this._svgText(pos.x, pos.y+7, name, 'lbl',
      'fill:white;font-size:15px', 7));
    return g;
  }

  // Dispositivo (luce/switch): cerchio r=42
  _makeDevNode(pos, entityId, key) {
    const g      = this._svgG(key,'dev');
    const entity = this._hass ? this._hass.states[entityId] : null;
    const name   = entity?.attributes?.friendly_name || entityId.split('.')[1] || entityId;
    const icon   = entityId.startsWith('light.') ? '\uD83D\uDCA1' : '\uD83D\uDD0C';

    const c = this._svgEl('circle');
    c.setAttribute('class','dev-circle');
    c.setAttribute('cx',pos.x); c.setAttribute('cy',pos.y); c.setAttribute('r',42);
    c.setAttribute('stroke','#fff'); c.setAttribute('stroke-width',2.5);
    g.appendChild(c);
    g.appendChild(this._svgText(pos.x, pos.y+12, icon,  '', 'font-size:30px', 12));
    g.appendChild(this._svgText(pos.x, pos.y+64, name, 'lbl', '', 64));
    return g;
  }

  // Sensore temperatura: cerchio r=42
  _makeTmpNode(pos, entityId, key) {
    const g      = this._svgG(key,'tmp');
    const entity = this._hass ? this._hass.states[entityId] : null;
    const temp   = entity ? parseFloat(entity.state) : NaN;
    const unit   = entity?.attributes?.unit_of_measurement || '°C';
    const color  = this._tempColor(temp);
    const dark   = this._darken(color,22);
    const valTxt = isNaN(temp) ? '--' : temp.toFixed(1)+unit;
    const name   = entity?.attributes?.friendly_name || entityId.split('.')[1] || entityId;

    const c = this._svgEl('circle');
    c.setAttribute('class','tmp-circle');
    c.setAttribute('cx',pos.x); c.setAttribute('cy',pos.y); c.setAttribute('r',42);
    c.setAttribute('fill',color); c.setAttribute('stroke',dark); c.setAttribute('stroke-width',3);
    c.style.filter = `drop-shadow(0 0 12px ${color})`;
    g.appendChild(c);

    g.appendChild(this._svgText(pos.x, pos.y-8,  '\uD83C\uDF21','','font-size:20px',-8));
    g.appendChild(this._svgText(pos.x, pos.y+16, valTxt,'tmp-val',
      'font-size:13px;fill:white;font-weight:800',16));
    g.appendChild(this._svgText(pos.x, pos.y+64, name,'lbl','',64));
    return g;
  }

  /* SVG helpers */
  _svgG(key,type) {
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','node');
    g.setAttribute('data-key',key);
    g.setAttribute('data-type',type);
    return g;
  }
  _svgEl(tag) { return document.createElementNS('http://www.w3.org/2000/svg',tag); }
  _svgText(x,y,text,cls,style,dy) {
    const t = this._svgEl('text');
    t.setAttribute('x',x); t.setAttribute('y',y);
    t.setAttribute('text-anchor','middle');
    t.setAttribute('data-dy',dy);
    if (cls)   t.setAttribute('class',cls);
    if (style) t.setAttribute('style',style);
    t.textContent = text;
    return t;
  }

  /* ── EVENTI PAN / DRAG ──────────────────────────────────── */

  _setupPanDrag() {
    const svg = this.shadowRoot.getElementById('svg');

    const coords = (e) => {
      const pt = svg.createSVGPoint();
      const c  = e.touches ? e.touches[0] : e;
      pt.x = c.clientX; pt.y = c.clientY;
      return pt.matrixTransform(
        this.shadowRoot.getElementById('main-g').getScreenCTM().inverse()
      );
    };

    svg.addEventListener('mousedown',  (e) => this._onStart(e, coords(e)));
    svg.addEventListener('touchstart', (e) => this._onStart(e, coords(e)), {passive:false});
    window.addEventListener('mousemove',  (e) => this._onMove(e, coords(e)));
    window.addEventListener('touchmove',  (e) => this._onMove(e, coords(e)), {passive:false});
    window.addEventListener('mouseup',    ()  => this._onEnd());
    window.addEventListener('touchend',   ()  => this._onEnd());
  }

  _onStart(e, c) {
    const node = e.composedPath().find(
      el => el.getAttribute && el.getAttribute('class') === 'node'
    );
    if (node) {
      const key = node.getAttribute('data-key');
      const pos = this._nodePositions.get(key);
      if (!pos) return;
      this._isDragging = true;
      this._dragKey    = key;
      this._dragT0     = Date.now();
      this._hasMoved   = false;
      this._offset     = { x: c.x - pos.x, y: c.y - pos.y };
    } else {
      this._isPanning = true;
      const ev = e.touches ? e.touches[0] : e;
      this._panStart = { x: ev.clientX - this._translateX, y: ev.clientY - this._translateY };
    }
  }

  _onMove(e, c) {
    if (!this._isPanning && !this._isDragging) return;
    if (e.cancelable) e.preventDefault();

    if (this._isPanning) {
      const ev = e.touches ? e.touches[0] : e;
      this._translateX = ev.clientX - this._panStart.x;
      this._translateY = ev.clientY - this._panStart.y;
      this._applyTransform();
    } else {
      this._hasMoved = true;
      const newPos   = { x: c.x - this._offset.x, y: c.y - this._offset.y };
      this._nodePositions.set(this._dragKey, newPos);

      const g = this.shadowRoot.querySelector(`g[data-key="${this._dragKey}"]`);
      if (g) {
        const circ = g.querySelector('circle');
        if (circ) { circ.setAttribute('cx',newPos.x); circ.setAttribute('cy',newPos.y); }
        g.querySelectorAll('text').forEach(t => {
          t.setAttribute('x', newPos.x);
          t.setAttribute('y', newPos.y + parseFloat(t.getAttribute('data-dy')||8));
        });
        this._refreshLines();
      }
    }
  }

  _onEnd() {
    if (this._isDragging && !this._hasMoved && (Date.now()-this._dragT0 < 250)) {
      const key = this._dragKey;
      const pos = this._nodePositions.get(key);
      if      (key.startsWith('dev_')) this._showDevPopup(key.replace('dev_',''), pos);
      else if (key.startsWith('tmp_')) this._showTmpPopup(key.replace('tmp_',''), pos);
    }
    // Salva posizioni ogni volta che finisce un'azione (drag o pan)
    if (this._isDragging || this._isPanning) {
      this._savePositions();
    }
    this._isDragging = false;
    this._isPanning  = false;
  }

  _setupResetBtn() {
    const btn = this.shadowRoot.getElementById('reset-btn');
    btn.onclick = () => {
      btn.classList.add('spinning');
      setTimeout(()=>btn.classList.remove('spinning'), 500);
      this._clearPositions();   // cancella localStorage
      this._generatePositions(); // rigenera casualmente
      this._savePositions();    // salva le nuove posizioni
      this._renderGraph();
      this._updateStates();
    };
  }

  _applyTransform() {
    const g = this.shadowRoot.getElementById('main-g');
    if (g) g.setAttribute('transform',
      `translate(${this._translateX},${this._translateY})`);
  }

  _refreshLines() {
    const CX = 475, CY = 460;
    this.shadowRoot.querySelectorAll('.line,.line-tmp').forEach(l => {
      const f  = l.getAttribute('data-from');
      const t  = l.getAttribute('data-to');
      const p1 = f === 'center' ? {x:CX,y:CY} : this._nodePositions.get(f);
      const p2 = this._nodePositions.get(t);
      if (p1 && p2) {
        l.setAttribute('x1',p1.x); l.setAttribute('y1',p1.y);
        l.setAttribute('x2',p2.x); l.setAttribute('y2',p2.y);
      }
    });
  }

  /* ── AGGIORNAMENTO STATI ─────────────────────────────────── */

  _updateStates() {
    if (!this._rendered || !this._hass) return;
    this._updateDevStates();
    this._updateTmpStates();
    this._updateRoomStates();
  }

  _updateDevStates() {
    this.shadowRoot.querySelectorAll('g[data-type="dev"]').forEach(g => {
      const id     = g.getAttribute('data-key').replace('dev_','');
      const state  = this._hass.states[id];
      const circle = g.querySelector('.dev-circle');
      if (!state || !circle) return;

      circle.classList.remove('b-fast','b-med','b-slow','b-glow');

      if (state.state === 'on') {
        if (id.startsWith('light.') && state.attributes.rgb_color) {
          const hex = '#' + state.attributes.rgb_color
            .map(v=>v.toString(16).padStart(2,'0')).join('');
          circle.setAttribute('fill',hex);
          circle.setAttribute('stroke',this._darken(hex,20));
          circle.style.color  = hex;
          circle.style.filter = '';
          circle.classList.add('b-glow');
        } else {
          circle.setAttribute('fill','#FDD835');
          circle.setAttribute('stroke','#F9A825');
          circle.style.filter = 'drop-shadow(0 0 14px #FDD835)';
          circle.style.color  = '#FDD835';
        }
        const br = state.attributes.brightness;
        circle.classList.add(
          br === undefined ? 'b-med' : br > 200 ? 'b-fast' : br > 100 ? 'b-med' : 'b-slow'
        );
      } else {
        circle.setAttribute('fill','#424242');
        circle.setAttribute('stroke','#616161');
        circle.style.filter = '';
        circle.style.color  = '';
      }
    });
  }

  _updateTmpStates() {
    this.shadowRoot.querySelectorAll('g[data-type="tmp"]').forEach(g => {
      const id     = g.getAttribute('data-key').replace('tmp_','');
      const entity = this._hass.states[id];
      const circle = g.querySelector('.tmp-circle');
      const valEl  = g.querySelector('.tmp-val');
      if (!circle) return;

      const temp  = entity ? parseFloat(entity.state) : NaN;
      const unit  = entity?.attributes?.unit_of_measurement || '°C';
      const color = this._tempColor(temp);
      const dark  = this._darken(color,22);

      circle.setAttribute('fill',color);
      circle.setAttribute('stroke',dark);
      circle.style.filter = `drop-shadow(0 0 12px ${color})`;
      circle.classList.remove('tmp-hot','tmp-cold');
      if (!isNaN(temp)) {
        if (temp > 26) circle.classList.add('tmp-hot');
        else if (temp < 15) circle.classList.add('tmp-cold');
      }
      if (valEl) valEl.textContent = isNaN(temp) ? '--' : temp.toFixed(1)+unit;
    });
  }

  _updateRoomStates() {
    (this._config.rooms||[]).forEach((room,i) => {
      const g = this.shadowRoot.querySelector(`g[data-key="room_${i}"]`);
      const c = g?.querySelector('.room-circle');
      if (!c) return;
      const active = [...(room.lights||[]),...(room.switches||[])]
        .some(id => this._hass.states[id]?.state === 'on');
      c.classList.toggle('r-active', active);
    });
  }

  /* ── POPUP LUCI / SWITCH ────────────────────────────────── */

  _showDevPopup(entityId) {
    this.shadowRoot.querySelector('.popup')?.remove();
    const entity = this._hass.states[entityId];
    if (!entity) return;

    const popup = this._basePopup();
    popup.querySelector('.pop-hdr-title').textContent =
      '\uD83D\uDCA1 ' + (entity.attributes.friendly_name || entityId);

    const br     = entity.attributes.brightness
      ? Math.round(entity.attributes.brightness/255*100) : 0;
    let rgbHex   = '#ffffff';
    if (entity.attributes.rgb_color) {
      rgbHex = '#' + entity.attributes.rgb_color.map(v=>v.toString(16).padStart(2,'0')).join('');
    }
    const hasBr  = entity.attributes.brightness !== undefined ||
      entity.attributes.supported_color_modes?.some(m=>/brightness|hs|rgb|xy/.test(m));
    const hasRgb = entity.attributes.rgb_color ||
      entity.attributes.supported_color_modes?.some(m=>/rgb|hs/.test(m));

    popup.querySelector('.pop-body').innerHTML = `
      <button class="pop-btn" id="p-tgl">${entity.state==='on'?'SPEGNI':'ACCENDI'}</button>
      ${hasBr ? `<div class="pop-row"><span class="pop-lbl">Luminosità: <span id="bv">${br}</span>%</span><input type="range" id="p-br" min="1" max="100" value="${br}"></div>` : ''}
      ${hasRgb ? `<div class="pop-row"><span class="pop-lbl">Colore RGB</span><input type="color" id="p-rgb" value="${rgbHex}"></div>` : ''}
    `;

    this.shadowRoot.getElementById('container').appendChild(popup);
    this._makeDraggable(popup);

    popup.querySelector('.pop-hdr-close').onclick = ()=>popup.remove();
    popup.querySelector('#p-tgl').onclick = ()=>{
      this._hass.callService('homeassistant','toggle',{entity_id:entityId});
      setTimeout(()=>this._updateStates(),100);
      popup.remove();
    };
    const brEl = popup.querySelector('#p-br');
    if (brEl) {
      brEl.oninput  = e => popup.querySelector('#bv').textContent = e.target.value;
      brEl.onchange = e => this._hass.callService('light','turn_on',
        {entity_id:entityId,brightness_pct:+e.target.value});
    }
    const rgbEl = popup.querySelector('#p-rgb');
    if (rgbEl) {
      rgbEl.oninput = e => {
        const h=e.target.value;
        const c=this.shadowRoot.querySelector(`g[data-key="dev_${entityId}"] .dev-circle`);
        if(c){c.setAttribute('fill',h);c.style.filter=`drop-shadow(0 0 16px ${h})`;}
      };
      rgbEl.onchange = e => {
        const h=e.target.value;
        const rgb=[1,3,5].map(o=>parseInt(h.slice(o,o+2),16));
        this._hass.callService('light','turn_on',{entity_id:entityId,rgb_color:rgb});
      };
    }
  }

  /* ── POPUP TEMPERATURA ──────────────────────────────────── */

  _showTmpPopup(entityId) {
    this.shadowRoot.querySelector('.popup')?.remove();
    const entity = this._hass.states[entityId];
    if (!entity) return;

    const popup  = this._basePopup();
    const temp   = parseFloat(entity.state);
    const unit   = entity.attributes.unit_of_measurement || '°C';
    const color  = this._tempColor(temp);
    const dark   = this._darken(color,25);
    const name   = entity.attributes.friendly_name || entityId.split('.')[1];
    const hum    = entity.attributes.humidity;
    const pct    = Math.min(95,Math.max(5,((temp-5)/30)*100));

    popup.querySelector('.pop-hdr').style.background =
      `linear-gradient(135deg,${dark},${color})`;
    popup.querySelector('.pop-hdr-title').textContent = '\uD83C\uDF21 ' + name;

    popup.querySelector('.pop-body').innerHTML = `
      <div class="tmp-display">
        <span class="tmp-big" style="color:${color}">${isNaN(temp)?'--':temp.toFixed(1)}${unit}</span>
        <span class="tmp-label">${this._tempLabel(temp)}</span>
      </div>
      <div class="tmp-bar"><div class="tmp-dot" style="left:${pct}%;background:${color}"></div></div>
      ${hum!==undefined?`<div class="tmp-row"><span class="r-lbl">&#128167; Umidità</span><span class="r-val">${hum}%</span></div>`:''}
      <div class="tmp-row">
        <span class="r-lbl">&#128336; Aggiornato</span>
        <span class="r-val">${this._timeAgo(entity.last_updated)}</span>
      </div>
    `;

    this.shadowRoot.getElementById('container').appendChild(popup);
    this._makeDraggable(popup);
    popup.querySelector('.pop-hdr-close').onclick = ()=>popup.remove();
  }

  /* ── POPUP BASE ─────────────────────────────────────────── */

  _basePopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    const rect = this.shadowRoot.getElementById('container').getBoundingClientRect();
    const W=270, H=260;
    popup.style.left = Math.max(10,Math.min((rect.width-W)/2,  rect.width-W-10))  + 'px';
    popup.style.top  = Math.max(10,Math.min((rect.height-H)/2, rect.height-H-10)) + 'px';
    popup.innerHTML  = `
      <div class="pop-hdr" id="pop-hdr">
        <span class="pop-hdr-title"></span>
        <span class="pop-hdr-close">&#10005;</span>
      </div>
      <div class="pop-body"></div>`;
    return popup;
  }

  _makeDraggable(popup) {
    const hdr = popup.querySelector('.pop-hdr');
    let drag=false, ox=0, oy=0;
    const down = e=>{
      if(e.target.classList.contains('pop-hdr-close')) return;
      drag=true;
      const c=e.touches?e.touches[0]:e;
      const r=popup.getBoundingClientRect();
      ox=c.clientX-r.left; oy=c.clientY-r.top;
      e.preventDefault();
    };
    const move = e=>{
      if(!drag) return;
      const c=e.touches?e.touches[0]:e;
      const cr=this.shadowRoot.getElementById('container').getBoundingClientRect();
      const pr=popup.getBoundingClientRect();
      popup.style.left = Math.max(10,Math.min(c.clientX-cr.left-ox,cr.width-pr.width-10))+'px';
      popup.style.top  = Math.max(10,Math.min(c.clientY-cr.top-oy,cr.height-pr.height-10))+'px';
      e.preventDefault();
    };
    const up = ()=>{ drag=false; };
    hdr.addEventListener('mousedown',  down);
    hdr.addEventListener('touchstart', down, {passive:false});
    document.addEventListener('mousemove',  move);
    document.addEventListener('touchmove',  move, {passive:false});
    document.addEventListener('mouseup',    up);
    document.addEventListener('touchend',   up);
  }

  /* ── UTILITY ─────────────────────────────────────────────── */

  _tempColor(t) {
    if(isNaN(t))return'#78909C';
    if(t<=10)return'#1E88E5';if(t<=15)return'#29B6F6';
    if(t<=19)return'#26C6DA';if(t<=22)return'#66BB6A';
    if(t<=25)return'#FFA726';if(t<=28)return'#EF5350';
    return'#B71C1C';
  }
  _tempLabel(t) {
    if(isNaN(t))return'Dati non disponibili';
    if(t<=10)return'\uD83E\uDD76 Molto freddo';if(t<=15)return'\u2744\uFE0F Freddo';
    if(t<=19)return'\uD83C\uDF24\uFE0F Fresco';if(t<=22)return'\u2705 Confortevole';
    if(t<=25)return'\u2600\uFE0F Caldo';if(t<=28)return'\uD83D\uDD06 Molto caldo';
    return'\uD83D\uDD25 Caldissimo';
  }
  _timeAgo(iso) {
    try{
      const m=Math.round((Date.now()-new Date(iso))/60000);
      if(m<1)return'Adesso';if(m<60)return m+' min fa';
      const h=Math.round(m/60);
      return h<24?h+'h fa':new Date(iso).toLocaleDateString('it-IT');
    }catch{return'--';}
  }
  _darken(hex,pct) {
    const n=parseInt(hex.replace('#',''),16);
    const d=Math.round(255*pct/100);
    const r=Math.max(0,((n>>16)&0xff)-d);
    const g=Math.max(0,((n>>8)&0xff)-d);
    const b=Math.max(0,(n&0xff)-d);
    return'#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
  }
}

customElements.define('room-lights-graph-card', RoomLightsGraphCard);
