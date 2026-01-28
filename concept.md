# Ambient CSS - Conceptual Background

## Introduction

Ambient CSS is a pure CSS framework that aims to create realistic, physically-based lighting, shadows and materials for styling web applications. It works particularly well for skeumorphism.

## Inspiration

Music synthesizer interfaces, original iPhone interface

## Physical Setup Mimicked

The interface is seen as an orthographic front view projection. 2 point lighting is used for illumination, with key and fill lights placed in opposite directions. The objects themselves have thickness and elevation, which changes the shadows they cast. The edges of the objects can be flat, grooved, filleted or chamfered, allowing for different effects. (Grooving works only when elevation and thickness are zero.) An object can also be an emitter, in which case it casts a faint glow and does not cast shadows.

## Packaging

1. Lite - classes only shadows, thickness, elevation and edges (fillet, chamfer, groove)
2. Full - everything in Lite + predefined styling of buttons, select, input and other interaction elements along with other components like tabs, labels etc.
3. Extra - everything in Full + widgets for fancy day/night transitions etc.

## Finishes

The entire component set can be finished in different textures - matte, shiny, translucent - which changes the way the components are coloured. Components can also be finished individually.
