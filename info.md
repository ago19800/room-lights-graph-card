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
#### Configuration with Custom Names (✨ NEW v1.0.4)
```yaml
type: custom:room-lights-graph-card
title: Home
rooms:
  - name: Kitchen
    lights:
      # Simple format (uses HA friendly_name)
      - light.main
      
      # Object format with custom name
      - entity: light.spotlight1
        name: "S1"
      - entity: light.spotlight2
        name: "S2"
      - entity: light.0xec1bbdfffe1c9e37
        name: "Under Cabinet"
    
    temperature_sensors:
      - entity: sensor.kitchen_temp
        name: "Temp"

  - name: Bedroom
    lights:
      - entity: light.bedroom_main
        name: "Ceiling"
      - entity: light.nightstand_left
        name: "Left"
      - entity: light.nightstand_right
        name: "Right"
    
    switches:
      - entity: switch.closet_light
        name: "Closet"
    
    temperature_sensors:
      - entity: sensor.bedroom_temperature
        name: "T"
```
## Support

For issues, questions, or feature requests, please visit:
https://github.com/ago19800/room-lights-graph-card/issues
