import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function migrate() {
  try {
    console.log('Starting database table creation...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schemaCreate.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    const connection = await pool.getConnection();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.query(statement);
        successCount++;
        if (successCount % 5 === 0) {
          console.log(`Progress: ${successCount}/${statements.length} statements executed`);
        }
      } catch (error: any) {
        errorCount++;
        // Table already exists errors are okay
        if (error.message.includes('already exists')) {
          console.log(`Table already exists (statement ${i + 1})`);
        } else {
          console.error(`Error executing statement ${i + 1}:`, error.message);
        }
      }
    }

    connection.release();
    console.log(`Database table creation completed!`);
    console.log(`Successful: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

export default migrate;
