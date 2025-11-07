"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmotionColor = exports.emotionColorMap = void 0;
exports.emotionColorMap = {
    joy: "#FFD166",
    trust: "#118AB2",
    anticipation: "#ef476f",
    luxury: "#d4af37",
    calm: "#06d6a0",
    festivity: "#ff9f1c",
};
const getEmotionColor = (emotion) => {
    if (!emotion)
        return "#FFFFFF";
    return exports.emotionColorMap[emotion.toLowerCase()] ?? "#FFFFFF";
};
exports.getEmotionColor = getEmotionColor;
//# sourceMappingURL=emotion.js.map