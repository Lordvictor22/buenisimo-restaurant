  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import Stripe from 'stripe';
  import pool from './db.js';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 4242;

  const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
  );

  const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    'http://localhost:5173';

  /*
  |--------------------------------------------------------------------------
  | CORS
  |--------------------------------------------------------------------------
  */

  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'https://buenisimorestaurant.netlify.app',
      ],
    })
  );

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  /*
  |--------------------------------------------------------------------------
  | Stripe Webhook
  |--------------------------------------------------------------------------
  |
  | IMPORTANTE:
  | O webhook precisa ficar ANTES do express.json()
  | porque o Stripe precisa do body original para
  | validar a assinatura.
  |
  |--------------------------------------------------------------------------
  */

  app.post(
    '/api/webhooks/stripe',
    express.raw({
      type: 'application/json',
    }),
    async (req, res) => {
      const signature =
        req.headers['stripe-signature'];

      let event;

      try {
        event =
          stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
          );
      } catch (error) {
        console.error(
          'Webhook signature verification failed:',
          error.message
        );

        return res
          .status(400)
          .send(
            `Webhook Error: ${error.message}`
          );
      }

      console.log(
        'Stripe webhook received:',
        event.type
      );

      /*
      |--------------------------------------------------------------------------
      | Checkout completed
      |--------------------------------------------------------------------------
      */

      if (
        event.type ===
        'checkout.session.completed'
      ) {
        const session =
          event.data.object;

        try {
          console.log(
            'Payment completed!'
          );

          console.log(
            'Session ID:',
            session.id
          );

          console.log(
            'Customer email:',
            session.customer_email
          );

          /*
          |--------------------------------------------------------------------------
          | Dados do cliente
          |--------------------------------------------------------------------------
          */

          const metadata =
            session.metadata || {};

          const customerName =
            metadata.customer_name || '';

          const customerPhone =
            metadata.customer_phone || '';

          const customerEmail =
            session.customer_email || '';

          const orderType =
            metadata.order_type ===
            'pickup'
              ? 'pickup'
              : 'delivery';

          const customerAddress =
            metadata.customer_address ||
            null;

          const customerCity =
            metadata.customer_city ||
            null;

          const customerZipCode =
            metadata.customer_zip_code ||
            null;

          const notes =
            metadata.notes || null;

          /*
          |--------------------------------------------------------------------------
          | Valores do Stripe
          |--------------------------------------------------------------------------
          */

          const total =
            session.amount_total
              ? session.amount_total / 100
              : 0;

          const paymentIntentId =
            typeof session.payment_intent ===
            'string'
              ? session.payment_intent
              : null;

          /*
          |--------------------------------------------------------------------------
          | Evitar pedido duplicado
          |--------------------------------------------------------------------------
          */

          const existingOrder =
            await pool.query(
              `
              SELECT id
              FROM orders
              WHERE stripe_session_id = $1
              `,
              [session.id]
            );

          if (
            existingOrder.rows.length > 0
          ) {
            console.log(
              'Order already exists:',
              existingOrder.rows[0].id
            );

            return res.json({
              received: true,
            });
          }

          /*
          |--------------------------------------------------------------------------
          | Criar pedido
          |--------------------------------------------------------------------------
          */

          const orderResult =
            await pool.query(
              `
              INSERT INTO orders (
                stripe_session_id,
                stripe_payment_intent_id,
                status,
                order_type,
                customer_name,
                customer_phone,
                customer_email,
                address,
                city,
                zip_code,
                notes,
                total_items,
                subtotal,
                total
              )
              VALUES (
                $1,
                $2,
                'paid',
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13
              )
              RETURNING id
              `,
              [
                session.id,
                paymentIntentId,
                orderType,
                customerName,
                customerPhone,
                customerEmail,
                customerAddress,
                customerCity,
                customerZipCode,
                notes,
                0,
                total,
                total,
              ]
            );

          const orderId =
            orderResult.rows[0].id;

          console.log(
            '✅ Order created in database:',
            orderId
          );

          /*
          |--------------------------------------------------------------------------
          | Recuperar itens enviados no metadata
          |--------------------------------------------------------------------------
          */

          let items = [];

          try {
            items = metadata.items
              ? JSON.parse(metadata.items)
              : [];
          } catch (error) {
            console.error(
              '❌ Could not parse order items:',
              error.message
            );

            items = [];
          }

          /*
          |--------------------------------------------------------------------------
          | Salvar itens do pedido
          |--------------------------------------------------------------------------
          */

          let totalItems = 0;

          for (const item of items) {
            const productResult =
              await pool.query(
                `
                SELECT
                  id,
                  name,
                  price
                FROM products
                WHERE id = $1
                `,
                [item.id]
              );

            if (
              productResult.rows.length ===
              0
            ) {
              console.error(
                'Product not found:',
                item.id
              );

              continue;
            }

            const product =
              productResult.rows[0];

            const quantity =
              Number(item.quantity);

            if (
              !Number.isInteger(quantity) ||
              quantity < 1
            ) {
              console.error(
                'Invalid quantity:',
                item.quantity
              );

              continue;
            }

            const selectedOptions = Array.isArray(item.selectedOptions)
              ? item.selectedOptions
              : [];

            const itemSubtotal =
              Number(product.price) *
              quantity;

          await pool.query(
              `
              INSERT INTO order_items (
                order_id,
                product_id,
                quantity,
                price,
                selected_options
              )
              VALUES ($1, $2, $3, $4, $5)
              `,
              [
                orderId,
                product.id,
                quantity,
                Number(product.price),
                JSON.stringify(selectedOptions),
              ]
            );

            totalItems += quantity;
          }

          /*
          |--------------------------------------------------------------------------
          | Atualizar quantidade total de itens
          |--------------------------------------------------------------------------
          */

          await pool.query(
            `
            UPDATE orders
            SET
              total_items = $1,
              updated_at = NOW()
            WHERE id = $2
            `,
            [
              totalItems,
              orderId,
            ]
          );

          console.log(
            '✅ Order items saved:',
            totalItems
          );

          console.log(
            '✅ Order successfully saved to Supabase!'
          );
        } catch (error) {
          console.error(
            '❌ Error saving order:',
            error
          );

          return res.status(500).json({
            received: true,
            success: false,
          });
        }
      }

      return res.json({
        received: true,
      });
    }
  );

  /*
  |--------------------------------------------------------------------------
  | JSON
  |--------------------------------------------------------------------------
  */

  app.use(express.json({ limit: '32kb' }));

  /*
  |--------------------------------------------------------------------------
  | ADMIN LOGIN
  |--------------------------------------------------------------------------
  */

  app.post(
    '/api/admin/login',
    async (req, res) => {
      try {
        const {
          email,
          password,
        } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message:
              'Email and password are required.',
          });
        }

        const normalizedEmail =
          email.toLowerCase().trim();

        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              email,
              password_hash,
              role,
              active
            FROM admin_users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [normalizedEmail]
          );

        if (
          result.rows.length === 0
        ) {
          return res.status(401).json({
            success: false,
            message:
              'Invalid email or password.',
          });
        }

        const admin =
          result.rows[0];

        /*
        |--------------------------------------------------------------------------
        | Verificar conta ativa
        |--------------------------------------------------------------------------
        */

        if (!admin.active) {
          return res.status(403).json({
            success: false,
            message:
              'This account is inactive.',
          });
        }

        /*
        |--------------------------------------------------------------------------
        | Verificar senha
        |--------------------------------------------------------------------------
        */

        const passwordValid =
          await bcrypt.compare(
            password,
            admin.password_hash
          );

        if (!passwordValid) {
          return res.status(401).json({
            success: false,
            message:
              'Invalid email or password.',
          });
        }

        /*
        |--------------------------------------------------------------------------
        | Criar JWT
        |--------------------------------------------------------------------------
        */

        const token =
          jwt.sign(
            {
              id: admin.id,
              email: admin.email,
              role: admin.role,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: '8h',
            }
          );

        /*
        |--------------------------------------------------------------------------
        | Resposta
        |--------------------------------------------------------------------------
        */

        return res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        });
      } catch (error) {
        console.error(
          'Admin login error:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to process login.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Middleware de autenticação administrativa
  |--------------------------------------------------------------------------
  */

  function requireAdmin(
    req,
    res,
    next
  ) {
    try {
      const authHeader =
        req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message:
            'Authentication required.',
        });
      }

      const parts =
        authHeader.split(' ');

      if (
        parts.length !== 2 ||
        parts[0] !== 'Bearer'
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid authentication format.',
        });
      }

      const token =
        parts[1];

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      if (
        !decoded ||
        !decoded.id
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid authentication token.',
        });
      }

      req.admin =
        decoded;

      next();
    } catch (error) {
      console.error(
        'Admin authentication error:',
        error.message
      );

      return res.status(401).json({
        success: false,
        message:
          'Invalid or expired authentication token.',
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Health Check
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/health',
    (req, res) => {
      return res.json({
        success: true,
        message:
          'Buenisimo server is running',
      });
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Listar produtos disponíveis
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/products',
    async (req, res) => {
      try {
        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              description,
              category,
              price,
              image_url,
              available
            FROM products
            WHERE available = TRUE
            ORDER BY id ASC
            `
          );

        return res.json({
          success: true,
          products:
            result.rows,
        });
      } catch (error) {
        console.error(
          '❌ Error fetching products:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to load products.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | ADMIN - DASHBOARD
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/admin/dashboard',
    requireAdmin,
    async (req, res) => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Vendas de hoje
        |--------------------------------------------------------------------------
        */

        const salesResult =
          await pool.query(
            `
            SELECT
              COALESCE(
                SUM(total),
                0
              ) AS today_sales
            FROM orders
            WHERE
              created_at >= CURRENT_DATE
              AND status <> 'cancelled'
            `
          );

        /*
        |--------------------------------------------------------------------------
        | Pedidos de hoje
        |--------------------------------------------------------------------------
        */

        const ordersResult =
          await pool.query(
            `
            SELECT
              COUNT(*) AS today_orders
            FROM orders
            WHERE
              created_at >= CURRENT_DATE
              AND status <> 'cancelled'
            `
          );

        /*
        |--------------------------------------------------------------------------
        | Pedidos pendentes
        |--------------------------------------------------------------------------
        |
        | Consideramos como pendentes todos os pedidos
        | que ainda não estejam concluídos ou cancelados.
        |
        |--------------------------------------------------------------------------
        */

        const pendingResult =
          await pool.query(
            `
            SELECT
              COUNT(*) AS pending_orders
            FROM orders
            WHERE
              status NOT IN (
                'completed',
                'cancelled'
              )
            `
          );

        /*
        |--------------------------------------------------------------------------
        | Clientes
        |--------------------------------------------------------------------------
        */

        const customersResult =
          await pool.query(
            `
            SELECT
              COUNT(
                DISTINCT LOWER(
                  TRIM(customer_email)
                )
              ) AS total_customers
            FROM orders
            WHERE
              customer_email IS NOT NULL
              AND TRIM(customer_email) <> ''
            `
          );

        /*
        |--------------------------------------------------------------------------
        | Resposta
        |--------------------------------------------------------------------------
        */

        return res.json({
          success: true,

          dashboard: {
            todaySales:
              Number(
                salesResult.rows[0]
                  ?.today_sales || 0
              ),

            todayOrders:
              Number(
                ordersResult.rows[0]
                  ?.today_orders || 0
              ),

            pendingOrders:
              Number(
                pendingResult.rows[0]
                  ?.pending_orders || 0
              ),

            totalCustomers:
              Number(
                customersResult.rows[0]
                  ?.total_customers || 0
              ),
          },
        });
      } catch (error) {
        console.error(
          '❌ Error loading admin dashboard:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to load dashboard data.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Admin - listar todos os pedidos
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/admin/orders',
    requireAdmin,
    async (req, res) => {
      try {
        const result =
          await pool.query(
            `
            SELECT
              id,
              customer_name,
              customer_email,
              total AS total_price,
              status,
              order_type,
              created_at
            FROM orders
            ORDER BY created_at DESC, id DESC
            `
          );

        return res.json({
          success: true,
          orders: result.rows,
        });
      } catch (error) {
        console.error(
          '❌ Error loading admin orders:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to load orders.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Admin - listar clientes
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/admin/customers',
    requireAdmin,
    async (req, res) => {
      try {
        const result =
          await pool.query(
            `
            SELECT
              MAX(customer_name) AS customer_name,
              LOWER(TRIM(customer_email)) AS customer_email,
              COUNT(*) AS order_count,
              COALESCE(SUM(total), 0) AS total_spent,
              MAX(created_at) AS last_order_at
            FROM orders
            WHERE customer_email IS NOT NULL
              AND TRIM(customer_email) <> ''
            GROUP BY LOWER(TRIM(customer_email))
            ORDER BY last_order_at DESC
            `
          );

        return res.json({
          success: true,
          customers: result.rows,
        });
      } catch (error) {
        console.error(
          '❌ Error loading admin customers:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to load customers.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Admin - listar todos os produtos
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/admin/products',
    requireAdmin,
    async (req, res) => {
      try {
        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              description,
              category,
              price,
              image_url,
              available,
              created_at,
              updated_at
            FROM products
            ORDER BY id ASC
            `
          );

        return res.json({
          success: true,
          products:
            result.rows,
        });
      } catch (error) {
        console.error(
          '❌ Error loading admin products:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to load products.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Criar produto
  |--------------------------------------------------------------------------
  */

  app.post(
    '/api/products',
    requireAdmin,
    async (req, res) => {
      try {
        const {
          name,
          description,
          category,
          price,
          image_url,
          available,
        } = req.body;

        if (
          !name ||
          !category ||
          price === undefined
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Name, category and price are required.',
          });
        }

        const numericPrice =
          Number(price);

        if (
          !Number.isFinite(
            numericPrice
          ) ||
          numericPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid price.',
          });
        }

        const result =
          await pool.query(
            `
            INSERT INTO products (
              name,
              description,
              category,
              price,
              image_url,
              available
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
            RETURNING *
            `,
            [
              name.trim(),
              description?.trim() ||
                null,
              category.trim(),
              numericPrice,
              image_url?.trim() ||
                null,
              available !==
              undefined
                ? Boolean(
                    available
                  )
                : true,
            ]
          );

        return res.status(201).json({
          success: true,
          product:
            result.rows[0],
        });
      } catch (error) {
        console.error(
          '❌ Error creating product:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to create product.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Editar produto
  |--------------------------------------------------------------------------
  */

  app.put(
    '/api/products/:id',
    requireAdmin,
    async (req, res) => {
      try {
        const { id } =
          req.params;

        const {
          name,
          description,
          category,
          price,
          image_url,
          available,
        } = req.body;

        if (
          !name ||
          !category ||
          price === undefined
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Name, category and price are required.',
          });
        }

        const numericPrice =
          Number(price);

        if (
          !Number.isFinite(
            numericPrice
          ) ||
          numericPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid price.',
          });
        }

        const existingProduct =
          await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = $1
            `,
            [id]
          );

        if (
          existingProduct.rows.length ===
          0
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Product not found.',
          });
        }

        const result =
          await pool.query(
            `
            UPDATE products
            SET
              name = $1,
              description = $2,
              category = $3,
              price = $4,
              image_url = $5,
              available = $6,
              updated_at = NOW()
            WHERE id = $7
            RETURNING *
            `,
            [
              name.trim(),
              description?.trim() ||
                null,
              category.trim(),
              numericPrice,
              image_url?.trim() ||
                null,
              available !==
              undefined
                ? Boolean(
                    available
                  )
                : true,
              id,
            ]
          );

        return res.json({
          success: true,
          product:
            result.rows[0],
        });
      } catch (error) {
        console.error(
          '❌ Error updating product:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to update product.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Alterar disponibilidade
  |--------------------------------------------------------------------------
  */

  app.patch(
    '/api/products/:id/availability',
    requireAdmin,
    async (req, res) => {
      try {
        const { id } =
          req.params;

        const { available } =
          req.body;

        if (
          typeof available !==
          'boolean'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'available must be a boolean.',
          });
        }

        const existingProduct =
          await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = $1
            `,
            [id]
          );

        if (
          existingProduct.rows.length ===
          0
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Product not found.',
          });
        }

        const result =
          await pool.query(
            `
            UPDATE products
            SET
              available = $1,
              updated_at = NOW()
            WHERE id = $2
            RETURNING *
            `,
            [
              available,
              id,
            ]
          );

        return res.json({
          success: true,
          product:
            result.rows[0],
        });
      } catch (error) {
        console.error(
          '❌ Error updating product availability:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to update product availability.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Deletar produto
  |--------------------------------------------------------------------------
  */

  app.delete(
    '/api/products/:id',
    requireAdmin,
    async (req, res) => {
      try {
        const { id } =
          req.params;

        const existingProduct =
          await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = $1
            `,
            [id]
          );

        if (
          existingProduct.rows.length ===
          0
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Product not found.',
          });
        }

        const result =
          await pool.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
            `,
            [id]
          );

        return res.json({
          success: true,
          message:
            'Product deleted successfully.',
          product:
            result.rows[0],
        });
      } catch (error) {
        console.error(
          '❌ Error deleting product:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to delete product.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Stripe Checkout
  |--------------------------------------------------------------------------
  */

  app.post(
    '/api/payment/create-checkout-session',
    async (req, res) => {
      try {
        const {
          items,
          checkoutData,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validar carrinho
        |--------------------------------------------------------------------------
        */

        if (
          !items ||
          !Array.isArray(items) ||
          items.length === 0 ||
          items.length > 50
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Cart is empty or too large.',
          });
        }

        /*
        |--------------------------------------------------------------------------
        | Validar produtos e criar line items
        |--------------------------------------------------------------------------
        */
        const lineItems = [];

  for (const item of items) {
    const productId = Number(item.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    // ========================================
    // VALIDATE PRODUCT
    // ========================================

    const productResult = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        available
      FROM products
      WHERE id = $1
      `,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid product: ${productId}`,
      });
    }

    const product = productResult.rows[0];

    if (!product.available) {
      return res.status(400).json({
        success: false,
        message: `Product unavailable: ${product.name}`,
      });
    }

    // ========================================
    // VALIDATE QUANTITY
    // ========================================

    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 50
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid quantity for product: ${productId}`,
      });
    }

    // ========================================
    // VALIDATE SELECTED OPTIONS
    // ========================================

    const selectedOptions = item.selectedOptions ?? [];

    if (!Array.isArray(selectedOptions)) {
      return res.status(400).json({
        success: false,
        message: `Invalid options for product: ${product.name}`,
      });
    }

    // Get every valid option configured for this product
    const optionsResult = await pool.query(
      `
      SELECT
        pog.id AS product_option_group_id,
        og.id AS option_group_id,
        pog.required,
        pog.min_selections,
        pog.max_selections,
        po.option_id,
        o.name AS option_name,
        o.price_adjustment
      FROM product_option_groups pog
      JOIN option_groups og
        ON og.id = pog.option_group_id
      JOIN product_options po
        ON po.product_option_group_id = pog.id
      JOIN options o
        ON o.id = po.option_id
      WHERE pog.product_id = $1
        AND og.active = TRUE
      `,
      [productId]
    );

    const allowedOptions = new Map();
    const optionGroups = new Map();

    for (const row of optionsResult.rows) {
      const groupId = Number(row.option_group_id);
      const optionId = Number(row.option_id);

      const key = `${groupId}:${optionId}`;

      allowedOptions.set(key, row);

      if (!optionGroups.has(groupId)) {
        optionGroups.set(groupId, {
          optionGroupId: groupId,
          required: Boolean(row.required),
          minSelections: Number(row.min_selections ?? 0),
          maxSelections: Number(
            row.max_selections ?? Number.MAX_SAFE_INTEGER
          ),
        });
      }
    }

    // ========================================
    // CHECK EACH SELECTED OPTION
    // ========================================

    const selectedKeys = new Set();
    const selectedByGroup = new Map();

    for (const selectedOption of selectedOptions) {
      const groupId = Number(selectedOption?.group_id);
      const optionId = Number(selectedOption?.option_id);

      if (
        !Number.isInteger(groupId) ||
        !Number.isInteger(optionId)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid option selection for product: ${product.name}`,
        });
      }

      const key = `${groupId}:${optionId}`;

      // Option does not belong to this product/group
      if (!allowedOptions.has(key)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option selected for product: ${product.name}`,
        });
      }

      // Same option selected more than once
      if (selectedKeys.has(key)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate option selected for product: ${product.name}`,
        });
      }

      selectedKeys.add(key);

      if (!selectedByGroup.has(groupId)) {
        selectedByGroup.set(groupId, 0);
      }

      selectedByGroup.set(
        groupId,
        selectedByGroup.get(groupId) + 1
      );
    }

    // ========================================
    // CHECK GROUP RULES
    // ========================================

    for (const group of optionGroups.values()) {
      const selectedCount =
        selectedByGroup.get(group.optionGroupId) || 0;

      if (selectedCount < group.minSelections) {
        return res.status(400).json({
          success: false,
          message: `Please select the required options for ${product.name}.`,
        });
      }

      if (selectedCount > group.maxSelections) {
        return res.status(400).json({
          success: false,
          message: `Too many options selected for ${product.name}.`,
        });
      }

      if (group.required && selectedCount === 0) {
        return res.status(400).json({
          success: false,
          message: `Please select an option for ${product.name}.`,
        });
      }
    }

  // ========================================
  // CALCULATE AUTHORITATIVE PRICE
  // ========================================

  let finalPrice = Number(product.price);

  for (const selectedOption of selectedOptions) {
    const groupId = Number(selectedOption.group_id);
    const optionId = Number(selectedOption.option_id);

    const optionKey = `${groupId}:${optionId}`;
    const validOption = allowedOptions.get(optionKey);

    // This should already have been validated above,
    // but we keep the check here as an extra safeguard.
    if (!validOption) {
      return res.status(400).json({
        success: false,
        message: `Invalid option selected for product: ${product.name}`,
      });
    }

    finalPrice += Number(validOption.price_adjustment || 0);
  }

  // Prevent invalid database prices from reaching Stripe
  if (!Number.isFinite(finalPrice) || finalPrice < 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid price for product: ${product.name}`,
    });
  }

  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: {
        name: product.name,
      },
      unit_amount: Math.round(finalPrice * 100),
    },
    quantity,
  });
  }

        /*
        |--------------------------------------------------------------------------
        | Dados do cliente
        |--------------------------------------------------------------------------
        */

        const customer =
          checkoutData?.customer ||
          {};

        const customerFields = {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          zipCode: customer.zipCode,
          notes: customer.notes,
        };

        const fieldLimits = {
          name: 100,
          phone: 30,
          email: 254,
          address: 200,
          city: 100,
          zipCode: 20,
          notes: 500,
        };

        for (const [field, value] of Object.entries(customerFields)) {
          if (value !== undefined && value !== null && typeof value !== 'string') {
            return res.status(400).json({
              success: false,
              message: `Invalid customer ${field}.`,
            });
          }

          if (String(value || '').length > fieldLimits[field]) {
            return res.status(400).json({
              success: false,
              message: `Customer ${field} is too long.`,
            });
          }
        }

        const normalizedCustomer = Object.fromEntries(
          Object.entries(customerFields).map(([field, value]) => [
            field,
            String(value || '').trim(),
          ])
        );

        if (
          !normalizedCustomer.name ||
          !normalizedCustomer.phone ||
          !normalizedCustomer.email ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedCustomer.email)
        ) {
          return res.status(400).json({
            success: false,
            message: 'Valid customer name, phone and email are required.',
          });
        }

        if (
          checkoutData?.orderType !== 'pickup' &&
          (!normalizedCustomer.address ||
            !normalizedCustomer.city ||
            !normalizedCustomer.zipCode)
        ) {
          return res.status(400).json({
            success: false,
            message: 'Delivery address, city and ZIP code are required.',
          });
        }

        const orderType =
          checkoutData?.orderType ===
          'pickup'
            ? 'pickup'
            : 'delivery';

        /*
        |--------------------------------------------------------------------------
        | Preparar itens para o webhook
        |--------------------------------------------------------------------------
        */

        const metadataItems =
          items.map((item) => ({
            id: Number(item.id),
            quantity: Number(item.quantity),
            selectedOptions: Array.isArray(item.selectedOptions)
              ? item.selectedOptions.map((option) => ({
                  group_id: Number(option.group_id),
                  option_id: Number(option.option_id),
                }))
              : [],
          }));
        /*
        |--------------------------------------------------------------------------
        | Criar Checkout Session
        |--------------------------------------------------------------------------
        */

        const session =
          await stripe.checkout.sessions.create(
            {
              mode: 'payment',

              locale: 'en',

              line_items:
                lineItems,

              customer_email:
                normalizedCustomer.email ||
                undefined,

              metadata: {
                order_type:
                  orderType,

                customer_name:
                  normalizedCustomer.name ||
                  '',

                customer_phone:
                  normalizedCustomer.phone ||
                  '',

                customer_address:
                  normalizedCustomer.address ||
                  '',

                customer_city:
                  normalizedCustomer.city ||
                  '',

                customer_zip_code:
                  normalizedCustomer.zipCode ||
                  '',

                notes:
                  normalizedCustomer.notes ||
                  '',

                items:
                  JSON.stringify(
                    metadataItems
                  ),
              },

              success_url:
                `${FRONTEND_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,

              cancel_url:
                `${FRONTEND_URL}/payment`,
            }
          );

        /*
        |--------------------------------------------------------------------------
        | Resposta
        |--------------------------------------------------------------------------
        */

        return res.json({
          success: true,
          url:
            session.url,
        });
      } catch (error) {
        console.error(
          'Stripe error:',
          error
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to create payment session.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | GET PRODUCT OPTIONS
  |--------------------------------------------------------------------------
  */

  app.get(
    '/api/products/:id/options',
    async (req, res) => {
      try {
        const productId =
          Number(
            req.params.id
          );

        if (
          !Number.isInteger(
            productId
          )
        ) {
          return res.status(400).json({
            error:
              'Invalid product ID.',
          });
        }

        const result =
          await pool.query(
            `
            SELECT
              pog.id AS product_option_group_id,
              og.id AS option_group_id,
              og.name AS group_name,
              og.description AS group_description,
              pog.required,
              pog.min_selections,
              pog.max_selections,
              po.id AS product_option_id,
              o.id AS option_id,
              o.name AS option_name,
              o.description AS option_description,
              o.price_adjustment
            FROM product_option_groups pog
            JOIN option_groups og
              ON og.id = pog.option_group_id
            JOIN product_options po
              ON po.product_option_group_id = pog.id
            JOIN options o
              ON o.id = po.option_id
            WHERE pog.product_id = $1
              AND og.active = TRUE
            ORDER BY
              pog.display_order,
              po.display_order,
              o.name
            `,
            [productId]
          );

        const groups = {};

        for (
          const row of result.rows
        ) {
          if (
            !groups[
              row.option_group_id
            ]
          ) {
            groups[
              row.option_group_id
            ] = {
              id:
                row.option_group_id,

              name:
                row.group_name,

              description:
                row.group_description,

              required:
                row.required,

              min_selections:
                row.min_selections,

              max_selections:
                row.max_selections,

              options: [],
            };
          }

          groups[
            row.option_group_id
          ].options.push({
            id:
              row.option_id,

            name:
              row.option_name,

            description:
              row.option_description,

            price_adjustment:
              Number(
                row.price_adjustment ||
                  0
              ),
          });
        }

        return res.json(
          Object.values(groups)
        );
      } catch (error) {
        console.error(
          'Error loading product options:',
          error
        );

        return res.status(500).json({
          error:
            'Unable to load product options.',
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Start server
  |--------------------------------------------------------------------------
  */

  app.listen(
  PORT,
  async () => {
    console.log(
      `Buenisimo server running on http://localhost:${PORT}`
    );

    try {
      const result = await pool.query(`
        SELECT
          current_database() AS database_name,
          current_user AS database_user,
          inet_server_addr() AS server_address,
          inet_server_port() AS server_port,
          (SELECT COUNT(*) FROM orders) AS total_orders,
          (SELECT MAX(id) FROM orders) AS ultimo_id;
      `);

      console.log(
        '🔌 Database connection:',
        result.rows[0]
      );
    } catch (error) {
      console.error(
        '❌ Database connection check failed:',
        error.message
      );
    }
  }
);