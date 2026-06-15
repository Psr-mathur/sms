import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource, getModelByName } from "@adminjs/prisma";
import { prisma } from "../lib/prisma.js";

// Register Prisma adapter in AdminJS
AdminJS.registerAdapter({ Database, Resource });

const adminJs = new AdminJS({
  resources: [
    {
      resource: { model: getModelByName("Customer"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
        },
      },
    },
    {
      resource: { model: getModelByName("Supplier"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
        },
      },
    },
    {
      resource: { model: getModelByName("Item"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
          quantity: { type: "number" },
          lowStockThreshold: { type: "number" },
        },
      },
    },
    {
      resource: { model: getModelByName("Purchase"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" },
        },
      },
    },
    {
      resource: { model: getModelByName("Sale"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" },
        },
      },
    },
    {
      resource: { model: getModelByName("User"), client: prisma },
      options: {
        properties: {
          id: { isId: true },
          password: {
            isVisible: {
              list: false, edit: true, filter: false, show: false
            }
          }
        }
      }
    },
  ],
  rootPath: "/admin",
  branding: {
    companyName: "Stock Sync CMS",
    logo: false,
    theme: {
      colors: {
        primary100: "#f59e0b",
      },
    },
  },
});

export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: async (email, password) => {
      const expectedPassword = process.env.CMS_PASSWORD || "admin_cms";
      if (password === expectedPassword) {
        return { email };
      }
      return null;
    },
    cookieName: "cms_session",
    cookiePassword: process.env.CMS_COOKIE_PASSWORD || "supersecretcookiepasswordmustbe32charslong",
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: process.env.CMS_COOKIE_PASSWORD || "supersecretcookiepasswordmustbe32charslong",
  }
);
