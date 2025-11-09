import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const swaggerDefinition = {
  openapi: "3.1.0",
  info: {
    title: "postinmin Marketing Automation API",
    version: "1.0.0",
    description:
      "REST API for AI-powered marketing automation, including calendar generation, template management, analytics, and monetization hooks.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts", "./docs/**/*.yaml"],
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (router: Router) => {
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

