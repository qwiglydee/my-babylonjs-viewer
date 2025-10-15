import type { Color3, Color4 } from "@babylonjs/core/Maths";

export function C3toRGBString(color: Color3) {
    return `rgb(${color.r * 255},${color.g * 255},${color.b * 255})`;
}

export function C4toRGBAString(color: Color4) {
    return `rgba(${color.r * 255},${color.g * 255},${color.b * 255}, ${color.a})`;
}