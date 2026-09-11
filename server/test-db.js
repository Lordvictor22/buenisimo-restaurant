import pool from './db.js';

try {
  const result = await pool.query('SELECT NOW()');

  console.log('✅ Banco conectado com sucesso!');
  console.log('Hora do banco:', result.rows[0].now);
} catch (error) {
  console.error('❌ Erro ao conectar ao banco:');
  console.error(error.message);
} finally {
  await pool.end();
}