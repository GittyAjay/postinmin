"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => async (req, res, next) => {
    try {
        const parsed = (await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        }));
        if (parsed.body)
            req.body = parsed.body;
        if (parsed.query)
            req.query = parsed.query;
        if (parsed.params)
            req.params = parsed.params;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.js.map