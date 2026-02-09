# Room Lights Graph Card

An interactive Lovelace card for Home Assistant that displays your lights organized by room in a beautiful, animated graph.

## Features

✨ **Interactive Graph** - Drag and reorganize your lights and rooms  
🎨 **Real RGB Colors** - See actual light colors on the graph  
💫 **Breathing Animation** - Nodes pulse based on brightness  
🎮 **Complete Controls** - Dimmer, RGB picker, on/off  
📱 **Mobile Optimized** - Perfect on phones and tablets  
🚀 **60 FPS** - Smooth GPU-accelerated animations

## Quick Start

After installation, add this to your dashboard:

```yaml
type: custom:room-lights-graph-card
title: My Lights
rooms:
  - name: Bedroom
    lights:
      - light.bedroom_main
  - name: Living Room
    lights:
      - light.living_room_main
```

## Support

For issues, questions, or feature requests, please visit:
https://github.com/YOUR-USERNAME/room-lights-graph-card/issues
