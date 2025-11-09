"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middlewares/errorHandler");
const logger_1 = require("./utils/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const businessRoutes_1 = __importDefault(require("./routes/businessRoutes"));
const templateRoutes_1 = __importDefault(require("./routes/templateRoutes"));
const calendarRoutes_1 = __importDefault(require("./routes/calendarRoutes"));
const renderRoutes_1 = __importDefault(require("./routes/renderRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
const publicDir = path_1.default.resolve(process.cwd(), "public");
app.use(express_1.default.static(publicDir));
app.use((0, morgan_1.default)("combined", {
    stream: {
        write: (message) => logger_1.logger.info(message.trim()),
    },
}));
const router = express_1.default.Router();
(0, swagger_1.setupSwagger)(router);
router.use("/auth", authRoutes_1.default);
router.use("/business", businessRoutes_1.default);
router.use("/template", templateRoutes_1.default);
router.use("/calendar", calendarRoutes_1.default);
router.use("/render", renderRoutes_1.default);
router.use("/analytics", analyticsRoutes_1.default);
router.use("/ai", aiRoutes_1.default);
router.use("/search", searchRoutes_1.default);
router.use("/posts", postRoutes_1.default);
app.get("/health", (_req, res) => {
    res.json({ status: "ok", environment: env_1.env.NODE_ENV });
});
app.use("/api", router);
app.use((req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
    }
    const indexPath = path_1.default.join(publicDir, "index.html");
    if (!fs_1.default.existsSync(indexPath)) {
        return next();
    }
    res.sendFile(indexPath);
});
app.use((req, res) => {
    res.status(404).json({ status: "error", message: `Route ${req.path} not found` });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map