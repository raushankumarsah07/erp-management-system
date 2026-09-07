import express from 'express';

const router = express.Router();

const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'ERP Management System REST API',
    version: '1.0.0',
    description: 'Enterprise ERP backend API supporting Products, Orders, Invoices, GRN, Customers, Suppliers, and Role-based Auth.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane@erp.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['admin', 'sales', 'purchase', 'inventory', 'finance'], example: 'sales' },
                  department: { type: 'string', example: 'Sales' },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user & retrieve JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@erp.com' },
                  password: { type: 'string', example: 'admin123' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
      },
    },
    '/products': {
      get: {
        summary: 'List all products with pagination & filters',
        tags: ['Products'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'lowStock', in: 'query', schema: { type: 'boolean' } },
        ],
      },
      post: {
        summary: 'Create a new product',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
      },
    },
    '/customers': {
      get: { summary: 'List customers', tags: ['Customers'] },
      post: { summary: 'Create customer', tags: ['Customers'] },
    },
    '/suppliers': {
      get: { summary: 'List suppliers', tags: ['Suppliers'] },
      post: { summary: 'Create supplier', tags: ['Suppliers'] },
    },
    '/sales-orders': {
      get: { summary: 'List sales orders', tags: ['Sales Orders'] },
      post: { summary: 'Create sales order', tags: ['Sales Orders'] },
    },
    '/purchase-orders': {
      get: { summary: 'List purchase orders', tags: ['Purchase Orders'] },
      post: { summary: 'Create purchase order', tags: ['Purchase Orders'] },
    },
    '/grn': {
      get: { summary: 'List Goods Receipt Notes', tags: ['GRN'] },
      post: { summary: 'Create GRN and auto-update stock', tags: ['GRN'] },
    },
    '/invoices': {
      get: { summary: 'List invoices', tags: ['Invoices'] },
      post: { summary: 'Create invoice', tags: ['Invoices'] },
    },
    '/dashboard/stats': {
      get: { summary: 'Get KPI metrics and chart aggregation data', tags: ['Dashboard'] },
    },
    '/users': {
      get: { summary: 'List users (Admin only)', tags: ['Users'] },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

router.get('/', (req, res) => {
  res.json(apiDocumentation);
});

export default router;
