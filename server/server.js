import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

/*
|--------------------------------------------------------------------------
| Stripe Webhook
|--------------------------------------------------------------------------
|
| IMPORTANTE:
| O webhook precisa ficar ANTES do express.json()
| porque o Stripe precisa do body original para validar a assinatura.
|
|--------------------------------------------------------------------------
*/

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature =
      req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error(
        'Webhook signature verification failed:',
        error.message
      );

      return res.status(400).send(
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
      const session = event.data.object;

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
          metadata.order_type === 'pickup'
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
            productResult.rows.length === 0
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

          const itemSubtotal =
            Number(product.price) *
            quantity;

          await pool.query(
            `
            INSERT INTO order_items (
              order_id,
              product_id,
              product_name,
              unit_price,
              quantity,
              subtotal
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
            `,
            [
              orderId,
              product.id,
              product.name,
              product.price,
              quantity,
              itemSubtotal,
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

    res.json({
      received: true,
    });
  }
);

/*
|--------------------------------------------------------------------------
| JSON
|--------------------------------------------------------------------------
*/

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message:
      'Buenisimo server is running',
  });
});

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

      res.json({
        success: true,
        products: result.rows,
      });
    } catch (error) {
      console.error(
        '❌ Error fetching products:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to load products.',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Admin - listar todos os produtos
|--------------------------------------------------------------------------
*/

app.get('/api/admin/products', async (req, res) => {
  try {
    const result = await pool.query(`
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
    `);

    res.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error(
      '❌ Error loading admin products:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load products.',
    });
  }
});

/*
|--------------------------------------------------------------------------
| Criar produto
|--------------------------------------------------------------------------
*/

app.post(
  '/api/products',
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
          message: 'Invalid price.',
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
            available !== undefined
              ? Boolean(available)
              : true,
          ]
        );

      res.status(201).json({
        success: true,
        product: result.rows[0],
      });
    } catch (error) {
      console.error(
        '❌ Error creating product:',
        error
      );

      res.status(500).json({
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
  async (req, res) => {
    try {
      const { id } = req.params;

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
            available !== undefined
              ? Boolean(available)
              : true,
            id,
          ]
        );

      res.json({
        success: true,
        product: result.rows[0],
      });
    } catch (error) {
      console.error(
        '❌ Error updating product:',
        error
      );

      res.status(500).json({
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
  async (req, res) => {
    try {
      const { id } = req.params;
      const { available } = req.body;

      if (typeof available !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'available must be a boolean.',
        });
      }

      const existingProduct = await pool.query(
        `
        SELECT id
        FROM products
        WHERE id = $1
        `,
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.',
        });
      }

      const result = await pool.query(
        `
        UPDATE products
        SET
          available = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [available, id]
      );

      res.json({
        success: true,
        product: result.rows[0],
      });
    } catch (error) {
      console.error(
        '❌ Error updating product availability:',
        error
      );

      res.status(500).json({
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
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingProduct = await pool.query(
        `
        SELECT id
        FROM products
        WHERE id = $1
        `,
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.',
        });
      }

      const result = await pool.query(
        `
        DELETE FROM products
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

      res.json({
        success: true,
        message: 'Product deleted successfully.',
        product: result.rows[0],
      });
    } catch (error) {
      console.error(
        '❌ Error deleting product:',
        error
      );

      res.status(500).json({
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
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validar produtos e criar line items
      |--------------------------------------------------------------------------
      */

      const lineItems = [];

      for (const item of items) {
        const productResult =
          await pool.query(
            `
            SELECT
              id,
              name,
              price,
              available
            FROM products
            WHERE id = $1
            `,
            [item.id]
          );

        if (
          productResult.rows.length ===
          0
        ) {
          throw new Error(
            `Invalid product: ${item.id}`
          );
        }

        const product =
          productResult.rows[0];

        if (!product.available) {
          throw new Error(
            `Product unavailable: ${product.name}`
          );
        }

        const quantity =
          Number(item.quantity);

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1 ||
          quantity > 50
        ) {
          throw new Error(
            `Invalid quantity for product: ${item.id}`
          );
        }

        lineItems.push({
          price_data: {
            currency: 'usd',

            product_data: {
              name: product.name,
            },

            unit_amount:
              Math.round(
                Number(product.price) *
                  100
              ),
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
          quantity: Number(
            item.quantity
          ),
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

            line_items:
              lineItems,

            customer_email:
              customer.email ||
              undefined,

            metadata: {
              order_type:
                orderType,

              customer_name:
                customer.name ||
                '',

              customer_phone:
                customer.phone ||
                '',

              customer_address:
                customer.address ||
                '',

              customer_city:
                customer.city ||
                '',

              customer_zip_code:
                customer.zipCode ||
                '',

              notes:
                customer.notes ||
                '',

              items:
                JSON.stringify(
                  metadataItems
                ),
            },

            success_url:
              'http://localhost:5173/order-confirmation?session_id={CHECKOUT_SESSION_ID}',

            cancel_url:
              'http://localhost:5173/payment',
          }
        );

      /*
      |--------------------------------------------------------------------------
      | Resposta
      |--------------------------------------------------------------------------
      */

      res.json({
        success: true,
        url: session.url,
      });
    } catch (error) {
      console.error(
        'Stripe error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to create payment session.',
      });
    }
  }
);

// =========================================================
// GET PRODUCT OPTIONS
// =========================================================

app.get(
  '/api/products/:id/options',
  async (req, res) => {
    try {
      const productId =
        Number(req.params.id);

      if (!Number.isInteger(productId)) {
        return res.status(400).json({
          error: 'Invalid product ID.',
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
            o.name;
          `,
          [productId]
        );

      const groups = {};

      for (const row of result.rows) {
        if (!groups[row.option_group_id]) {
          groups[row.option_group_id] = {
            id: row.option_group_id,
            name: row.group_name,
            description:
              row.group_description,
            required: row.required,
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
          id: row.option_id,
          name: row.option_name,
          description:
            row.option_description,
          price_adjustment:
            Number(
              row.price_adjustment || 0
            ),
        });
      }

      res.json(
        Object.values(groups)
      );
    } catch (error) {
      console.error(
        'Error loading product options:',
        error
      );

      res.status(500).json({
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

app.listen(PORT, () => {
  console.log(
    `Buenisimo server running on http://localhost:${PORT}`
  );
});